import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { readCookie } from "./request-cookie";
export const PROGRAM_INVITATION_COOKIE = "l2e_program_invitation";
export const invitationHash = (code: string) =>
  createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
export async function invitedProgram(
  db: Prisma.TransactionClient,
  code: string,
) {
  const invitation = await db.programInvitation.findFirst({
    where: {
      tokenHash: invitationHash(code),
      isActive: true,
      expiresAt: { gt: new Date() },
      program: { isActive: true, organization: { isActive: true } },
    },
  });
  return invitation?.programId ?? null;
}
/** Account ownership is proven by credentials/signed guest session before association.
 * Invitations never transfer an already enrolled account or let callers select a user ID. */
export async function enrollFromInvitation(
  req: Request,
  db: Prisma.TransactionClient,
  userId: string,
) {
  const code = readCookie(req, PROGRAM_INVITATION_COOKIE);
  if (!code) return null;
  const programId = await invitedProgram(db, code);
  if (!programId) return null;
  const existing = await db.participantEnrollment.findUnique({
    where: { userId },
  });
  if (existing) return existing.programId;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { programEnrollmentState: true },
  });
  if (user?.programEnrollmentState !== "invitation_eligible") return null; // Reviewed legacy mapping is mandatory.
  await db.participantEnrollment.create({
    data: { userId, programId, status: "active" },
  });
  await db.auditLog.create({
    data: {
      programId,
      action: "PARTICIPANT_ENROLLED_BY_INVITATION",
      entity: "User",
      entityId: userId,
    },
  });
  return programId;
}
