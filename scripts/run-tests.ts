import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

const suites: Record<string, string[]> = {
  api: ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.ts'],
  'api-watch': ['node_modules/vitest/vitest.mjs', '--config', 'vitest.config.ts', '--watch'],
  http: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/city-pin.spec.ts', 'e2e/learner-flow.spec.ts', 'e2e/payout-approval.spec.ts'],
  browser: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/release-smoke.spec.ts'],
  progression: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/learning-progression.spec.ts'],
  journey: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/learner-journey.spec.ts'],
  design: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/design-system.spec.ts'],
  legacy: ['node_modules/@playwright/test/cli.js', 'test', 'e2e/admin.spec.ts'],
};

async function main() {
  const suite = suites[process.argv[2]];
  if (!suite) throw new Error('Unknown test suite.');
  // Read only the test administrator binding. Never import application .env values or override CI.
  const local = existsSync('.env.test') ? parse(readFileSync('.env.test')) : {};
  const adminValue = process.env.TEST_DATABASE_ADMIN_URL || local.TEST_DATABASE_ADMIN_URL;
  if (!adminValue) throw new Error('Set TEST_DATABASE_ADMIN_URL for a local PostgreSQL instance with CREATE DATABASE/ROLE permissions.');
  let adminUrl: URL;
  try { adminUrl = new URL(adminValue); } catch { throw new Error('Invalid test administrator configuration.'); }
  if (!['postgres:', 'postgresql:'].includes(adminUrl.protocol) ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(adminUrl.hostname) || adminUrl.pathname !== '/postgres') {
    throw new Error('Test provisioning requires the postgres maintenance database on loopback; remote/application targets are refused.');
  }
  const name = 'l2e_test_' + randomBytes(12).toString('hex');
  const password = randomBytes(32).toString('hex');
  const nonce = randomBytes(32).toString('hex');
  const url = new URL(adminUrl);
  url.username = name; url.password = password; url.pathname = '/' + name;
  url.search = '?schema=public&connection_limit=4';
  const admin = new PrismaClient({ datasources: { db: { url: adminValue } } });
  let roleCreated = false, databaseCreated = false;
  try {
    // All SQL identifiers/passwords below are generated hex, never caller-controlled strings.
    await admin.$executeRawUnsafe(`CREATE ROLE "${name}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    roleCreated = true;
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}" OWNER "${name}"`);
    databaseCreated = true;
    const isolated = new PrismaClient({ datasources: { db: { url: url.toString() } } });
    try {
      await isolated.$executeRawUnsafe('CREATE SCHEMA l2e_test_guard');
      await isolated.$executeRawUnsafe('CREATE TABLE l2e_test_guard.capability (nonce text PRIMARY KEY)');
      await isolated.$executeRaw`INSERT INTO l2e_test_guard.capability (nonce) VALUES (${nonce})`;
    } finally { await isolated.$disconnect(); }
    const env: NodeJS.ProcessEnv = {
      ...process.env, DATABASE_URL: url.toString(), DATABASE_URL_TEST: url.toString(),
      TEST_DATABASE_NONCE: nonce, TEST_DATABASE_ADMIN_URL: '',
      SESSION_SECRET: randomBytes(32).toString('hex'), ROOT_DOMAIN: '',
      OPENAI_API_KEY: '', STRIPE_SECRET_KEY: '', GITHUB_TOKEN: '',
      DEMO_ACCESS_CODE: 'LEARN2EARN', AUSTIN_ACCESS_PIN: '1234', CITY_ACCESS_PIN: '9999',
      NODE_ENV: 'test', NEXT_TELEMETRY_DISABLED: '1',
      PROGRESSION_EVIDENCE_DIR: process.env.PROGRESSION_EVIDENCE_DIR || '',
      JOURNEY_EVIDENCE_DIR: process.env.JOURNEY_EVIDENCE_DIR || '',
      DESIGN_EVIDENCE_DIR: process.env.DESIGN_EVIDENCE_DIR || '',
      PLAYWRIGHT_CHROMIUM_EXECUTABLE: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || local.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '',
    };
    console.log('[tests] Fresh isolated database and restricted role provisioned; credentials suppressed.');
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, [...suite, ...process.argv.slice(3)], { stdio: 'inherit', env });
      const terminate = () => child.kill('SIGTERM');
      process.on('SIGINT', terminate); process.on('SIGTERM', terminate);
      child.once('error', reject);
      child.once('exit', (status) => {
        process.off('SIGINT', terminate); process.off('SIGTERM', terminate);
        resolve(status ?? 1);
      });
    });
    process.exitCode = code;
  } finally {
    // Only ever remove resources whose unpredictable identifiers this invocation created.
    try {
      if (databaseCreated) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
      if (roleCreated) await admin.$executeRawUnsafe(`DROP ROLE "${name}"`);
    } finally { await admin.$disconnect(); }
  }
}
main().catch(() => { console.error('Test harness failed. Verify local test provisioning access; no connection details are logged.'); process.exitCode = 1; });
