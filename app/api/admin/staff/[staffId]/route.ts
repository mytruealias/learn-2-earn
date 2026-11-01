import { lockStaffScope } from "@/lib/program-scope";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { legacyRole } from "@/lib/program-scope";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> },
) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    const { staffId } = await params;
    const p = await parseJson(
      req,
      z
        .object({
          isActive: z.boolean(),
          expectedVersion: z.number().int().nonnegative(),
          requestKey: z.string().uuid(),
        })
        .strict(),
    );
    if (!p.ok) return p.response;
    if (staffId === a.id)
      return apiError(
        "bad_request",
        "You cannot deactivate your own membership.",
        400,
      );
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Program" WHERE "id"=${a.programId} FOR UPDATE`;
      await lockStaffScope(tx, a);
      const current = await getAdminFromRequest(req, tx);
      if (!current || current.role !== "admin") return null;
      const fingerprint = (await import("@/lib/rewards/accounting")).hash({
        staffId,
        ...p.data,
      });
      const receipt = await tx.staffActionReceipt.findUnique({
        where: {
          programId_requestKey: {
            programId: a.programId,
            requestKey: p.data.requestKey,
          },
        },
      });
      if (receipt) {
        if (receipt.payloadHash !== fingerprint || receipt.adminId !== a.id)
          throw new (await import("@/lib/program-scope")).ScopeError(
            409,
            "Action key was already used.",
          );
        return { id: staffId, replayed: true };
      }
      const m = await tx.staffMembership.findUnique({
        where: {
          adminId_programId: { adminId: staffId, programId: a.programId },
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              fullName: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
        },
      });
      if (!m) return null;
      if (m.version !== p.data.expectedVersion)
        throw new (await import("@/lib/program-scope")).ScopeError(
          409,
          "Another administrator changed this membership. Reload before confirming again.",
        );
      await tx.staffMembership.update({
        where: { id: m.id },
        data: {
          version: { increment: 1 },
          isActive: p.data.isActive,
          revokedAt: p.data.isActive ? null : new Date(),
        },
      });
      if (!p.data.isActive)
        await tx.adminSession.updateMany({
          where: {
            adminId: staffId,
            activeProgramId: a.programId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          programId: a.programId,
          adminId: a.id,
          action: p.data.isActive
            ? "PROGRAM_MEMBERSHIP_REACTIVATED"
            : "PROGRAM_MEMBERSHIP_REVOKED",
          entity: "StaffMembership",
          entityId: m.id,
        },
      });
      await tx.staffActionReceipt.create({
        data: {
          programId: a.programId,
          adminId: a.id,
          requestKey: p.data.requestKey,
          payloadHash: fingerprint,
          entity: "StaffMembership",
          entityId: m.id,
          action: "membership",
          version: m.version + 1,
        },
      });
      return {
        ...m.admin,
        version: m.version + 1,
        role: legacyRole(m.role),
        isActive: p.data.isActive,
      };
    });
    return result
      ? apiOk({ staff: result })
      : apiError(
          "not_found",
          "Membership not found in your active program.",
          404,
        );
  } catch (e) {
    return apiServerError("staff/membership", e);
  }
}
