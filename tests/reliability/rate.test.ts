import { afterEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { consumeRateLimit, RateStoreUnavailable } from "@/lib/reliability/rate-limit";
afterEach(() => vi.unstubAllEnvs());
it("uses an atomic bounded PostgreSQL admission operation with hashed keys", async () => {
    vi.stubEnv("SESSION_SECRET", "synthetic-private-signing-secret");
    const query = vi.fn().mockResolvedValueOnce([{ retry: 0 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ retry: 28 }]);
    const db = { $transaction: (work: (tx: unknown) => unknown) => work({ $queryRaw: query, $executeRaw: vi.fn().mockResolvedValue(0) }) } as unknown as PrismaClient;
    expect(await consumeRateLimit("city:austin", "192.0.2.10", 10, 600000, db)).toMatchObject({ allowed: true, retryAfterSec: 0 });
    expect(await consumeRateLimit("city:austin", "192.0.2.10", 10, 600000, db)).toEqual({ allowed: false, retryAfterSec: 28 });
    const sql = query.mock.calls[0][0].join("?");
    expect(sql).toContain('ON CONFLICT ("key") DO UPDATE');
    expect(sql).toContain('"HttpRateLimit"."count" <');
    expect(JSON.stringify(query.mock.calls)).not.toContain("192.0.2.10");
    expect(JSON.stringify(query.mock.calls)).not.toContain("synthetic-private-signing-secret");
});
it("never falls back to process memory when the store/signing configuration fails", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    await expect(consumeRateLimit("access", "synthetic", 1, 1000)).rejects.toBeInstanceOf(RateStoreUnavailable);
    vi.stubEnv("SESSION_SECRET", "synthetic-key");
    await expect(consumeRateLimit("access", "synthetic", 1, 1000, { $transaction: vi.fn().mockRejectedValue(new Error("Synthetic outage")) } as unknown as PrismaClient)).rejects.toBeInstanceOf(RateStoreUnavailable);
});
