import { z } from "zod";
import type { Case } from "@prisma/client";
import prisma from "../prisma";
import { hash, RewardIssue, userLock } from "../rewards/accounting";
import { getUserIdFromRequest } from "../user-session";
export const supportRequestSchema = z
  .object({
    requestKey: z.string().uuid(),
    expectedAccountId: z.string().min(1).max(120),
    message: z.string().trim().min(1).max(2000),
    shareLocation: z.boolean(),
    location: z.string().trim().max(300).nullable().optional(),
  })
  .strict()
  .superRefine((d, c) => {
    if (d.location && !d.shareLocation)
      c.addIssue({
        code: "custom",
        message: "Choose location sharing before adding a location.",
      });
  });
export function supportReceipt(c: Case) {
  let recipient: {
    programName?: string;
    teamName?: string;
    monitoring?: string;
  } | null = null;
  try {
    recipient = JSON.parse(c.intakeSnapshot || "null");
  } catch {
    /* Legacy data is not invented. */
  }
  return {
    caseId: c.id,
    requestKey: c.intakeKey,
    createdAt: c.createdAt,
    status: c.status,
    acknowledgedAt: c.acknowledgedAt,
    acknowledged: !!c.acknowledgedAt,
    recipient,
  };
}
export async function supportIntakeMetadata(req: Request) {
  const id = await getUserIdFromRequest(req);
  if (!id) return { accountId: null, intake: null };
  const e = await prisma.participantEnrollment.findFirst({
    where: {
      userId: id,
      status: "active",
      program: { isActive: true, organization: { isActive: true } },
    },
    include: {
      program: {
        select: {
          name: true,
          supportEnabled: true,
          supportTeamName: true,
          supportMonitoring: true,
          supportRegion: true,
        },
      },
    },
  });
  return {
    accountId: id,
    intake: e
      ? {
          enabled:
            e.program.supportEnabled &&
            !!e.program.supportTeamName &&
            !!e.program.supportMonitoring,
          programName: e.program.name,
          teamName: e.program.supportTeamName,
          monitoring: e.program.supportMonitoring,
          region: e.program.supportRegion,
        }
      : null,
  };
}
export async function createSupportRequest(
  req: Request,
  id: string,
  d: z.infer<typeof supportRequestSchema>,
) {
  return prisma.$transaction(
    async (tx) => {
      if (d.expectedAccountId !== id)
        throw new RewardIssue(
          "account_changed",
          "Your signed-in account changed. Reload before sharing a support request.",
        );
      await userLock(tx, id);
      if ((await getUserIdFromRequest(req, tx)) !== id)
        throw new RewardIssue(
          "unauthorized",
          "Your session ended. Sign in again; public human-help resources remain available.",
          401,
        );
      const fingerprint = hash(d),
        prior = await tx.case.findUnique({
          where: { userId_intakeKey: { userId: id, intakeKey: d.requestKey } },
        });
      if (prior) {
        if (prior.intakePayloadHash !== fingerprint)
          throw new RewardIssue(
            "conflict",
            "This request was already saved with different details. Check its recorded status before starting another request.",
          );
        return { receipt: supportReceipt(prior), replayed: true };
      }
      const e = await tx.participantEnrollment.findFirst({
        where: {
          userId: id,
          status: "active",
          program: { isActive: true, organization: { isActive: true } },
        },
        include: { program: true },
      });
      if (
        !e?.program.supportEnabled ||
        !e.program.supportTeamName ||
        !e.program.supportMonitoring ||
        !e.program.supportReviewReference ||
        !e.program.supportRegion
      )
        throw new RewardIssue(
          "intake_unavailable",
          "A monitored program request queue is not configured for this account. Use the public human-help resources or your program’s verified direct contact.",
          409,
        );
      if (
        (await tx.case.count({
          where: {
            userId: id,
            intakeKey: { not: null },
            createdAt: { gte: new Date(Date.now() - 3600000) },
          },
        })) >= 6
      )
        throw new RewardIssue(
          "rate_limited",
          "Six new program requests have already been saved this hour. Check your saved request or use the human-help resources.",
          429,
        );
      const c = await tx.case.create({
        data: {
          programId: e.programId,
          userId: id,
          title: "Participant support request",
          message: d.message,
          location: d.shareLocation ? d.location || null : null,
          locationConsentAt: d.shareLocation && d.location ? new Date() : null,
          intakeKey: d.requestKey,
          intakePayloadHash: fingerprint,
          intakeSnapshot: JSON.stringify({
            programName: e.program.name,
            teamName: e.program.supportTeamName,
            monitoring: e.program.supportMonitoring,
            region: e.program.supportRegion,
            version: e.program.supportVersion,
          }),
          status: "new",
          priority: "medium",
        },
      });
      await tx.auditLog.create({
        data: {
          programId: e.programId,
          action: "SUPPORT_REQUEST_SAVED",
          entity: "Case",
          entityId: c.id,
          details: JSON.stringify({
            locationShared: !!c.locationConsentAt,
            notificationSent: false,
          }),
        },
      });
      return { receipt: supportReceipt(c), replayed: false };
    },
    { maxWait: 10000, timeout: 15000 },
  );
}
