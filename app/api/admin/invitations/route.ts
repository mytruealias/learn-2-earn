import { lockStaffScope } from "@/lib/program-scope";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { invitationHash } from "@/lib/program-enrollment";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
export async function POST(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    const p = await parseJson(
      req,
      z.discriminatedUnion("action", [
        z.object({ action: z.literal("create") }).strict(),
        z
          .object({
            action: z.literal("revoke"),
            id: z.string().min(1).max(120),
          })
          .strict(),
      ]),
    );
    if (!p.ok) return p.response;
    const d = p.data,
      code = randomBytes(24).toString("hex").toUpperCase();
    const result = await prisma.$transaction(async (tx) => {
      await lockStaffScope(tx, a);
      const current = await getAdminFromRequest(req, tx);
      if (!current || current.role !== "admin") return null;
      if (d.action === "create") {
        const invitation = await tx.programInvitation.create({
          data: {
            programId: a.programId,
            tokenHash: invitationHash(code),
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
        await tx.auditLog.create({
          data: {
            programId: a.programId,
            adminId: a.id,
            action: "PROGRAM_INVITATION_CREATED",
            entity: "ProgramInvitation",
            entityId: invitation.id,
          },
        });
        return { code, id: invitation.id, expiresAt: invitation.expiresAt };
      }
      const found = await tx.programInvitation.findFirst({
        where: { id: d.id, programId: a.programId },
      });
      if (!found) return null;
      await tx.programInvitation.update({
        where: { id: found.id },
        data: { isActive: false },
      });
      await tx.auditLog.create({
        data: {
          programId: a.programId,
          adminId: a.id,
          action: "PROGRAM_INVITATION_REVOKED",
          entity: "ProgramInvitation",
          entityId: found.id,
        },
      });
      return { revoked: true };
    });
    return result
      ? apiOk(result, { headers: { "Cache-Control": "private, no-store" } })
      : apiError("not_found", "Invitation unavailable.", 404);
  } catch (e) {
    return apiServerError("program/invitations", e);
  }
}
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    return apiOk({
      invitations: await prisma.programInvitation.findMany({
        where: { programId: a.programId },
        take: 100,
        select: { id: true, expiresAt: true, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    });
  } catch (e) {
    return apiServerError("program/invitations", e);
  }
}
