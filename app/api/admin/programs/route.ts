import { apiServerError } from "@/lib/api-helpers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  staffSession,
  createStaffSession,
  writeStaffCookie,
  SESSION_COOKIE,
} from "@/lib/admin-auth";
import { readCookie, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk, parseJson } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const token = readCookie(req, SESSION_COOKIE),
      s = token ? await staffSession(token) : null;
    if (!s?.mfaVerifiedAt || s.admin.mustChangePassword)
      return apiError("unauthorized", "Complete staff sign-in first.", 401);
    const memberships = await prisma.staffMembership.findMany({
      where: {
        adminId: s.adminId,
        isActive: true,
        revokedAt: null,
        program: { isActive: true, organization: { isActive: true } },
      },
      select: {
        role: true,
        program: {
          select: {
            id: true,
            name: true,
            organization: { select: { name: true } },
          },
        },
      },
    });
    return apiOk({ memberships, activeProgramId: s.activeProgramId });
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const token = readCookie(req, SESSION_COOKIE),
      initial = token ? await staffSession(token) : null;
    if (!initial?.mfaVerifiedAt || initial.admin.mustChangePassword || !token)
      return apiError("unauthorized", "Complete staff sign-in first.", 401);
    const p = await parseJson(
      req,
      z.object({ programId: z.string().min(1).max(120) }).strict(),
    );
    if (!p.ok) return p.response;
    const result = await prisma.$transaction(async (tx) => {
      const s = await staffSession(token, tx);
      if (!s?.mfaVerifiedAt) return null;
      const membership = await tx.staffMembership.findFirst({
        where: {
          adminId: s.adminId,
          programId: p.data.programId,
          isActive: true,
          revokedAt: null,
          program: { isActive: true, organization: { isActive: true } },
        },
      });
      if (!membership) return null;
      await tx.adminSession.update({
        where: { id: s.id },
        data: { revokedAt: new Date() },
      });
      const next = await createStaffSession(
        tx,
        s.adminId,
        true,
        membership.programId,
      );
      // Switching does not extend the absolute lifetime originally granted after MFA.
      await tx.adminSession.updateMany({
        where: {
          token: (await import("@/lib/staff-security")).staffTokenHash(next),
        },
        data: { expiresAt: s.expiresAt, mfaVerifiedAt: s.mfaVerifiedAt },
      });
      await tx.auditLog.create({
        data: {
          programId: membership.programId,
          adminId: s.adminId,
          action: "STAFF_PROGRAM_SELECTED",
          entity: "Program",
          entityId: membership.programId,
        },
      });
      return next;
    });
    if (!result)
      return apiError(
        "forbidden",
        "This program is not available to this staff session.",
        403,
      );
    const res = apiOk();
    writeStaffCookie(res, result);
    return res;
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
