import { apiServerError } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { staffSession, SESSION_COOKIE } from "@/lib/admin-auth";
import { readCookie, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const token = readCookie(req, SESSION_COOKIE),
      s = token ? await staffSession(token) : null;
    if (!s?.mfaVerifiedAt || s.admin.mustChangePassword)
      return apiError("unauthorized", "Complete staff sign-in.", 401);
    return apiOk({
      recoveryCodesRemaining: await prisma.staffRecoveryCode.count({
        where: { adminId: s.adminId, usedAt: null },
      }),
      otherSessions: await prisma.adminSession.count({
        where: {
          adminId: s.adminId,
          id: { not: s.id },
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    });
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
export async function DELETE(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const token = readCookie(req, SESSION_COOKIE),
      s = token ? await staffSession(token) : null;
    if (!s?.mfaVerifiedAt || s.admin.mustChangePassword)
      return apiError("unauthorized", "Complete staff sign-in.", 401);
    await prisma.$transaction(async (tx) => {
      await tx.adminSession.updateMany({
        where: { adminId: s.adminId, id: { not: s.id }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          adminId: s.adminId,
          action: "STAFF_OTHER_SESSIONS_REVOKED",
          entity: "AdminUser",
          entityId: s.adminId,
        },
      });
    });
    return apiOk();
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
