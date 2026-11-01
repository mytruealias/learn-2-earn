import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
/** Public-only tests: no app credentials, no DB reset, no live provider or private records. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "partner-website.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5055",
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 5055 -H 0.0.0.0",
    port: 5055,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        "postgresql://public_only:unusable@127.0.0.1:1/public_only?connect_timeout=1",
      DATABASE_URL_TEST: "",
      TEST_DATABASE_ADMIN_URL: "",
      NEXT_DIST_DIR: ".next-marketing-tests",
      NEXT_TELEMETRY_DISABLED: "1",
      ROOT_DOMAIN: "",
      NEXT_PUBLIC_SITE_URL: "https://learn2earn.example",
      SESSION_SECRET: "synthetic-public-browser-session-not-production",
      AUSTIN_ACCESS_PIN: "1234",
      CITY_ACCESS_PIN: "9999",
      OPENAI_API_KEY: "",
      STRIPE_SECRET_KEY: "",
      HUBERT_APPROVED_POLICY_VERSION: "",
      HUBERT_REVIEW_REFERENCE: "",
      PARTNER_INQUIRY_PROGRAM_ID: "",
      PARTNER_INQUIRY_TEAM_NAME: "",
      PARTNER_INQUIRY_MONITORING_NOTICE: "",
      PARTNER_INQUIRY_REVIEW_REFERENCE: "",
    },
  },
});
