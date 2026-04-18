/**
 * Playwright global setup. Runs once before any e2e spec.
 *
 * Validates DATABASE_URL_TEST, refuses to wipe a non-test DB, then resets
 * the schema and seeds lessons + recovery content. The Playwright webServer
 * inherits this same DATABASE_URL_TEST as DATABASE_URL so every HTTP call
 * the e2e tests make hits the test database — never the dev DB.
 */
import { config as loadDotEnv } from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { URL } from "node:url";

export default async function globalSetup(): Promise<void> {
  const envTestPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    loadDotEnv({ path: envTestPath, override: true });
  }

  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error(
      "Refusing to run e2e tests: DATABASE_URL_TEST is not set. " +
        "Point it at a database whose name contains 'test' (see .env.test.example).",
    );
  }
  let dbName = "";
  try {
    dbName = new URL(testUrl).pathname.replace(/^\//, "");
  } catch {
    throw new Error(`Invalid DATABASE_URL_TEST: ${testUrl}`);
  }
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run e2e tests: database name "${dbName}" does not contain "test". ` +
        "Point DATABASE_URL_TEST at a database whose NAME contains 'test'.",
    );
  }
  // The DB name passed the "must contain 'test'" guard, so even if
  // DATABASE_URL == DATABASE_URL_TEST it's safe — both point at the test DB.

  // Force schema reset on the test DB and seed it. We point Prisma at the
  // test DB by setting DATABASE_URL for this single subprocess only.
  const env = { ...process.env, DATABASE_URL: testUrl };
  execSync("npx prisma db push --force-reset --skip-generate", {
    env,
    stdio: "inherit",
  });
  // Seeds run against a freshly reset schema, so any failure here is a
  // real setup regression — fail fast rather than letting tests run
  // against a half-empty DB.
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
  execSync("npx tsx prisma/seed-recovery.ts", { env, stdio: "inherit" });

  // Propagate so the Playwright webServer process inherits the test DB URL
  // as its DATABASE_URL, ensuring every HTTP call hits the test DB.
  process.env.DATABASE_URL = testUrl;

}
