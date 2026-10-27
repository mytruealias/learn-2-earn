import { getPayoutRules } from "../payout-rules";
import prisma from "../prisma";
import { reconciliationPlan, reservedStatuses } from "./accounting";
import { sumCents } from "./money";
export async function financeData() {
  const data = await prisma.$transaction(
    async (tx) => {
      const [payouts, pool, configs, adjustments, report] = await Promise.all([
        tx.payoutRequest.findMany({ orderBy: { createdAt: "desc" } }),
        tx.poolBalance.findUnique({ where: { id: "singleton" } }),
        tx.payoutConfig.findMany({ orderBy: { programName: "asc" } }),
        tx.poolAdjustment.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amountCents: true,
            reason: true,
            createdAt: true,
          },
        }),
        reconciliationPlan(tx),
      ]);
      const paid = payouts.filter((p) => p.status === "completed"),
        pending = payouts.filter((p) => reservedStatuses.includes(p.status));
      return {
        defaultRules: await getPayoutRules(null, tx),
        windows: [7, 30, 90].map((days) => {
          const rows = paid.filter(
            (p) =>
              p.paidAt && p.paidAt >= new Date(Date.now() - days * 86400000),
          );
          return {
            days,
            cents: sumCents(rows.map((p) => p.amountCents)),
            count: rows.length,
          };
        }),
        pending: {
          cents: sumCents(pending.map((p) => p.amountCents)),
          count: pending.length,
          approved: pending.filter((p) => p.status === "approved").length,
        },
        legacyPaid: {
          count: paid.filter((p) => !p.paidAt).length,
          cents: sumCents(
            paid.filter((p) => !p.paidAt).map((p) => p.amountCents),
          ),
        },
        pool: { balanceCents: pool?.balanceCents ?? 0 },
        configs: configs.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        adjustments: adjustments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
        reconciliation: {
          hash: report.hash,
          totals: report.totals,
          users: report.users,
          uninitialized: report.uninitialized,
          legacyRequests: report.legacyRequests,
          adjustmentAccounts: report.adjustmentAccounts,
          issues: report.issues,
        },
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 20000 },
  );
  let stripe: {
    configured: boolean;
    availableCents: number | null;
    pendingCents: number | null;
    error: string | null;
  } = {
    configured: !!process.env.STRIPE_SECRET_KEY,
    availableCents: null,
    pendingCents: null,
    error: null,
  };
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import("stripe");
      const balance = await new Stripe(
        process.env.STRIPE_SECRET_KEY,
      ).balance.retrieve();
      stripe = {
        ...stripe,
        availableCents:
          balance.available.find((b) => b.currency === "usd")?.amount ?? 0,
        pendingCents:
          balance.pending.find((b) => b.currency === "usd")?.amount ?? 0,
      };
    } catch {
      stripe = {
        ...stripe,
        error:
          "Stripe balance could not be read. This connection does not send program payouts.",
      };
    }
  }
  return { ...data, stripe };
}
