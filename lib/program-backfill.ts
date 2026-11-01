import { createHash } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { citySlug } from "./payout-rules";
import { membershipRole } from "./program-scope";
const ids = z
  .array(z.string().min(1).max(120))
  .max(100000)
  .refine((a) => new Set(a).size === a.length, "Duplicate reviewed IDs");
export const legacyMappingSchema = z
  .object({
    version: z.literal(1),
    organization: z
      .object({
        id: z.literal("legacy-organization"),
        name: z.string().min(1).max(200),
      })
      .strict(),
    program: z
      .object({
        id: z.literal("legacy-program"),
        slug: z.literal("legacy"),
        name: z.string().min(1).max(200),
        defaultConfigSlug: z.string().max(120).nullable(),
      })
      .strict(),
    staffIds: ids,
    participantIds: ids,
    serviceIds: ids,
    configIds: ids,
    acceptLegacyPool: z.boolean(),
    verificationReference: z.string().trim().min(5).max(200),
  })
  .strict();
export type LegacyMapping = z.infer<typeof legacyMappingSchema>;
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** No city-derived grants. Every root record/membership needs an explicit reviewed ID.
 * Child cases/payouts with unexplained actor/assignee ownership remain quarantined. */
export async function programBoundaryPlan(
  tx: Prisma.TransactionClient,
  input: unknown,
) {
  const mapping = legacyMappingSchema.parse(input);
  const [
    users,
    staff,
    enrollments,
    memberships,
    cases,
    payouts,
    services,
    configs,
    pools,
    adjustments,
    audits,
    programs,
  ] = await Promise.all([
    tx.user.findMany({
      select: {
        id: true,
        totalXp: true,
        isActive: true,
        programEnrollmentState: true,
        city: true,
        rewardAccount: { select: { programSlug: true } },
      },
      orderBy: { id: "asc" },
    }),
    tx.adminUser.findMany({
      select: { id: true, role: true, isActive: true },
      orderBy: { id: "asc" },
    }),
    tx.participantEnrollment.findMany({ orderBy: { userId: "asc" } }),
    tx.staffMembership.findMany({ orderBy: { id: "asc" } }),
    tx.case.findMany({
      include: {
        notes: { select: { adminId: true } },
        allocations: { select: { adminId: true } },
      },
      orderBy: { id: "asc" },
    }),
    tx.payoutRequest.findMany({ orderBy: { id: "asc" } }),
    tx.serviceDirectory.findMany({ orderBy: { id: "asc" } }),
    tx.payoutConfig.findMany({ orderBy: { id: "asc" } }),
    tx.poolBalance.findMany({ orderBy: { id: "asc" } }),
    tx.poolAdjustment.findMany({ orderBy: { id: "asc" } }),
    tx.auditLog.findMany({
      select: {
        id: true,
        adminId: true,
        entity: true,
        entityId: true,
        programId: true,
      },
      orderBy: { id: "asc" },
    }),
    tx.program.findMany({ orderBy: { id: "asc" } }),
  ]);
  const issues: string[] = [];
  for (const [requested, actual] of [
    [mapping.staffIds, staff],
    [mapping.participantIds, users],
    [mapping.serviceIds, services],
    [mapping.configIds, configs],
  ] as const)
    if (requested.some((id) => !actual.some((r) => r.id === id)))
      issues.push("unknown-reviewed-id");
  if (
    staff.some(
      (a) => mapping.staffIds.includes(a.id) && !membershipRole(a.role),
    )
  )
    issues.push("unknown-legacy-role");
  if (
    enrollments.some(
      (e) =>
        mapping.participantIds.includes(e.userId) &&
        e.programId !== mapping.program.id,
    )
  )
    issues.push("participant-already-owned");
  for (const rows of [services, configs])
    if (
      rows.some(
        (r) =>
          ("category" in r ? mapping.serviceIds : mapping.configIds).includes(
            r.id,
          ) &&
          r.programId &&
          r.programId !== mapping.program.id,
      )
    )
      issues.push("record-already-owned");
  const owned = (id: string) => mapping.participantIds.includes(id);
  const verifiedActor = (id: string | null) =>
    !id || mapping.staffIds.includes(id);
  const readyCases = cases.filter(
    (c) =>
      owned(c.userId) &&
      !c.programId &&
      verifiedActor(c.assignedToId) &&
      c.notes.every((n) => verifiedActor(n.adminId)) &&
      c.allocations.every((n) => verifiedActor(n.adminId)),
  );
  const readyPayouts = payouts.filter(
    (p) =>
      owned(p.userId) &&
      !p.programId &&
      [p.reviewedById, p.approvedById, p.paidById].every(verifiedActor),
  );
  const sourcePool = pools.find((p) => p.id === "singleton");
  if (
    mapping.acceptLegacyPool &&
    sourcePool?.programId &&
    sourcePool.programId !== mapping.program.id
  )
    issues.push("pool-already-owned");
  if (
    mapping.acceptLegacyPool &&
    pools.some((p) => p.id === mapping.program.id && p.id !== sourcePool?.id)
  )
    issues.push("legacy-pool-target-already-exists");
  const originalDefault = configs.find(
    (c) =>
      c.programSlug === "default" &&
      c.isActive &&
      (!c.programId || c.programId === mapping.program.id),
  );
  if (
    mapping.participantIds.length &&
    originalDefault &&
    (!mapping.configIds.includes(originalDefault.id) ||
      mapping.program.defaultConfigSlug !== originalDefault.programSlug)
  )
    issues.push("existing-default-terms-not-reviewed");
  for (const user of users.filter((u) =>
    mapping.participantIds.includes(u.id),
  )) {
    const slug = user.rewardAccount?.programSlug ?? citySlug(user.city);
    const assigned = slug
      ? configs.find((c) => c.programSlug === slug && c.isActive)
      : null;
    if (
      assigned &&
      assigned.programId &&
      assigned.programId !== mapping.program.id
    )
      issues.push("financial-assignment-owned-elsewhere");
    if (assigned && !mapping.configIds.includes(assigned.id))
      issues.push("existing-assigned-terms-not-reviewed");
  }
  const acceptedConfigs = configs.filter((c) =>
    mapping.configIds.includes(c.id),
  );
  if (
    mapping.program.defaultConfigSlug &&
    !acceptedConfigs.some(
      (c) => c.programSlug === mapping.program.defaultConfigSlug,
    )
  )
    issues.push("default-config-not-reviewed");
  const totals = {
    participants: users.length,
    reviewedParticipants: mapping.participantIds.length,
    staff: staff.length,
    reviewedStaff: mapping.staffIds.length,
    grantMemberships: mapping.staffIds.filter(
      (id) =>
        !memberships.some(
          (m) => m.adminId === id && m.programId === mapping.program.id,
        ),
    ).length,
    createEnrollments: mapping.participantIds.filter(
      (id) => !enrollments.some((e) => e.userId === id),
    ).length,
    assignCases: readyCases.length,
    assignPayouts: readyPayouts.length,
    quarantinedParticipants: users.filter(
      (u) => !enrollments.some((e) => e.userId === u.id) && !owned(u.id),
    ).length,
    quarantinedCases: cases.filter(
      (c) => !c.programId && !readyCases.some((r) => r.id === c.id),
    ).length,
    quarantinedPayouts: payouts.filter(
      (p) => !p.programId && !readyPayouts.some((r) => r.id === p.id),
    ).length,
    quarantinedServices: services.filter(
      (s) => !s.programId && !mapping.serviceIds.includes(s.id),
    ).length,
    quarantinedConfigs: configs.filter(
      (c) => !c.programId && !mapping.configIds.includes(c.id),
    ).length,
    totalLifetimeXp: users.reduce((n, u) => n + u.totalXp, 0),
    totalRecordedCents: payouts.every((p) => p.amountCents !== null)
      ? payouts.reduce((n, p) => n + BigInt(p.amountCents!), 0n).toString()
      : null,
    legacyPoolCents: sourcePool?.balanceCents ?? null,
  };
  return {
    mapping,
    totals,
    issues: [...new Set(issues)],
    hash: digest({
      mapping,
      users,
      staff,
      enrollments,
      memberships,
      cases,
      payouts,
      services,
      configs,
      pools,
      adjustments,
      audits,
      programs,
    }),
    readyCases,
    readyPayouts,
    sourcePool,
    adjustments,
    audits,
  };
}
export async function applyProgramBoundaryPlan(
  tx: Prisma.TransactionClient,
  mapping: unknown,
  expectedHash: string,
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(74219932)::text`;
  // Release operation requires quiesced writers. Table locks prevent source changes while checking/applying the reviewed snapshot.
  await tx.$executeRawUnsafe(
    'LOCK TABLE "User", "AdminUser", "ParticipantEnrollment", "StaffMembership", "PayoutRequest", "Case", "CaseNote", "ResourceAllocation", "ServiceDirectory", "PayoutConfig", "PoolBalance", "PoolAdjustment", "AuditLog", "Program", "Organization" IN SHARE ROW EXCLUSIVE MODE',
  );
  const plan = await programBoundaryPlan(tx, mapping);
  if (plan.hash !== expectedHash || plan.issues.length)
    throw new Error("Reviewed mapping changed or contains unresolved issues.");
  const m = plan.mapping;
  if (
    !plan.totals.grantMemberships &&
    !plan.totals.createEnrollments &&
    !plan.readyCases.length &&
    !plan.readyPayouts.length &&
    !(await tx.serviceDirectory.count({
      where: { id: { in: m.serviceIds }, programId: null },
    })) &&
    !(await tx.payoutConfig.count({
      where: { id: { in: m.configIds }, programId: null },
    })) &&
    !(m.acceptLegacyPool && plan.sourcePool && !plan.sourcePool.programId)
  )
    return plan.totals;
  await tx.organization.upsert({
    where: { id: m.organization.id },
    create: m.organization,
    update: {},
  });
  await tx.program.upsert({
    where: { id: m.program.id },
    create: { ...m.program, organizationId: m.organization.id },
    update: {},
  });
  for (const id of m.staffIds) {
    const staff = await tx.adminUser.findUniqueOrThrow({ where: { id } });
    await tx.staffMembership.upsert({
      where: { adminId_programId: { adminId: id, programId: m.program.id } },
      create: {
        adminId: id,
        programId: m.program.id,
        role: membershipRole(staff.role)!,
        isActive: staff.isActive,
      },
      update: {},
    });
  }
  for (const userId of m.participantIds)
    await tx.participantEnrollment.upsert({
      where: { userId },
      create: {
        userId,
        programId: m.program.id,
        status: "active",
        reviewedById: m.verificationReference,
      },
      update: {},
    });
  await tx.case.updateMany({
    where: { id: { in: plan.readyCases.map((c) => c.id) }, programId: null },
    data: { programId: m.program.id },
  });
  await tx.payoutRequest.updateMany({
    where: { id: { in: plan.readyPayouts.map((p) => p.id) }, programId: null },
    data: { programId: m.program.id },
  });
  await tx.serviceDirectory.updateMany({
    where: { id: { in: m.serviceIds }, programId: null },
    data: { programId: m.program.id },
  });
  await tx.payoutConfig.updateMany({
    where: { id: { in: m.configIds }, programId: null },
    data: { programId: m.program.id },
  });
  if (m.acceptLegacyPool && plan.sourcePool && !plan.sourcePool.programId) {
    // Retain original pool ID and amount. Scoped queries resolve via programId, not a new copy.
    await tx.poolBalance.update({
      where: { id: plan.sourcePool.id },
      data: { programId: m.program.id },
    });
    const reviewedAdjustments = plan.adjustments.filter(
      (a) => !a.programId && m.staffIds.includes(a.adminId),
    );
    await tx.poolAdjustment.updateMany({
      where: { id: { in: reviewedAdjustments.map((a) => a.id) } },
      data: { programId: m.program.id },
    });
  }
  // Only audit rows that can be tied to a reviewed entity are assigned. Global auth/unknown records stay private to the operator.
  const entityIds = new Set([
    ...m.participantIds,
    ...m.serviceIds,
    ...m.configIds,
    ...plan.readyCases.map((c) => c.id),
    ...plan.readyPayouts.map((p) => p.id),
  ]);
  await tx.auditLog.updateMany({
    where: {
      id: {
        in: plan.audits
          .filter(
            (a) =>
              !a.programId &&
              a.entityId &&
              entityIds.has(a.entityId) &&
              (!a.adminId || m.staffIds.includes(a.adminId)),
          )
          .map((a) => a.id),
      },
    },
    data: { programId: m.program.id },
  });
  await tx.adminSession.updateMany({
    where: { adminId:{in:m.staffIds},revokedAt: null,OR:[{activeProgramId:null},{activeProgramId:m.program.id}] },
    data: { revokedAt: new Date() },
  });
  await tx.auditLog.create({
    data: {
      programId: m.program.id,
      action: "LEGACY_PROGRAM_BOUNDARY_REVIEWED",
      entity: "Program",
      entityId: m.program.id,
      details: JSON.stringify({
        reviewedHash: plan.hash,
        verificationReference: m.verificationReference,
        totals: plan.totals,
      }),
    },
  });
  return plan.totals;
}
