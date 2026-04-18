import { execSync } from "child_process";
import { config as loadDotEnv } from "dotenv";
import path from "path";
import fs from "fs";

/**
 * Global vitest setup. Runs ONCE before any test file.
 *
 * Resets the test database to a clean state by running
 * `prisma db push --force-reset` against the URL in .env.test (or the
 * DATABASE_URL_TEST env var). Tests must NEVER touch the dev/prod DB.
 */
export default async function globalSetup() {
  const envTestPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    loadDotEnv({ path: envTestPath, override: true });
  }

  const testDbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  if (!testDbUrl) {
    throw new Error(
      "No test database URL set. Define DATABASE_URL_TEST in .env.test " +
        "(or DATABASE_URL pointing at a throw-away database) before running API tests."
    );
  }

  // Defence in depth: only allow wiping a database whose *name* (path segment)
  // contains "test", and refuse if the URL exactly matches DATABASE_URL.
  // A loose substring match on the full URL would let a username like
  // "test_user" or a host like "tester.example.com" pass — the path segment
  // check below requires the database name itself to be marked as a test DB.
  let dbName = "";
  try {
    dbName = new URL(testDbUrl).pathname.replace(/^\//, "");
  } catch {
    throw new Error("DATABASE_URL_TEST is not a valid URL.");
  }
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run tests: database name "${dbName}" does not contain "test". ` +
        "Point DATABASE_URL_TEST at a database whose NAME contains 'test' (e.g. learn2earn_test)."
    );
  }
  const liveDbUrl = process.env.DATABASE_URL;
  if (liveDbUrl && testDbUrl === liveDbUrl) {
    throw new Error(
      "Refusing to run tests: DATABASE_URL_TEST equals DATABASE_URL. Use a separate test DB."
    );
  }

  process.env.DATABASE_URL = testDbUrl;

  console.log("[tests] Resetting test database...");
  execSync("npx prisma db push --force-reset --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });
  console.log("[tests] Test database ready.");
}
