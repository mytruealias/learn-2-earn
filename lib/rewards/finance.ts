import { getPayoutRules } from "../payout-rules";
import { scopedDb, type StaffScope } from "../program-scope";
import { programMoneySummary } from "../staff/reporting";
export async function financeData(scope: StaffScope, configPage = 1) {
  const db = scopedDb(scope);
  const data = await db.$transaction(
    async (tx) => {
      const [
        pool,
        configs,
        configCount,
        adjustments,
        users,
        uninitialized,
        legacyRequests,
        adjustmentAccounts,
      ] = await Promise.all([
        tx.poolBalance.findUnique({ where: { id: "singleton" } }),
        tx.payoutConfig.findMany({
          orderBy: [{ programName: "asc" }, { id: "asc" }],
          take: 20,
          skip: (configPage - 1) * 20,
        }),
        tx.payoutConfig.count(),
        tx.poolAdjustment.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take: 20,
          select: {
            id: true,
            amountCents: true,
            reason: true,
            createdAt: true,
          },
        }),
        tx.user.count(),
        tx.user.count({ where: { rewardAccount: null } }),
        tx.payoutRequest.count({
          where: { OR: [{ amountCents: null }, { rulesSnapshot: null }] },
        }),
        tx.rewardAccount.count({ where: { openingAdjustmentXp: { not: 0 } } }),
      ]);
      return {
        defaultRules: await getPayoutRules(null, tx, scope.programId),
        pool: { balanceCents: pool?.balanceCents ?? 0 },
        configs: configs.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        configsPagination: {
          page: configPage,
          total: configCount,
          totalPages: Math.ceil(configCount / 20),
        },
        adjustments: adjustments.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
        reconciliation: {
          users,
          uninitialized,
          legacyRequests,
          adjustmentAccounts,
          checked: false,
        },
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 20000 },
  );
  const money = await programMoneySummary(scope);
  return {
    ...data,
    ...money,
    scope: { programId: scope.programId },
    stripe: {
      configured: false,
      availableCents: null,
      pendingCents: null,
      error:
        "A program-specific Stripe account is not configured. Platform balances are not shared with program staff.",
    },
  };
}
