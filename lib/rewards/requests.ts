import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPayoutRules } from "../payout-rules";
import {
  audit,
  financialLock,
  hash,
  payoutDto,
  reservedStatuses,
  rewardSummary,
  RewardIssue,
  userLock,
  type Tx,
} from "./accounting";
import { centsForXp, type RewardMethod } from "./money";
export const keySchema = z.string().uuid();
export const requestSchema = z
  .object({
    requestKey: keySchema,
    ruleVersion: z.string().min(1).max(100),
    xpAmount: z.number().int().positive().max(1_000_000),
    paymentMethod: z.enum(["venmo", "paypal", "cashapp", "check", "zelle"]),
    paymentHandle: z.string().trim().min(1).max(255),
  })
  .strict();
export function validateHandle(method: RewardMethod, handle: string) {
  if (/[\u0000-\u001f]/.test(handle))
    throw new RewardIssue(
      "validation_error",
      "Use a single-line payment contact or address.",
      400,
    );
  if (
    method === "zelle" &&
    !(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(handle) ||
      /^\+?[\d ()-]{10,20}$/.test(handle)
    )
  )
    throw new RewardIssue(
      "validation_error",
      "Provide the email or phone number enrolled with Zelle.",
      400,
    );
  if (method === "check" && handle.length < 10)
    throw new RewardIssue(
      "validation_error",
      "Provide the payee name and complete mailing address.",
      400,
    );
}
export async function requestReward(
  tx: Tx,
  id: string,
  data: z.infer<typeof requestSchema>,
) {
  const fingerprint = hash(data),
    existing = await tx.payoutRequest.findUnique({
      where: { userId_requestKey: { userId: id, requestKey: data.requestKey } },
    });
  if (existing) {
    if (existing.payloadHash !== fingerprint)
      throw new RewardIssue(
        "conflict",
        "This request key was used with different details. Check your request history.",
      );
    return { payout: payoutDto(existing), replayed: true };
  }
  const user = await tx.user.findUniqueOrThrow({
      where: { id },
      include: { rewardAccount: true, payoutRequests: true },
    }),
    a = user.rewardAccount;
  if (
    !a ||
    a.learningXp !== user.totalXp ||
    !(await rewardSummary(tx, id)).reconciled
  )
    throw new RewardIssue(
      "reconciliation_required",
      "Staff needs to reconcile your reward balance before a request can be accepted. Your learning and earned XP remain saved.",
    );
  const rules = await getPayoutRules(a.programSlug, tx);
  if (data.ruleVersion !== rules.version)
    throw new RewardIssue(
      "rules_changed",
      "Program terms changed. Reload the current quote and confirm again.",
    );
  if (!rules.methods.includes(data.paymentMethod))
    throw new RewardIssue(
      "unsupported_method",
      "This method is not enabled for your program’s manual payment workflow.",
      400,
    );
  validateHandle(data.paymentMethod, data.paymentHandle);
  if (!user.email || !user.fullName)
    throw new RewardIssue(
      "profile_required",
      "Add your name and email before requesting rewards.",
      400,
    );
  if (data.xpAmount < rules.minXp)
    throw new RewardIssue(
      "minimum",
      "This request is below your program’s minimum XP.",
      400,
    );
  if (data.xpAmount > a.availableXp)
    throw new RewardIssue(
      "insufficient_balance",
      "There is not enough available XP for this request. Pending requests already reserve XP.",
      400,
    );
  const week = new Date(Date.now() - 7 * 86400000);
  const used = user.payoutRequests
    .filter(
      (p) =>
        [...reservedStatuses, "completed"].includes(p.status) &&
        p.createdAt >= week,
    )
    .reduce((sum, p) => sum + p.xpAmount, 0);
  if (used + data.xpAmount > rules.weeklyXpCap)
    throw new RewardIssue(
      "cap_exceeded",
      `Rolling seven-day limit reached. ${Math.max(0, rules.weeklyXpCap - used)} XP remains in this window.`,
      400,
    );
  let cents: number;
  try {
    cents = centsForXp(data.xpAmount, rules.rate);
  } catch (e) {
    throw new RewardIssue(
      "amount_range",
      e instanceof Error ? e.message : "Amount cannot be represented exactly.",
      400,
    );
  }
  if (cents <= 0)
    throw new RewardIssue(
      "amount_range",
      "This request rounds to zero cents. Choose a larger amount within your program limits.",
      400,
    );
  const payout = await tx.payoutRequest.create({
    data: {
      userId: id,
      xpAmount: data.xpAmount,
      amountCents: cents,
      dollarAmount: cents / 100,
      status: "pending",
      paymentMethod: data.paymentMethod,
      paymentHandle: data.paymentHandle,
      requestKey: data.requestKey,
      payloadHash: fingerprint,
      rulesSnapshot: JSON.stringify(rules),
    },
  });
  await tx.rewardAccount.update({
    where: { userId: id },
    data: {
      availableXp: { decrement: data.xpAmount },
      reservedXp: { increment: data.xpAmount },
    },
  });
  await tx.rewardEntry.create({
    data: {
      userId: id,
      payoutId: payout.id,
      sourceKey: `request:${data.requestKey}`,
      kind: "reserved",
      availableDelta: -data.xpAmount,
      reservedDelta: data.xpAmount,
      amountCents: cents,
      toStatus: "pending",
      metadata: JSON.stringify({
        ruleVersion: rules.version,
        payloadHash: fingerprint,
      }),
    },
  });
  await audit(tx, "PAYOUT_REQUESTED", payout.id, null, {
    xpAmount: data.xpAmount,
    amountCents: cents,
    ruleVersion: rules.version,
    method: data.paymentMethod,
  });
  return { payout: payoutDto(payout), replayed: false };
}
export const decisionSchema = z
  .object({
    payoutId: z.string().min(1).max(120),
    requestKey: keySchema,
    action: z.enum(["review", "approve", "reject", "complete"]),
    decisionNote: z.string().trim().min(1).max(500),
    paymentReference: z.string().trim().min(3).max(120).optional(),
    paidAt: z.string().datetime().optional(),
  })
  .strict();
export async function decideReward(
  tx: Tx,
  admin: { id: string; role: string },
  data: z.infer<typeof decisionSchema>,
) {
  await financialLock(tx);
  const original = await tx.payoutRequest.findUnique({
    where: { id: data.payoutId },
  });
  if (!original) throw new RewardIssue("not_found", "Request not found.", 404);
  await userLock(tx, original.userId);
  const p = await tx.payoutRequest.findUniqueOrThrow({
    where: { id: original.id },
  });
  const fingerprint = hash(data),
    sourceKey = `decision:${data.requestKey}`;
  const replay = await tx.rewardEntry.findUnique({
    where: { userId_sourceKey: { userId: p.userId, sourceKey } },
  });
  const roles = {
    review: ["admin", "caseworker"],
    approve: ["admin", "finance"],
    reject: ["admin", "finance", "caseworker"],
    complete: ["admin", "finance"],
  };
  if (!roles[data.action].includes(admin.role))
    throw new RewardIssue(
      "forbidden",
      "Your role cannot perform this decision.",
      403,
    );
  if (replay) {
    const meta = JSON.parse(replay.metadata);
    if (meta.payloadHash !== fingerprint || replay.adminId !== admin.id)
      throw new RewardIssue(
        "conflict",
        "Decision key already used with different details.",
      );
    return { payout: payoutDto(p), replayed: true };
  }
  if (p.amountCents === null || !p.rulesSnapshot)
    throw new RewardIssue(
      "reconciliation_required",
      "Reconcile the historical request before changing its state.",
    );
  const transitions: Record<string, string[]> = {
    pending: ["review", "reject"],
    reviewed: ["approve", "reject"],
    approved: ["complete"],
  };
  if (!transitions[p.status]?.includes(data.action))
    throw new RewardIssue(
      "invalid_transition",
      `This request is ${p.status}; that decision is not available.`,
    );
  const rules = JSON.parse(p.rulesSnapshot);
  if (
    data.action === "approve" &&
    rules.separateApprover &&
    p.reviewedById === admin.id
  )
    throw new RewardIssue(
      "separate_approver",
      "This program requires a different reviewer and approver.",
      403,
    );
  const a = await tx.rewardAccount.findUnique({ where: { userId: p.userId } });
  if (
    !a ||
    a.reservedXp < p.xpAmount ||
    !(await rewardSummary(tx, p.userId)).reconciled
  )
    throw new RewardIssue(
      "reconciliation_required",
      "The reservation needs reconciliation before a decision.",
    );
  const now = new Date();
  let status = "",
    update: Prisma.PayoutRequestUncheckedUpdateInput = {
      decisionNote: data.decisionNote,
    };
  if (data.action === "review") {
    status = "reviewed";
    update = {
      ...update,
      reviewedById: admin.id,
      reviewedAt: now,
      reviewNote: data.decisionNote,
    };
  }
  if (data.action === "approve") {
    status = "approved";
    update = { ...update, approvedById: admin.id, approvedAt: now };
  }
  if (data.action === "reject") {
    status = "rejected";
    await tx.rewardAccount.update({
      where: { userId: p.userId },
      data: {
        availableXp: { increment: p.xpAmount },
        reservedXp: { decrement: p.xpAmount },
      },
    });
  }
  if (data.action === "complete") {
    if (!data.paymentReference || !data.paidAt)
      throw new RewardIssue(
        "payment_evidence",
        "Enter the actual external payment reference and timestamp. Approval alone is not payment.",
        400,
      );
    const at = new Date(data.paidAt);
    if (at > new Date(now.getTime() + 300000) || at < p.createdAt)
      throw new RewardIssue(
        "payment_evidence",
        "Payment time must be after the request and not in the future.",
        400,
      );
    const duplicate = await tx.payoutRequest.findFirst({
      where: {
        paymentMethod: p.paymentMethod,
        paymentReference: data.paymentReference,
      },
    });
    if (duplicate)
      throw new RewardIssue(
        "duplicate_payment",
        "That payment reference is already recorded for this method. Do not send again.",
      );
    // This is a manual bookkeeping budget, not a bank balance or payment integration.
    await tx.poolBalance.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", balanceCents: 0 },
      update: {},
    });
    const debited = await tx.poolBalance.updateMany({
      where: { id: "singleton", balanceCents: { gte: p.amountCents } },
      data: {
        balanceCents: { decrement: p.amountCents },
        updatedById: admin.id,
      },
    });
    if (!debited.count)
      throw new RewardIssue(
        "insufficient_funds",
        "The bookkeeping pool is insufficient. Reconcile its funding before recording this payment; do not send again.",
      );
    await tx.poolAdjustment.create({
      data: {
        adminId: admin.id,
        amountCents: -p.amountCents,
        reason: `Manual payout recorded: ${p.id}`,
        payoutId: p.id,
        requestKey: `payout:${p.id}`,
      },
    });
    await tx.rewardAccount.update({
      where: { userId: p.userId },
      data: {
        reservedXp: { decrement: p.xpAmount },
        spentXp: { increment: p.xpAmount },
      },
    });
    status = "completed";
    update = {
      ...update,
      paymentReference: data.paymentReference,
      paidAt: at,
      paidById: admin.id,
    };
  }
  const updated = await tx.payoutRequest.update({
    where: { id: p.id },
    data: { ...update, status },
  });
  await tx.rewardEntry.create({
    data: {
      userId: p.userId,
      payoutId: p.id,
      adminId: admin.id,
      sourceKey,
      kind: data.action,
      fromStatus: p.status,
      toStatus: status,
      availableDelta: data.action === "reject" ? p.xpAmount : 0,
      reservedDelta: ["reject", "complete"].includes(data.action)
        ? -p.xpAmount
        : 0,
      spentDelta: data.action === "complete" ? p.xpAmount : 0,
      amountCents: p.amountCents,
      metadata: JSON.stringify({
        payloadHash: fingerprint,
        decisionNote: data.decisionNote,
        paidAt: data.paidAt || null,
        paymentReference: data.paymentReference || null,
      }),
    },
  });
  await audit(tx, `PAYOUT_${data.action.toUpperCase()}`, p.id, admin.id, {
    previousStatus: p.status,
    newStatus: status,
    amountCents: p.amountCents,
    paymentReference: data.paymentReference || null,
    paidAt: data.paidAt || null,
  });
  return { payout: payoutDto(updated), replayed: false };
}
