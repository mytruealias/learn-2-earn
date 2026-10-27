import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { apiError, apiOk } from "@/lib/api-helpers";
import { staffWrite, rewardError } from "@/lib/rewards/http";
import { audit, financialLock, RewardIssue } from "@/lib/rewards/accounting";
import { keySchema } from "@/lib/rewards/requests";
import { MAX_CENTS } from "@/lib/rewards/money";
const schema = z
  .object({
    requestKey: keySchema,
    amountCents: z
      .number()
      .int()
      .min(-MAX_CENTS)
      .max(MAX_CENTS)
      .refine((n) => n !== 0),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (!["admin", "finance"].includes(a.role))
      return apiError("forbidden", "Finance access required.", 403);
    return apiOk({
      pool: await prisma.poolBalance.findUnique({ where: { id: "singleton" } }),
      adjustments: await prisma.poolAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amountCents: true, reason: true, createdAt: true },
      }),
    });
  } catch (e) {
    return rewardError(e);
  }
}
export async function POST(req: Request) {
  return staffWrite(
    req,
    schema,
    ["admin", "finance"],
    async (tx, admin, data) => {
      await financialLock(tx);
      await tx.poolBalance.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", balanceCents: 0 },
        update: {},
      });
      await tx.$queryRaw`SELECT "id" FROM "PoolBalance" WHERE "id"='singleton' FOR UPDATE`;
      const prior = await tx.poolAdjustment.findUnique({
        where: { requestKey: data.requestKey },
      });
      if (prior) {
        if (
          prior.adminId !== admin.id ||
          prior.amountCents !== data.amountCents ||
          prior.reason !== data.reason
        )
          throw new RewardIssue(
            "conflict",
            "Adjustment key already used with different details.",
          );
        return {
          pool: await tx.poolBalance.findUnique({ where: { id: "singleton" } }),
          replayed: true,
        };
      }
      const p = await tx.poolBalance.findUniqueOrThrow({
          where: { id: "singleton" },
        }),
        next = p.balanceCents + data.amountCents;
      if (next < 0 || next > MAX_CENTS)
        throw new RewardIssue(
          "insufficient_funds",
          "Adjustment would make the bookkeeping pool negative or exceed its exact storage range.",
          400,
        );
      const pool = await tx.poolBalance.update({
        where: { id: "singleton" },
        data: { balanceCents: next, updatedById: admin.id },
      });
      const adjustment = await tx.poolAdjustment.create({
        data: {
          adminId: admin.id,
          amountCents: data.amountCents,
          reason: data.reason,
          requestKey: data.requestKey,
        },
      });
      await audit(tx, "POOL_ADJUSTED", pool.id, admin.id, {
        adjustmentId: adjustment.id,
        amountCents: data.amountCents,
        balanceCents: pool.balanceCents,
      });
      return { pool, adjustment };
    },
  );
}
