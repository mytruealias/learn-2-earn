import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { assertDatabaseOperation } from "./database-operation";
import { backfillRewards, reconciliationPlan } from "../lib/rewards/accounting";
async function main() {
  if (existsSync(".env"))
    for (const [k, v] of Object.entries(parse(readFileSync(".env"))))
      if (process.env[k] === undefined) process.env[k] = v;
  const args = process.argv.slice(2),
    write = args.includes("--apply"),
    target = args[args.indexOf("--confirm-database") + 1],
    expected = args[args.indexOf("--expected-hash") + 1];
  if (!args.includes("--confirm-database") || !target)
    throw new Error(
      "Explicit database confirmation is required, including dry runs.",
    );
  process.env.RELEASE_OPERATION = "rewards-reconcile";
  process.env.RELEASE_DATABASE_NAME = target;
  const db = new PrismaClient();
  try {
    await assertDatabaseOperation(db, "rewards-reconcile");
    if (write) {
      if (!args.includes("--expected-hash") || !expected)
        throw new Error(
          "Review a fresh report and supply --expected-hash before applying.",
        );
      await db.$transaction(
        (tx) =>
          backfillRewards(
            tx,
            expected,
            args.includes("--accept-legacy-xp-differences"),
          ),
        { maxWait: 15000, timeout: 120000 },
      );
    }
    const report = await db.$transaction((tx) => reconciliationPlan(tx), {
      isolationLevel: "RepeatableRead",
    });
    console.log(
      JSON.stringify(
        {
          mode: write ? "applied-and-checked" : "read-only",
          hash: report.hash,
          users: report.users,
          totals: report.totals,
          uninitialized: report.uninitialized,
          legacyRequests: report.legacyRequests,
          adjustmentAccounts: report.adjustmentAccounts,
          issues: report.issues,
          complete:
            report.uninitialized === 0 &&
            report.legacyRequests === 0 &&
            !report.issues.length,
        },
        null,
        2,
      ),
    );
    if (report.issues.length) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Reward reconciliation refused or failed. Review the verified target, report hash and runbook. Credentials and learner records are not logged.",
  );
  process.exitCode = 1;
});
