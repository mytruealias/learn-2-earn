import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { assertDatabaseOperation } from './database-operation';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

async function main() {
  // Match Prisma's ordinary .env support without printing values or overriding injected bindings.
  if (existsSync('.env')) {
    for (const [key, value] of Object.entries(parse(readFileSync('.env')))) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  const operation = process.argv[2];
  const args = process.argv.slice(3);
  if (args.length !== 2 || args[0] !== '--confirm-database' || !args[1]) {
    throw new Error('Use --confirm-database with the reviewed database name.');
  }
  const commands: Record<string, string[][]> = {
    migrate: [['node_modules/prisma/build/index.js', 'migrate', 'deploy']],
    'content-sync': [['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], ['node_modules/tsx/dist/cli.mjs', 'prisma/seed-recovery.ts']],
    'bootstrap-admin': [['node_modules/tsx/dist/cli.mjs', 'prisma/seed-admin.ts']],
    'prepare-dev': [['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate']],
  };
  if (!commands[operation]) throw new Error('Unknown release operation.');
  process.env.RELEASE_OPERATION = operation;
  process.env.RELEASE_DATABASE_NAME = args[1];
  const lockUrl = new URL(process.env.DATABASE_URL ?? "");
  lockUrl.searchParams.set("connection_limit", "1");
  const prisma = new PrismaClient({ datasources: { db: { url: lockUrl.toString() } } });
  try {
    await assertDatabaseOperation(prisma, operation);
    if (operation === 'prepare-dev') {
      const url = new URL(process.env.DATABASE_URL!);
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || process.env.NODE_ENV === 'production') {
        throw new Error('Development schema push requires loopback and a non-production runtime.');
      }
    }
    // Serialize reviewed release operations on this database. Children use separate clients.
    await prisma.$queryRaw`SELECT pg_advisory_lock(74219931)::text`;
    for (const command of commands[operation]) {
      const result = spawnSync(process.execPath, command, { stdio: 'inherit', env: process.env });
      if (result.status !== 0) { process.exitCode = result.status ?? 1; return; }
    }
  } finally {
    // Closing this dedicated connection releases the session advisory lock, including on failure.
    await prisma.$disconnect();
  }
}
main().catch(() => { console.error('Database operation refused or failed. Verify target confirmation, permissions and the release runbook. Credentials are not logged.'); process.exitCode = 1; });
