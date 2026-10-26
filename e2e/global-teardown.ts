import { assertTestDatabase, getTestDatabaseUrl } from "../lib/test-database-safety";
/**
 * Playwright global teardown. Removes the test admin fixture so no e2e
 * artifact persists between runs. Per-spec cleanup handles learner rows.
 */
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "e2e-admin@learn2earn.test";

export default async function globalTeardown(): Promise<void> {
  const url = getTestDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    await assertTestDatabase(prisma);
    const admin = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
    if (admin) {
      await prisma.auditLog.deleteMany({ where: { adminId: admin.id } });
      await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });
      await prisma.payoutRequest.updateMany({
        where: { reviewedById: admin.id },
        data: { reviewedById: null },
      });
      await prisma.payoutRequest.updateMany({ where: { approvedById: admin.id }, data: { approvedById: null } });
      await prisma.adminUser.delete({ where: { id: admin.id } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
