import prisma from "@/lib/prisma";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { reconciliationPlan, backfillRewards } from "@/lib/rewards/accounting";
export async function reconcileFixtures() {
  await assertTestDatabase(prisma);
  return prisma.$transaction(
    async (tx) => {
      const plan = await reconciliationPlan(tx);
      return backfillRewards(tx, plan.hash, true);
    },
    { timeout: 20000 },
  );
}
