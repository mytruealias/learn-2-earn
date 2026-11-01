import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "dotenv";
import { assertDatabaseOperation } from "./database-operation";
import {
  programBoundaryPlan,
  applyProgramBoundaryPlan,
} from "../lib/program-backfill";
async function main() {
  if (existsSync(".env"))
    for (const [k, v] of Object.entries(parse(readFileSync(".env"))))
      if (process.env[k] === undefined) process.env[k] = v;
  const args = process.argv.slice(2),
    allowed = new Set([
      "--confirm-database",
      "--mapping",
      "--expected-hash",
      "--apply",
    ]);
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error();
    options[args[i]] = args[i] === "--apply" ? "yes" : args[++i];
  }
  if (!options["--confirm-database"] || !options["--mapping"])
    throw new Error();
  process.env.RELEASE_OPERATION = "program-reconciliation";
  process.env.RELEASE_DATABASE_NAME = options["--confirm-database"];
  const db = new PrismaClient();
  try {
    await assertDatabaseOperation(db, "program-reconciliation");
    const mapping: unknown = JSON.parse(
      readFileSync(options["--mapping"], "utf8"),
    );
    const report = await db.$transaction(
      async (tx) => {
        if (options["--apply"]) {
          if (!options["--expected-hash"]) throw new Error();
          await applyProgramBoundaryPlan(
            tx,
            mapping,
            options["--expected-hash"],
          );
        }
        const p = await programBoundaryPlan(tx, mapping);
        return { hash: p.hash, totals: p.totals, issues: p.issues };
      },
      { isolationLevel: "Serializable", timeout: 60000 },
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Program reconciliation refused or failed. Verify target, private reviewed mapping, hash, backups and unresolved ownership. No credentials or records are logged.",
  );
  process.exitCode = 1;
});
