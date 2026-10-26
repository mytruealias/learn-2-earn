import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { assertDatabaseOperation } from '../scripts/database-operation';

const prisma = new PrismaClient();
async function main() {
  await assertDatabaseOperation(prisma, 'bootstrap-admin');
  const email = z.string().trim().toLowerCase().email().parse(process.env.ADMIN_BOOTSTRAP_EMAIL);
  const password = z.string().min(16).max(200).parse(process.env.ADMIN_DEFAULT_PASSWORD);
  // No upsert, default email, password reset or account recreation on deployment.
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(74219932)::text`;
    if (await tx.adminUser.count()) throw new Error('Staff already exists; use authenticated staff management or reviewed recovery.');
    await tx.adminUser.create({ data: {
      email, passwordHash: await bcrypt.hash(password, 12),
      fullName: 'System Administrator', role: 'admin',
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
  console.log('First administrator provisioned. Remove bootstrap credentials from runtime settings.');
}
main().catch(() => {
  console.error('First-admin provisioning refused or failed. Requires an empty staff table, explicit database confirmation, email and a password of at least 16 characters. No credentials are logged.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
