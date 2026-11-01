import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../prisma";
import { scopedDb, membershipRole, type StaffScope } from "../program-scope";
export const reportQuery = z
  .object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().min(1).max(100),
    programId: z.string().max(120).optional(),
    format: z.enum(["json", "csv"]).default("json"),
  })
  .superRefine((q, ctx) => {
    const start = Date.parse(q.start),
      end = Date.parse(q.end);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      new Date(start).toISOString().slice(0, 10) !== q.start ||
      new Date(end).toISOString().slice(0, 10) !== q.end ||
      end < start ||
      end - start > 365 * 86400000
    )
      ctx.addIssue({
        code: "custom",
        message: "Choose valid dates spanning no more than 366 calendar days.",
      });
    try {
      new Intl.DateTimeFormat("en", { timeZone: q.timezone }).format();
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Choose a valid IANA timezone.",
      });
    }
  });
/** Raw queries are limited to aggregate buckets/exact sums. No participant rows leave SQL.
 * This explicit predicate rechecks the same live membership/session as scopedDb. */
const authorized = (a: StaffScope) =>
  Prisma.sql`EXISTS (SELECT 1 FROM "StaffMembership" m JOIN "AdminUser" a ON a."id"=m."adminId" JOIN "AdminSession" s ON s."adminId"=a."id" JOIN "Program" p ON p."id"=m."programId" JOIN "Organization" o ON o."id"=p."organizationId" WHERE m."adminId"=${a.id} AND m."programId"=${a.programId} AND m."role"::text=${membershipRole(a.role)} AND m."isActive" AND m."revokedAt" IS NULL AND a."isActive" AND p."isActive" AND o."isActive" AND s."id"=${a.sessionId} AND s."activeProgramId"=${a.programId} AND s."revokedAt" IS NULL AND s."mfaVerifiedAt" IS NOT NULL AND s."expiresAt">NOW() AND s."lastSeenAt">NOW()-interval '30 minutes')`;
export async function programReport(
  a: StaffScope,
  q: z.infer<typeof reportQuery>,
) {
  if (q.programId && q.programId !== a.programId)
    throw new Error("Program scope mismatch");
  const [bounds] = await prisma.$queryRaw<
    { start: Date; end: Date }[]
  >`SELECT (${q.start}::date::timestamp AT TIME ZONE ${q.timezone}) AS start, ((${q.end}::date+1)::timestamp AT TIME ZONE ${q.timezone}) AS end`;
  const db = scopedDb(a),
    range = { gte: bounds.start, lt: bounds.end };
  const summary = await db.$transaction(
    async (tx) => {
      const [
        enrolled,
        active,
        first,
        practice,
        services,
        quantity,
        cases,
        legacyPaid,
      ] = await Promise.all([
        tx.user.count(),
        tx.user.count({
          where: {
            OR: [
              { progress: { some: { completedAt: range } } },
              {
                lessonAttempts: {
                  some: { completedAt: range, mode: "practice" },
                },
              },
            ],
          },
        }),
        tx.progress.count({ where: { completedAt: range } }),
        tx.lessonAttempt.count({
          where: { completedAt: range, mode: "practice" },
        }),
        tx.resourceAllocation.count({ where: { createdAt: range } }),
        tx.resourceAllocation.aggregate({
          where: { createdAt: range },
          _sum: { quantity: true },
        }),
        tx.case.count({ where: { createdAt: range } }),
        tx.payoutRequest.count({
          where: { status: "completed", paidAt: null },
        }),
      ]);
      return {
        enrolled,
        active,
        first,
        practice,
        services,
        quantity: quantity._sum.quantity ?? 0,
        cases,
        legacyPaid,
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 20000 },
  );
  const [daily, money] = await Promise.all([
    prisma.$queryRaw<
      { date: string; completions: bigint }[]
    >`SELECT to_char((r."completedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${q.timezone},'YYYY-MM-DD') AS date, COUNT(*)::bigint AS completions FROM "Progress" r JOIN "ParticipantEnrollment" e ON e."userId"=r."userId" WHERE e."programId"=${a.programId} AND e.status='active' AND (r."completedAt" AT TIME ZONE 'UTC')>=${bounds.start} AND (r."completedAt" AT TIME ZONE 'UTC')<${bounds.end} AND ${authorized(a)} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<
      { cents: string | null; count: bigint; payees: bigint; unknown: bigint }[]
    >`SELECT SUM(p."amountCents")::text AS cents, COUNT(*)::bigint AS count, COUNT(DISTINCT p."userId")::bigint AS payees, COUNT(*) FILTER (WHERE p."amountCents" IS NULL)::bigint AS unknown FROM "PayoutRequest" p WHERE p."programId"=${a.programId} AND p.status='completed' AND (p."paidAt" AT TIME ZONE 'UTC')>=${bounds.start} AND (p."paidAt" AT TIME ZONE 'UTC')<${bounds.end} AND ${authorized(a)}`,
  ]);
  return {
    filters: {
      ...q,
      programId: a.programId,
      startUtc: bounds.start.toISOString(),
      endExclusiveUtc: bounds.end.toISOString(),
    },
    summary: {
      ...summary,
      participationPercent: summary.enrolled
        ? Math.round((summary.active / summary.enrolled) * 1000) / 10
        : null,
      paidCents: money[0].unknown > 0n ? null : (money[0].cents ?? "0"),
      paidCount: Number(money[0].count),
      paidParticipants: Number(money[0].payees),
    },
    daily: daily.map((d) => ({
      date: d.date,
      completions: Number(d.completions),
    })),
    definitions: {
      denominator:
        "Currently active program enrollments, including inactive login accounts; not historical enrollment at the start of the range.",
      participation:
        "Distinct enrolled accounts with a first lesson completion or completed practice attempt within the selected local calendar dates.",
      first:
        "Unique first lesson completions dated by completedAt; repeat practice is separate.",
      practice:
        "Completed practice attempts; repeated sessions count as activity and do not generate cash credit.",
      service:
        "Recorded service allocations and quantities, dated by creation time; not verified service receipt or participant outcomes.",
      paid: "Completed requests with an actual paidAt in range, exact cents; approval is not payment. Undated legacy completions are excluded.",
      outcomes:
        "Self-reported housing, recovery and other outcomes are not collected by this report. No causal impact is inferred.",
    },
  };
}

export async function programMoneySummary(a: StaffScope) {
  const aggregate = async (condition: Prisma.Sql) => {
    const [r] = await prisma.$queryRaw<
      {
        cents: string | null;
        unknown: bigint;
        count: bigint;
        approved: bigint;
      }[]
    >`SELECT SUM(p."amountCents")::text AS cents,COUNT(*) FILTER(WHERE p."amountCents" IS NULL)::bigint AS unknown,COUNT(*)::bigint AS count,COUNT(*) FILTER(WHERE p.status='approved')::bigint AS approved FROM "PayoutRequest" p JOIN "ParticipantEnrollment" e ON e."userId"=p."userId" AND e."programId"=p."programId" AND e.status='active' WHERE p."programId"=${a.programId} AND ${condition} AND ${authorized(a)}`;
    return {
      cents: r.unknown > 0n ? null : (r.cents ?? "0"),
      count: Number(r.count),
      approved: Number(r.approved),
    };
  };
  const windows = await Promise.all(
    [7, 30, 90].map(async (days) => ({
      ...(await aggregate(
        Prisma.sql`p.status='completed' AND (p."paidAt" AT TIME ZONE 'UTC')>=${new Date(Date.now() - days * 86400000)}`,
      )),
      days,
    })),
  );
  const [pending, legacyPaid] = await Promise.all([
    aggregate(Prisma.sql`p.status IN ('pending','reviewed','approved')`),
    aggregate(Prisma.sql`p.status='completed' AND p."paidAt" IS NULL`),
  ]);
  return { windows, pending, legacyPaid };
}
