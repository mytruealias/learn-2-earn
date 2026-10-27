import type { Prisma, PayoutRequest } from "@prisma/client";
import { createHash } from "node:crypto";
import { citySlug, getPayoutRules } from "../payout-rules";
import {
  fraction,
  legacyCents,
  maskHandle,
  methodDefinitions,
  sumCents,
  sumDecimals,
} from "./money";
export type Tx = Prisma.TransactionClient;
export const reservedStatuses = ["pending", "reviewed", "approved"];
export const knownStatuses = [
  ...reservedStatuses,
  "completed",
  "rejected",
  "cancelled",
];
export class RewardIssue extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function financialLock(tx: Tx) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock_shared(74219932)::text`;
}
export async function userLock(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${id} FOR UPDATE`;
}
export async function audit(
  tx: Tx,
  action: string,
  entityId: string,
  adminId: string | null,
  details: object,
) {
  await tx.auditLog.create({
    data: {
      action,
      entity: "RewardAccounting",
      entityId,
      adminId,
      details: JSON.stringify(details),
    },
  });
}
export async function creditLearningReward(
  tx: Tx,
  user: { id: string; totalXp: number },
  xp: number,
  progressId: string,
) {
  let account = await tx.rewardAccount.findUnique({
    where: { userId: user.id },
  });
  if (!account && user.totalXp === 0) {
    account = await tx.rewardAccount.create({
      data: { userId: user.id, creditedXp: 0, availableXp: 0 },
    });
    await tx.rewardEntry.create({
      data: {
        userId: user.id,
        sourceKey: "opening",
        kind: "opening",
        metadata: '{"source":"empty-account"}',
      },
    });
  }
  // Historical accounts remain available for learning; importing them is deliberate, never lazy.
  if (!account) return;
  if (account.learningXp !== user.totalXp)
    throw new RewardIssue(
      "reconciliation_required",
      "Your saved lesson steps are safe. Staff needs to reconcile your reward record before this completion can be confirmed.",
    );
  await tx.rewardAccount.update({
    where: { userId: user.id },
    data: {
      availableXp: { increment: xp },
      creditedXp: { increment: xp },
      learningXp: { increment: xp },
    },
  });
  await tx.rewardEntry.create({
    data: {
      userId: user.id,
      sourceKey: `lesson:${progressId}`,
      kind: "learning-credit",
      availableDelta: xp,
      creditedDelta: xp,
      metadata: JSON.stringify({ progressId }),
    },
  });
}
export function payoutDto(
  p: PayoutRequest,
  events: { kind: string; toStatus: string | null; createdAt: Date }[] = [],
) {
  return {
    requestKey: p.requestKey,
    id: p.id,
    userId: p.userId,
    xpAmount: p.xpAmount,
    amountCents: p.amountCents,
    dollarAmount: p.amountCents !== null ? p.amountCents / 100 : p.dollarAmount,
    status: p.status,
    paymentMethod: p.paymentMethod,
    paymentHandle: maskHandle(p.paymentHandle),
    createdAt: p.createdAt,
    reviewedAt: p.reviewedAt,
    approvedAt: p.approvedAt,
    paidAt: p.paidAt,
    reviewedById: p.reviewedById,
    approvedById: p.approvedById,
    rulesSnapshot: p.rulesSnapshot ? JSON.parse(p.rulesSnapshot) : null,
    paymentReference: p.paymentReference,
    events: events
      .filter((e) => e.toStatus)
      .map((e) => ({ action: e.kind, status: e.toStatus, at: e.createdAt })),
  };
}
export async function rewardSummary(tx: Tx, userId: string) {
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      rewardAccount: true,
      rewardEntries: {
        select: {
          availableDelta: true,
          reservedDelta: true,
          spentDelta: true,
          creditedDelta: true,
        },
      },
      payoutRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          rewardEntries: {
            orderBy: { createdAt: "asc" },
            select: { kind: true, toStatus: true, createdAt: true },
          },
        },
      },
    },
  });
  const a = user.rewardAccount,
    rules = await getPayoutRules(a ? a.programSlug : user.city, tx);
  const live = user.payoutRequests.filter((p) =>
      reservedStatuses.includes(p.status),
    ),
    paid = user.payoutRequests.filter((p) => p.status === "completed"),
    committed = [...live, ...paid];
  const used = committed.reduce((sum, p) => sum + p.xpAmount, 0);
  const rawAvailable = (a?.creditedXp ?? user.totalXp) - used;
  const totals = user.rewardEntries.reduce(
    (t, e) => ({
      available: t.available + e.availableDelta,
      reserved: t.reserved + e.reservedDelta,
      spent: t.spent + e.spentDelta,
      credited: t.credited + e.creditedDelta,
    }),
    { available: 0, reserved: 0, spent: 0, credited: 0 },
  );
  const reconciled =
    !!a &&
    totals.available === a.availableXp &&
    totals.reserved === a.reservedXp &&
    totals.spent === a.spentXp &&
    totals.credited === a.creditedXp &&
    a.learningXp === user.totalXp &&
    a.availableXp === rawAvailable &&
    a.reservedXp === live.reduce((s, p) => s + p.xpAmount, 0) &&
    a.spentXp === paid.reduce((s, p) => s + p.xpAmount, 0) &&
    user.payoutRequests.every(
      (p) =>
        p.amountCents !== null &&
        p.rulesSnapshot &&
        knownStatuses.includes(p.status),
    );
  const since = new Date(Date.now() - 7 * 86400000),
    weeklyUsed = committed
      .filter((p) => p.createdAt >= since)
      .reduce((sum, p) => sum + p.xpAmount, 0);
  return {
    accountId: userId,
    lifetimeXp: user.totalXp,
    availableXp: Math.max(0, rawAvailable),
    reservedXp: live.reduce((s, p) => s + p.xpAmount, 0),
    spentXp: paid.reduce((s, p) => s + p.xpAmount, 0),
    pendingCents: sumCents(live.map((p) => p.amountCents)),
    paidCents: sumCents(paid.map((p) => p.amountCents)),
    reconciled,
    profileReady: !!user.email && !!user.fullName,
    weeklyUsed,
    weeklyRemaining: Math.max(0, rules.weeklyXpCap - weeklyUsed),
    rules,
    payouts: user.payoutRequests.map((p) => payoutDto(p, p.rewardEntries)),
  };
}
// Explicit backfill plan. No email, handles, names or learner answers are returned/logged.
export async function reconciliationPlan(tx: Tx) {
  const users = await tx.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      city: true,
      totalXp: true,
      rewardAccount: true,
      rewardEntries: {
        select: {
          availableDelta: true,
          reservedDelta: true,
          spentDelta: true,
          creditedDelta: true,
        },
      },
      progress: { select: { xpEarned: true } },
      payoutRequests: { orderBy: { id: "asc" } },
    },
  });
  const configs = await tx.payoutConfig.findMany({ orderBy: { id: "asc" } }),
    pool = await tx.poolBalance.findUnique({ where: { id: "singleton" } });
  const issues: string[] = [];
  const plans = users.map((u) => {
    const progressXp = u.progress.reduce((s, p) => s + p.xpEarned, 0),
      adjustment = u.totalXp - progressXp;
    let reserved = 0,
      spent = 0;
    const payouts = u.payoutRequests.map((p) => {
      if (!knownStatuses.includes(p.status) || p.xpAmount <= 0)
        issues.push("unknown-status-or-invalid-xp");
      if (reservedStatuses.includes(p.status)) reserved += p.xpAmount;
      if (p.status === "completed") spent += p.xpAmount;
      if (
        reservedStatuses.includes(p.status) &&
        (!p.paymentMethod || !p.paymentHandle?.trim())
      )
        issues.push("unpayable-open-request");
      let cents: number | null = null;
      try {
        const rounded = legacyCents(p.dollarAmount);
        cents = p.amountCents ?? rounded;
        if (p.amountCents !== null && p.amountCents !== rounded)
          issues.push("compatibility-shadow-mismatch");
      } catch {
        issues.push("invalid-legacy-money");
      }
      return {
        id: p.id,
        status: p.status,
        xp: p.xpAmount,
        cents,
        oldAmount: p.dollarAmount,
        hasSnapshot: !!p.rulesSnapshot,
        createdAt: p.createdAt.toISOString(),
        method: p.paymentMethod,
        handleHash: hash(p.paymentHandle),
        snapshotHash: hash(p.rulesSnapshot),
        paymentReferenceHash: hash(p.paymentReference),
        paidAt: p.paidAt?.toISOString() || null,
      };
    });
    if (
      (u.rewardAccount?.creditedXp ?? u.totalXp) < reserved + spent ||
      u.totalXp < 0
    )
      issues.push("overspent-account");
    if (
      u.rewardAccount &&
      (u.rewardAccount.learningXp !== u.totalXp ||
        u.rewardAccount.availableXp !==
          u.rewardAccount.creditedXp - reserved - spent ||
        u.rewardAccount.reservedXp !== reserved ||
        u.rewardAccount.spentXp !== spent)
    )
      issues.push("account-mismatch");
    if (u.rewardAccount) {
      const totals = u.rewardEntries.reduce(
        (a, e) => ({
          available: a.available + e.availableDelta,
          reserved: a.reserved + e.reservedDelta,
          spent: a.spent + e.spentDelta,
          credited: a.credited + e.creditedDelta,
        }),
        { available: 0, reserved: 0, spent: 0, credited: 0 },
      );
      if (
        totals.available !== u.rewardAccount.availableXp ||
        totals.reserved !== u.rewardAccount.reservedXp ||
        totals.spent !== u.rewardAccount.spentXp ||
        totals.credited !== u.rewardAccount.creditedXp
      )
        issues.push("ledger-mismatch");
      if (payouts.some((p) => !p.hasSnapshot))
        issues.push("initialized-account-has-unimported-history");
    }
    return {
      id: u.id,
      programSlug: citySlug(u.city),
      boundProgramSlug: u.rewardAccount?.programSlug ?? null,
      creditedXp: u.rewardAccount?.creditedXp ?? u.totalXp,
      totalXp: u.totalXp,
      progressXp,
      adjustment,
      reserved,
      spent,
      payouts,
      initialized: !!u.rewardAccount,
    };
  });
  for (const c of configs) {
    try {
      if (
        fraction(c.rateExact || String(c.xpToDollar)).n <= 0n ||
        c.minimumXp < 1 ||
        c.weeklyXpCap < c.minimumXp
      )
        throw Error();
      if (c.paymentMethods) {
        const methods: unknown = JSON.parse(c.paymentMethods);
        if (
          !Array.isArray(methods) ||
          methods.some(
            (m) => typeof m !== "string" || !(m in methodDefinitions),
          )
        )
          throw Error();
      }
    } catch {
      issues.push("invalid-rule-contract");
    }
  }
  if (pool && pool.balanceCents < 0) issues.push("negative-pool");
  const data = {
    plans,
    configs: configs.map((c) => ({
      id: c.id,
      programSlug: c.programSlug,
      programName: c.programName,
      version: c.version,
      rate: c.rateExact || String(c.xpToDollar),
      minimum: c.minimumXp,
      cap: c.weeklyXpCap,
      methods: c.paymentMethods,
      separate: c.separateApprover,
      active: c.isActive,
    })),
    pool: pool?.balanceCents ?? 0,
  };
  return {
    totals: {
      lifetimeXp: plans.reduce((n, p) => n + p.totalXp, 0),
      reservedXp: plans.reduce((n, p) => n + p.reserved, 0),
      spentXp: plans.reduce((n, p) => n + p.spent, 0),
      recordedRequestCents: sumCents(
        plans.flatMap((p) => p.payouts.map((r) => r.cents)),
      ),
      pendingCents: sumCents(
        plans.flatMap((p) =>
          p.payouts
            .filter((r) => reservedStatuses.includes(r.status))
            .map((r) => r.cents),
        ),
      ),
      paidCents: sumCents(
        plans.flatMap((p) =>
          p.payouts.filter((r) => r.status === "completed").map((r) => r.cents),
        ),
      ),
      originalRecordedUsd: issues.includes("invalid-legacy-money")
        ? null
        : sumDecimals(
            plans.flatMap((p) => p.payouts.map((r) => String(r.oldAmount))),
          ),
      roundedRequests: plans
        .flatMap((p) => p.payouts)
        .filter((r) => {
          try {
            const f = fraction(String(r.oldAmount));
            return (f.n * 100n) % f.d !== 0n;
          } catch {
            return false;
          }
        }).length,
    },
    hash: hash(data),
    users: plans.length,
    uninitialized: plans.filter((p) => !p.initialized).length,
    legacyRequests: plans
      .flatMap((p) => p.payouts)
      .filter((p) => !p.hasSnapshot).length,
    adjustmentAccounts: plans.filter(
      (p) => p.adjustment !== 0 && !p.initialized,
    ).length,
    issues: [...new Set(issues)],
    plans,
    configs,
  };
}
export async function backfillRewards(
  tx: Tx,
  expectedHash: string,
  acceptLegacyDifferences: boolean,
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(74219932)::text`;
  await tx.$queryRaw`SELECT "id" FROM "User" ORDER BY "id" FOR UPDATE`;
  const plan = await reconciliationPlan(tx);
  if (plan.hash !== expectedHash)
    throw new RewardIssue(
      "conflict",
      "The reconciliation inputs changed. Review a fresh dry run.",
    );
  if (
    plan.issues.length ||
    (plan.adjustmentAccounts > 0 && !acceptLegacyDifferences)
  )
    throw new RewardIssue(
      "reconciliation_required",
      "Resolve reconciliation issues and explicitly acknowledge any legacy XP differences.",
    );
  for (const p of plan.plans) {
    if (p.initialized) continue;
    await tx.rewardAccount.create({
      data: {
        userId: p.id,
        programSlug: p.programSlug,
        learningXp: p.totalXp,
        creditedXp: p.totalXp,
        availableXp: p.totalXp - p.reserved - p.spent,
        reservedXp: p.reserved,
        spentXp: p.spent,
        openingAdjustmentXp: p.adjustment,
      },
    });
    await tx.rewardEntry.create({
      data: {
        userId: p.id,
        sourceKey: "opening",
        kind: "opening",
        availableDelta: p.totalXp,
        creditedDelta: p.totalXp,
        metadata: JSON.stringify({
          source: "verified-legacy-opening",
          progressXp: p.progressXp,
          adjustmentXp: p.adjustment,
          reportHash: expectedHash,
        }),
      },
    });
    for (const request of p.payouts) {
      const legacySnapshot = JSON.stringify({
        version: "legacy-recorded-amount",
        currency: "USD",
        rate: null,
        minXp: null,
        weeklyXpCap: null,
        methods: null,
        separateApprover: false,
        source: "legacy-record",
        amountCents: request.cents,
      });
      await tx.payoutRequest.update({
        where: { id: request.id },
        data: { amountCents: request.cents, rulesSnapshot: legacySnapshot },
      });
      // Import the actual net obligation; never invent historical review or transfer timestamps.
      const held = reservedStatuses.includes(request.status),
        spent = request.status === "completed";
      await tx.rewardEntry.create({
        data: {
          userId: p.id,
          payoutId: request.id,
          sourceKey: `import:${request.id}`,
          kind: "legacy-import",
          availableDelta: held || spent ? -request.xp : 0,
          reservedDelta: held ? request.xp : 0,
          spentDelta: spent ? request.xp : 0,
          amountCents: request.cents,
          toStatus: request.status,
          metadata: JSON.stringify({
            reportHash: expectedHash,
            originalDollarAmount: request.oldAmount,
            rounding: "decimal-string-half-up-to-cents",
            historicalTerms: "unknown",
            paidTimestamp: "not-inferred",
          }),
        },
      });
    }
    await audit(tx, "REWARDS_LEGACY_RECONCILED", p.id, null, {
      reportHash: expectedHash,
      openingAdjustmentXp: p.adjustment,
    });
  }
  for (const c of plan.configs)
    if (!c.rateExact)
      await tx.payoutConfig.update({
        where: { id: c.id },
        data: { rateExact: String(c.xpToDollar) },
      });
  return {
    importedUsers: plan.uninitialized,
    importedRequests: plan.legacyRequests,
  };
}
