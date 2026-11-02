import { createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
export type RateDecision = {
    allowed: boolean;
    retryAfterSec: number;
    release?: () => Promise<void>;
};
export class RateStoreUnavailable extends Error {
}
/** Admission reserves one shared slot. Failed-only gates refund that slot on success, never another request’s failures. */
export async function consumeRateLimit(namespace: string, identifier: string, maximum: number, windowMs: number, provided?: PrismaClient): Promise<RateDecision> {
    const secret = process.env.SESSION_SECRET;
    if (!secret || !/^[a-z][a-z0-9:-]{0,70}$/.test(namespace) || !Number.isInteger(maximum) || maximum < 1 || !Number.isInteger(windowMs) || windowMs < 1000)
        throw new RateStoreUnavailable();
    const key = createHmac("sha256", secret).update(`${namespace}\0${identifier}`).digest("hex");
    try {
        const db = provided || (await import("../prisma")).default;
        return await db.$transaction(async (tx) => {
            await tx.$executeRaw `SET LOCAL statement_timeout = '3000ms'`;
            await tx.$executeRaw `SET LOCAL lock_timeout = '1000ms'`;
            const admitted = await tx.$queryRaw<{
                window: string;
            }[]> `
      INSERT INTO "HttpRateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, timezone('UTC', CURRENT_TIMESTAMP) + ${windowMs} * INTERVAL '1 millisecond')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "HttpRateLimit"."resetAt" <= timezone('UTC', CURRENT_TIMESTAMP) THEN 1 ELSE "HttpRateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "HttpRateLimit"."resetAt" <= timezone('UTC', CURRENT_TIMESTAMP) THEN timezone('UTC', CURRENT_TIMESTAMP) + ${windowMs} * INTERVAL '1 millisecond' ELSE "HttpRateLimit"."resetAt" END
      WHERE "HttpRateLimit"."resetAt" <= timezone('UTC', CURRENT_TIMESTAMP) OR "HttpRateLimit"."count" < ${maximum}
      RETURNING "resetAt"::text AS "window"`;
            if (admitted.length) {
                let released = false;
                const window = admitted[0].window;
                return { allowed: true, retryAfterSec: 0, release: async () => {
                        if (released)
                            return;
                        released = true;
                        try {
                            await db.$transaction(async (releaseTx) => {
                                await releaseTx.$executeRaw `SET LOCAL statement_timeout = '3000ms'`;
                                await releaseTx.$executeRaw `SET LOCAL lock_timeout = '1000ms'`;
                                const rows = await releaseTx.$queryRaw<{
                                    count: number;
                                }[]> `SELECT "count" FROM "HttpRateLimit" WHERE "key"=${key} AND "resetAt"=${window}::timestamp FOR UPDATE`;
                                if (!rows.length)
                                    return;
                                if (rows[0].count === 1)
                                    await releaseTx.$executeRaw `DELETE FROM "HttpRateLimit" WHERE "key"=${key} AND "resetAt"=${window}::timestamp`;
                                else
                                    await releaseTx.$executeRaw `UPDATE "HttpRateLimit" SET "count"="count"-1 WHERE "key"=${key} AND "resetAt"=${window}::timestamp`;
                            }, { maxWait: 2000, timeout: 5000 });
                        }
                        catch {
                            released = false;
                            throw new RateStoreUnavailable();
                        }
                    } };
            }
            const rows = await tx.$queryRaw<{
                retry: number;
            }[]> `SELECT GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("resetAt" - timezone('UTC', CURRENT_TIMESTAMP)))))::integer AS retry FROM "HttpRateLimit" WHERE "key"=${key}`;
            return { allowed: false, retryAfterSec: rows[0]?.retry || Math.ceil(windowMs / 1000) };
        }, { maxWait: 2000, timeout: 5000 });
    }
    catch {
        throw new RateStoreUnavailable();
    }
}
