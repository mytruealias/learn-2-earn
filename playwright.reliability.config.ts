import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
    testDir: "./e2e", testMatch: "reliability.spec.ts", workers: 1, retries: 0, timeout: 60000,
    use: { baseURL: "http://127.0.0.1:5056", contextOptions: { reducedMotion: "reduce" }, screenshot: "only-on-failure", launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined) } },
    webServer: { command: "node node_modules/next/dist/bin/next dev -p 5056 -H 0.0.0.0", port: 5056, reuseExistingServer: false, timeout: 120000, env: { DATABASE_URL: "postgresql://unusable:unusable@127.0.0.1:1/unusable?connect_timeout=1", DATABASE_URL_TEST: "", TEST_DATABASE_ADMIN_URL: "", NEXT_DIST_DIR: ".next-reliability-tests", NEXT_TELEMETRY_DISABLED: "1", ROOT_DOMAIN: "", SESSION_SECRET: "synthetic-public-browser-session-not-production", AUSTIN_ACCESS_PIN: "1234", CITY_ACCESS_PIN: "9999", NEXT_PUBLIC_SITE_URL: "https://learn2earn.example", OPERATIONAL_TELEMETRY_ENABLED: "", OPENAI_API_KEY: "", STRIPE_SECRET_KEY: "", HUBERT_APPROVED_POLICY_VERSION: "", HUBERT_REVIEW_REFERENCE: "", PARTNER_INQUIRY_PROGRAM_ID: "", PARTNER_INQUIRY_TEAM_NAME: "", PARTNER_INQUIRY_MONITORING_NOTICE: "", PARTNER_INQUIRY_REVIEW_REFERENCE: "", NODE_ENV: "test" } },
});
