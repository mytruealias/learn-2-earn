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
import { scopedDb } from "@/lib/program-scope";
import {
  apiError,
  apiOk,
  apiServerError,
  parseParam,
  idParamSchema,
  getClientIp,
} from "@/lib/api-helpers";

const PatchSchema = z.object({
  requestKey: z.string().uuid(),
  expectedVersion: z.number().int().nonnegative(),
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
    const prisma = scopedDb(admin);

    const { userId: rawUserId } = await params;
    const idCheck = parseParam(rawUserId, idParamSchema, "userId");
    if (!idCheck.ok) return idCheck.response;
    const userId = idCheck.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        caseNumber: true,
        isActive: true,
        staffVersion: true,
        totalXp: true,
        streak: true,
        createdAt: true,
        lastActiveAt: true,
        consentGiven: true,
        consentAt: true,
        progress: {
          take: 100,
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            completedAt: true,
            xpEarned: true,
            lesson: {
              select: {
                title: true,
                module: {
                  select: { title: true, path: { select: { title: true } } },
                },
              },
            },
          },
        },
        payoutRequests: { take: 100, orderBy: { createdAt: "desc" } },
        consents: {
          take: 100,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            consentType: true,
            version: true,
            granted: true,
            createdAt: true,
          },
        },
        cases: {
          take: 20,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, status: true, updatedAt: true },
        },
        _count: {
          select: { progress: true, payoutRequests: true, cases: true },
        },
      },
    });

    if (!user) return apiError("not_found", "User not found", 404);

    await logAudit({
      programId: admin.programId,
      adminId: admin.id,
      action: "VIEW_USER_DETAIL",
      entity: "User",
      entityId: userId,
      ipAddress: getClientIp(req),
    });

    const safeUser = user;
    if (admin.role === "finance")
      return apiOk({
        user: {
          id: user.id,
          staffVersion: user.staffVersion,
          fullName: user.fullName,
          email: user.email,
          totalXp: user.totalXp,
          payoutRequests: user.payoutRequests.map((p) => payoutDto(p)),
          rewards: await prisma.$transaction((tx) => rewardSummary(tx, userId)),
        },
      });
    return apiOk({
      user: {
        ...safeUser,
        payoutRequests: user.payoutRequests.map((p) => payoutDto(p)),
        rewards: await prisma.$transaction((tx) => rewardSummary(tx, userId)),
        activity: await prisma.auditLog.findMany({
          where: { entityId: userId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            action: true,
            createdAt: true,
            admin: { select: { fullName: true } },
          },
        }),
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
      if (
        admin.role === "finance" &&
        (data.isActive !== undefined || data.caseNumber !== undefined)
      )
        throw new RewardIssue(
          "forbidden",
          "Finance cannot change participant case or access status.",
          403,
        );
      const sourceHash = hash({ userId, data }),
        oldReceipt = await tx.staffActionReceipt.findUnique({
          where: {
            programId_requestKey: {
              programId: admin.programId,
              requestKey: data.requestKey,
            },
          },
        });
      if (oldReceipt) {
        if (
          oldReceipt.payloadHash !== sourceHash ||
          oldReceipt.adminId !== admin.id ||
          oldReceipt.entity !== "User" ||
          oldReceipt.entityId !== userId ||
          oldReceipt.action !== "update"
        )
          throw new RewardIssue(
            "conflict",
            "Action key already used with different details.",
          );
        return { replayed: true, user: { id: userId } };
      }
      if (user.staffVersion !== data.expectedVersion)
        throw new RewardIssue(
          "conflict",
          "Another staff member updated this participant. Reload and review before saving.",
        );
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
          staffVersion: { increment: 1 },
          ...(data.caseNumber !== undefined
            ? { caseNumber: data.caseNumber || null }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
      if (data.isActive === false)
        await tx.learnerSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      await tx.staffActionReceipt.create({
        data: {
          programId: admin.programId,
          adminId: admin.id,
          requestKey: data.requestKey,
          payloadHash: sourceHash,
          entity: "User",
          entityId: userId,
          action: "update",
          version: updated.staffVersion,
        },
      });
      await audit(tx, "USER_UPDATED_WITH_REWARD_CORRECTION", userId, admin.id, {
        fromActive:user.isActive,toActive:updated.isActive,fromCaseNumber:user.caseNumber,toCaseNumber:updated.caseNumber,fromVersion:user.staffVersion,toVersion:updated.staffVersion,
        rewardAdjustment: adjustment,
        reason: data.xpReason || null,
      });
      const { passwordHash: _password, ...safe } = updated;
      void _password;
      return { user: { ...safe, rewards: await rewardSummary(tx, userId) } };
    },
  );
}
