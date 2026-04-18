import { config as loadDotEnv } from "dotenv";
import path from "path";
import fs from "fs";

const envTestPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envTestPath)) {
  loadDotEnv({ path: envTestPath, override: true });
}

// Force deterministic values for tests so behaviour does not depend on the
// developer's local .env. Override even if the workspace already has a value.
process.env.SESSION_SECRET = "test-session-secret-do-not-use-in-prod";
process.env.DEMO_ACCESS_CODE = "TESTACCESS";
process.env.AUSTIN_ACCESS_PIN = "1234";
process.env.CITY_ACCESS_PIN = "9999";
if (!process.env.NODE_ENV) {
  (process.env as Record<string, string>).NODE_ENV = "test";
}
