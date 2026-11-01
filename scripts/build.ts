import { spawnSync } from "node:child_process";

// Never let a framework build read the application's real database or provider bindings.
// Dynamic authenticated pages must stay dynamic; accidental DB use during prerender fails.
const env = {
  ...process.env,
  DATABASE_URL:
    "postgresql://build_only:unusable@127.0.0.1:1/build_only?connect_timeout=1",
  STAFF_MFA_ENCRYPTION_KEY: "",
  STAFF_RECOVERY_PASSWORD: "",
  STAFF_PROVISION_PASSWORD: "",
  DATABASE_URL_TEST: "",
  OPENAI_API_KEY: "",
  HUBERT_APPROVED_POLICY_VERSION: "",
  HUBERT_REVIEW_REFERENCE: "",
  STRIPE_SECRET_KEY: "",
  GITHUB_TOKEN: "",
  ADMIN_DEFAULT_PASSWORD: "",
  ADMIN_BOOTSTRAP_EMAIL: "",
  RELEASE_OPERATION: "",
  RELEASE_DATABASE_NAME: "",
};
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  { env, stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
