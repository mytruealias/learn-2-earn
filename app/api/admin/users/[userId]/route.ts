import { staffWrite } from "@/lib/rewards/http";
import {
  audit,
  financialLock,
  hash,
  payoutDto,
  rewardSummary,
  RewardIssue,
  userLock,
} from "@/lib/rewards/accounting";
import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import {
  apiError,
  apiOk,
  apiServerError,
  parseParam,
  idParamSchema,
  getClientIp,
} from "@/lib/api-helpers";

const PatchSchema = z.object({
  requestKey: z.string().uuid().optional(),
  caseNumber: z.string().max(60).optional(),
  xpAdjustment: z.number().int().min(-100000).max(100000).optional(),
  xpReason: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { userId: rawUserId } = await params;
    const idCheck = parseParam(rawUserId, idParamSchema, "userId");
    if (!idCheck.ok) return idCheck.response;
    const userId = idCheck.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: {
              select: {
                title: true,
                xpReward: true,
                module: {
                  select: { title: true, path: { select: { title: true } } },
                },
              },
            },
          },
          orderBy: { completedAt: "desc" },
        },
        payoutRequests: { orderBy: { createdAt: "desc" } },
        consents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!user) return apiError("not_found", "User not found", 404);

    await logAudit({
      adminId: admin.id,
      action: "VIEW_USER_DETAIL",
      entity: "User",
      entityId: userId,
      ipAddress: getClientIp(req),
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return apiOk({
      user: {
        ...safeUser,
        payoutRequests: user.payoutRequests.map((p) => payoutDto(p)),
        rewards: await prisma.$transaction((tx) => rewardSummary(tx, userId)),
      },
    });
  } catch (error) {
    return apiServerError("admin/users/get", error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return staffWrite(
    req,
    PatchSchema,
    ["admin", "finance", "caseworker"],
    async (tx, admin, data) => {
      await financialLock(tx);
      await userLock(tx, userId);
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { rewardAccount: true },
      });
      if (!user) throw new RewardIssue("not_found", "Learner not found.", 404);
      const adjustment = data.xpAdjustment || 0;
      if (adjustment) {
        if (!["admin", "finance"].includes(admin.role))
          throw new RewardIssue(
            "forbidden",
            "Only admin or finance may correct reward entitlement.",
            403,
          );
        if (!data.requestKey || !data.xpReason?.trim())
          throw new RewardIssue(
            "validation_error",
            "A request key and reason are required for reward corrections.",
            400,
          );
        const a = user.rewardAccount;
        if (!a || a.learningXp !== user.totalXp)
          throw new RewardIssue(
            "reconciliation_required",
            "Reconcile this account before a correction.",
          );
        const key = `correction:${data.requestKey}`,
          fingerprint = hash(data),
          prior = await tx.rewardEntry.findUnique({
            where: { userId_sourceKey: { userId, sourceKey: key } },
          });
        if (prior) {
          if (
            JSON.parse(prior.metadata).payloadHash !== fingerprint ||
            prior.adminId !== admin.id
          )
            throw new RewardIssue(
              "conflict",
              "Correction key used with different details.",
            );
          return {
            user: { id: userId, totalXp: user.totalXp },
            replayed: true,
          };
        }
        if (
          a.availableXp + adjustment < 0 ||
          a.creditedXp + adjustment > 2147483647
        )
          throw new RewardIssue(
            "insufficient_balance",
            "A correction cannot consume reserved/spent entitlement or exceed storage range.",
            400,
          );
        await tx.rewardAccount.update({
          where: { userId },
          data: {
            availableXp: { increment: adjustment },
            creditedXp: { increment: adjustment },
          },
        });
        await tx.rewardEntry.create({
          data: {
            userId,
            adminId: admin.id,
            sourceKey: key,
            kind: "staff-correction",
            availableDelta: adjustment,
            creditedDelta: adjustment,
            metadata: JSON.stringify({
              payloadHash: fingerprint,
              reason: data.xpReason,
            }),
          },
        });
      }
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(data.caseNumber !== undefined
            ? { caseNumber: data.caseNumber || null }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
      await audit(tx, "USER_UPDATED_WITH_REWARD_CORRECTION", userId, admin.id, {
        rewardAdjustment: adjustment,
        reason: data.xpReason || null,
      });
      const { passwordHash: _password, ...safe } = updated;
      void _password;
      return { user: { ...safe, rewards: await rewardSummary(tx, userId) } };
    },
  );
}
