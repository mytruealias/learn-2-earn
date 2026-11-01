import { createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
export const inquirySchema = z
  .object({
    requestKey: z.string().uuid(),
    fullName: z.string().trim().min(1).max(100),
    organization: z.string().trim().min(1).max(160),
    email: z.string().trim().toLowerCase().email().max(254),
    interest: z.enum(["pilot", "demo", "funding", "general"]),
    region: z.string().trim().max(100).default(""),
    message: z.string().trim().max(1000).default(""),
    consent: z.literal(true),
  })
  .strict();
export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryReceipt = {
  reference: string;
  savedAt: string;
  state: "saved";
  notificationSent: false;
  bookingCreated: false;
};
export function inquiryConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const programId = env.PARTNER_INQUIRY_PROGRAM_ID?.trim(),
    team = env.PARTNER_INQUIRY_TEAM_NAME?.trim(),
    monitoring = env.PARTNER_INQUIRY_MONITORING_NOTICE?.trim(),
    review = env.PARTNER_INQUIRY_REVIEW_REFERENCE?.trim(),
    secret = env.SESSION_SECRET;
  return programId && team && monitoring && review && secret
    ? { programId, team, monitoring, review, secret }
    : null;
}
export class InquiryIssue extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function inquiryDatabase() {
  return (await import("../prisma")).default;
}
export async function saveInquiry(
  db: PrismaClient,
  d: InquiryInput,
  c: NonNullable<ReturnType<typeof inquiryConfiguration>>,
  ip: string,
): Promise<{ receipt: InquiryReceipt; replayed: boolean }> {
  const fingerprint = createHmac("sha256", c.secret)
      .update(JSON.stringify(d))
      .digest("hex"),
    now = new Date(),
    windowAt = new Date(Math.floor(now.getTime() / 3600000) * 3600000),
    ipKey = createHmac("sha256", c.secret)
      .update(`partner-ip:${ip}`)
      .digest("hex");
  return db.$transaction(
    async (tx) => {
      // Dedicated low-volume intake lock: duplicate intent, counters, receipt and audit commit together.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(73621908)::text`;
      const existing = await tx.partnerInquiry.findUnique({
        where: { requestKey: d.requestKey },
      });
      const receipt = (r: { id: string; createdAt: Date }): InquiryReceipt => ({
        reference: r.id,
        savedAt: r.createdAt.toISOString(),
        state: "saved",
        notificationSent: false,
        bookingCreated: false,
      });
      if (existing) {
        if (existing.payloadHash !== fingerprint)
          throw new InquiryIssue(
            "conflict",
            "This request key already has different details. Retry the original details rather than creating a duplicate.",
            409,
          );
        return { receipt: receipt(existing), replayed: true };
      }
      const program = await tx.program.findFirst({
        where: {
          id: c.programId,
          isActive: true,
          organization: { isActive: true },
          memberships: {
            some: {
              role: "program_admin",
              isActive: true,
              revokedAt: null,
              admin: { isActive: true, mfaConfirmedAt: { not: null } },
            },
          },
        },
        select: { id: true },
      });
      if (!program)
        throw new InquiryIssue(
          "service_unavailable",
          "The reviewed intake queue is not available. No receipt, email or booking is confirmed.",
          503,
        );
      for (const [key, maximum] of [
        [ipKey, 5],
        [`partner-program:${c.programId}`, 100],
      ] as const) {
        const old = await tx.partnerInquiryRate.findUnique({ where: { key } }),
          count =
            (old?.windowAt.getTime() === windowAt.getTime() ? old.count : 0) +
            1;
        if (count > maximum)
          throw new InquiryIssue(
            "rate_limited",
            "The inquiry queue is temporarily at its request limit. Wait before retrying; an existing saved receipt is not a booking.",
            429,
          );
        await tx.partnerInquiryRate.upsert({
          where: { key },
          create: { key, windowAt, count },
          update: { windowAt, count },
        });
      }
      const row = await tx.partnerInquiry.create({
        data: {
          requestKey: d.requestKey,
          payloadHash: fingerprint,
          programId: c.programId,
          fullName: d.fullName,
          organization: d.organization,
          email: d.email,
          interest: d.interest,
          region: d.region || null,
          message: d.message || null,
          consentAt: now,
          noticeSnapshot: JSON.stringify({
            team: c.team,
            monitoring: c.monitoring,
            review: c.review,
            notificationSent: false,
            version: "partner-intake-v1",
          }),
        },
      });
      await tx.auditLog.create({
        data: {
          programId: c.programId,
          action: "PARTNER_INQUIRY_SAVED",
          entity: "PartnerInquiry",
          entityId: row.id,
          details: '{"notificationSent":false,"bookingCreated":false}',
        },
      });
      return { receipt: receipt(row), replayed: false };
    },
    { maxWait: 5000, timeout: 10000 },
  );
}
