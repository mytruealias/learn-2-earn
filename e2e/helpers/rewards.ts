import { PrismaClient } from "@prisma/client";
import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
import {
  backfillRewards,
  reconciliationPlan,
} from "../../lib/rewards/accounting";
import bcrypt from "bcryptjs";
const db = new PrismaClient({
  datasources: { db: { url: getTestDatabaseUrl() } },
});
export async function rewardFixture() {
  await assertTestDatabase(db);
  const user = await db.user.create({
    data: {
      email: `reward-${Date.now()}-${Math.random()}@example.test`,
      fullName: "Synthetic reward learner",
      passwordHash: await bcrypt.hash("synthetic-reward-password", 4),
      totalXp: 500,
    },
  });
  const plan = await db.$transaction((tx) => reconciliationPlan(tx));
  await db.$transaction((tx) => backfillRewards(tx, plan.hash, true));
  return user;
}
export async function reconcileRewardFixtures() {
  await assertTestDatabase(db);
  const p = await db.$transaction((tx) => reconciliationPlan(tx));
  await db.$transaction((tx) => backfillRewards(tx, p.hash, true));
}
export async function rewardStaff(role = "admin") {
  await assertTestDatabase(db);
  return db.adminUser.create({
    data: {
      email: `reward-staff-${Date.now()}-${Math.random()}@example.test`,
      fullName: "Synthetic finance staff",
      role,
      passwordHash: await bcrypt.hash("synthetic-staff-password", 4),
    },
  });
}
export async function rewardSnapshot(userId: string) {
  await assertTestDatabase(db);
  return {
    user: await db.user.findUniqueOrThrow({ where: { id: userId } }),
    account: await db.rewardAccount.findUniqueOrThrow({ where: { userId } }),
    requests: await db.payoutRequest.findMany({ where: { userId } }),
    entries: await db.rewardEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  };
}
export async function disconnectRewards() {
  await db.$disconnect();
}
