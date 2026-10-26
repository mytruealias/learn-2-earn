import { defineConfig, devices } from "@playwright/test";
import { getTestDatabaseUrl } from "./lib/test-database-safety";

const testUrl = getTestDatabaseUrl();
const E2E_PORT = Number(process.env.E2E_PORT || 5050);
if (!Number.isInteger(E2E_PORT) || E2E_PORT < 1024 || E2E_PORT > 65535) throw new Error("Invalid local e2e port.");
const baseURL = `http://127.0.0.1:${E2E_PORT}`;
if (process.env.PLAYWRIGHT_BASE_URL && process.env.PLAYWRIGHT_BASE_URL !== baseURL) {
  throw new Error("Remote or pre-existing test servers are refused.");
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  // Force serial execution. The Next dev server compiles routes lazily on
  // first hit and parallel workers race the compile + thrash the in-memory
  // rate-limiter state shared across requests, producing flaky lockout
  // counts. Serializing makes the suite deterministic.
  workers: 1,
  fullyParallel: false,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Spawn a Next.js server bound to the dedicated test DB so e2e never
  // touches the dev database. global-setup validates DATABASE_URL_TEST and
  // resets the schema before this server starts; the env block below points
  // the spawned process at that same URL.
  webServer: {
    command: `next dev -p ${E2E_PORT} -H 0.0.0.0`,
    port: E2E_PORT,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testUrl,
      DATABASE_URL_TEST: testUrl,
      TEST_DATABASE_NONCE: process.env.TEST_DATABASE_NONCE!,
      ROOT_DOMAIN: "", OPENAI_API_KEY: "", STRIPE_SECRET_KEY: "",
      SESSION_SECRET:
        process.env.E2E_SESSION_SECRET || "e2e-session-secret-do-not-use-in-prod",
      DEMO_ACCESS_CODE: process.env.DEMO_ACCESS_CODE || "LEARN2EARN",
      AUSTIN_ACCESS_PIN: process.env.AUSTIN_ACCESS_PIN || "1234",
      CITY_ACCESS_PIN: process.env.CITY_ACCESS_PIN || "9999",
      // Isolated build dir so the spawned dev server doesn't corrupt the
      // workflow dev server's .next cache.
      NEXT_DIST_DIR: ".next-e2e",
      NODE_ENV: "test",
    },
  },
});
