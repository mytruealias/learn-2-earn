import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { assertDatabaseOperation } from "./database-operation";
async function main() {
  if (existsSync(".env"))
    for (const [k, v] of Object.entries(parse(readFileSync(".env"))))
      if (process.env[k] === undefined) process.env[k] = v;
  const args = process.argv.slice(2),
    options: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (
      ![
        "--confirm-database",
        "--staff-id",
        "--verification-reference",
        "--apply",
      ].includes(args[i])
    )
      throw new Error();
    options[args[i]] = args[i] === "--apply" ? "yes" : args[++i];
  }
  if (
    !options["--confirm-database"] ||
    !options["--staff-id"] ||
    !options["--verification-reference"] ||
    options["--verification-reference"].length < 5
  )
    throw new Error();
  process.env.RELEASE_OPERATION = "staff-recovery";
  process.env.RELEASE_DATABASE_NAME = options["--confirm-database"];
  const db = new PrismaClient();
  try {
    await assertDatabaseOperation(db, "staff-recovery");
    const target = await db.adminUser.findUnique({
      where: { id: options["--staff-id"] },
      select: { id: true, isActive: true },
    });
    if (!target || !target.isActive) throw new Error();
    if (!options["--apply"]) {
      console.log(
        "Verified target account exists. No changes made. Confirm identity through the external verified recovery process before applying.",
      );
      return;
    }
    const password = z
        .string()
        .min(16)
        .max(200)
        .parse(process.env.STAFF_RECOVERY_PASSWORD),
      passwordHash = await bcrypt.hash(password, 12);
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "AdminUser" WHERE "id"=${target.id} FOR UPDATE`;
      await tx.adminSession.updateMany({
        where: { adminId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.staffRecoveryCode.deleteMany({ where: { adminId: target.id } });
      await tx.adminUser.update({
        where: { id: target.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          mfaSecretEncrypted: null,
          mfaConfirmedAt: null,
          mfaLastStep: null,
          loginFailures: 0,
          lockedUntil: null,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "VERIFIED_OPERATOR_STAFF_RECOVERY",
          entity: "AdminUser",
          entityId: target.id,
          details: JSON.stringify({
            verificationReference: options["--verification-reference"],
            sessionsRevoked: true,
            requiresNewMfa: true,
          }),
        },
      });
    });
    console.log(
      "Verified recovery recorded. Existing memberships unchanged. Deliver the temporary password privately; password replacement and new MFA enrollment are required.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Staff recovery refused or failed. Verify target, active account, documented identity proof and private recovery password. No secrets are logged.",
  );
  process.exitCode = 1;
});
