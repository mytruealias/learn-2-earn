import { getAdminFromRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { apiError, apiOk, parseQuery } from "@/lib/api-helpers";
import { z } from "zod";
import { payoutDto } from "@/lib/rewards/accounting";
import { staffWrite, rewardError } from "@/lib/rewards/http";
import { decisionSchema, decideReward } from "@/lib/rewards/requests";
const query = z.object({
  status: z
    .enum([
      "pending",
      "reviewed",
      "approved",
      "completed",
      "rejected",
      "cancelled",
      "all",
    ])
    .default("pending"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Sign in as staff.", 401);
    if (!["admin", "caseworker", "finance"].includes(admin.role))
      return apiError("forbidden", "Staff review access required.", 403);
    const q = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      query,
    );
    if (!q.ok) return q.response;
    const where = q.data.status === "all" ? {} : { status: q.data.status };
    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.data.page - 1) * 20,
        take: 20,
        include: {
          user: { select: { fullName: true } },
          rewardEntries: {
            orderBy: { createdAt: "asc" },
            select: { kind: true, toStatus: true, createdAt: true },
          },
        },
      }),
      prisma.payoutRequest.count({ where }),
    ]);
    return apiOk(
      {
        payouts: payouts.map((p) => ({
          ...payoutDto(p, p.rewardEntries),
          user: { fullName: p.user.fullName },
        })),
        pagination: {
          page: q.data.page,
          total,
          totalPages: Math.ceil(total / 20),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return rewardError(e);
  }
}
export async function PATCH(req: Request) {
  return staffWrite(
    req,
    decisionSchema,
    ["admin", "caseworker", "finance"],
    decideReward,
  );
}
