import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { assertTestDatabase, getTestDatabaseUrl } from '../lib/test-database-safety';

export default async function globalSetup() {
  const url = getTestDatabaseUrl();
  const prisma = new PrismaClient();
  try { await assertTestDatabase(prisma); } finally { await prisma.$disconnect(); }
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--force-reset', '--skip-generate'], { env: process.env, stdio: 'inherit' });
  // Content imports are explicit and guarded even in tests. Never provision production admins.
  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/release.ts', 'content-sync', '--confirm-database', new URL(url).pathname.slice(1)], { env: process.env, stdio: 'inherit' });
}
