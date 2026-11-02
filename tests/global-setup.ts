import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { assertTestDatabase, getTestDatabaseUrl } from '../lib/test-database-safety';

export default async function globalSetup() {
  getTestDatabaseUrl();
  const prisma = new PrismaClient();
  try { await assertTestDatabase(prisma); } finally { await prisma.$disconnect(); }
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--force-reset', '--skip-generate'], {
    stdio: 'inherit', env: process.env,
  });
}
