import { defineConfig } from "@playwright/test";
import marketing from "./playwright.marketing.config";

const browser = process.env.RELEASE_BROWSER || "chromium";
if (browser !== "chromium" && browser !== "firefox") {
  throw new Error("Choose a supported release browser: chromium or firefox.");
}
const server = marketing.webServer;
if (!server || Array.isArray(server)) throw new Error("A single isolated public test server is required.");

/** Public and explicitly unavailable states only; never substitutes for the isolated authenticated suites. */
export default defineConfig({
  ...marketing,
  testMatch: ["partner-website.spec.ts", "release-public.spec.ts"],
  webServer: { ...server, env: { ...server.env, NEXT_DIST_DIR: ".next-release-tests" } },
  use: {
    ...marketing.use,
    browserName: browser,
    ...(browser === "firefox" ? { launchOptions: {} } : {}),
  },
});
