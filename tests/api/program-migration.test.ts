import { describe, it, expect, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import {
  readFileSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import prisma from "@/lib/prisma";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { clearDb, createUser } from "../helpers/factories";
import {
  programBoundaryPlan,
  applyProgramBoundaryPlan,
} from "@/lib/program-backfill";
function statements(sql: string) {
  const result: string[] = [];
  let current = "",
    quote = "",
    dollar = false,
    comment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i],
      pair = sql.slice(i, i + 2);
    if (comment) {
      current += ch;
      if (ch === "\n") comment = false;
      continue;
    }
    if (!quote && pair === "$$") {
      dollar = !dollar;
      current += pair;
      i++;
      continue;
    }
    if (!dollar && !quote && pair === "--") {
      comment = true;
      current += pair;
      i++;
      continue;
    }
    if (!dollar && (ch === "'" || ch === '"')) {
      if (quote === ch && sql[i + 1] === ch) {
        current += ch + ch;
        i++;
        continue;
      }
      quote = quote ? (quote === ch ? "" : quote) : ch;
    }
    if (ch === ";" && !quote && !dollar) {
      if (current.trim()) result.push(current);
      current = "";
    } else current += ch;
  }
  if (current.trim()) result.push(current);
  return result;
}
describe("exact additive program/staff migration and reviewed legacy mapping", () => {
  beforeEach(clearDb);
  it("preserves the old schema's learner/money records, grants nothing automatically and enforces owner immutability", async () => {
    await assertTestDatabase(prisma);
    const { user } = await createUser({ totalXp: 77 });
    await prisma.payoutRequest.create({
      data: {
        id: "synthetic-legacy-money",
        userId: user.id,
        xpAmount: 20,
        dollarAmount: 1.005,
        status: "pending",
        paymentMethod: "venmo",
        paymentHandle: "@synthetic-old",
      },
    });
    const reverse = execFileSync(
      process.execPath,
      [
        "node_modules/prisma/build/index.js",
        "migrate",
        "diff",
        "--from-schema-datamodel",
        "prisma/schema.prisma",
        "--to-schema-datamodel",
        "tests/fixtures/pre-program-schema.prisma",
        "--script",
      ],
      { encoding: "utf8", env: process.env },
    );
    const migration = readFileSync(
        "prisma/migrations/20261027040000_program_boundaries/migration.sql",
        "utf8",
      ),
      workflow = readFileSync(
        "prisma/migrations/20261029000000_staff_workflows/migration.sql",
        "utf8",
      );
    const support = readFileSync(
      "prisma/migrations/20261101000000_support_integrity/migration.sql",
      "utf8",
    );
    const rollback = new Error("synthetic rollback sentinel");
    let evidence: Record<string, unknown> = {};
    try {
      await prisma.$transaction(
        async (tx) => {
          for (const sql of statements(reverse))
            await tx.$executeRawUnsafe(sql);
          for (const sql of statements(migration))
            await tx.$executeRawUnsafe(sql);
          for (const sql of statements(workflow))
            await tx.$executeRawUnsafe(sql);
          for (const sql of statements(support))
            await tx.$executeRawUnsafe(sql);
          expect(await tx.staffMembership.count()).toBe(0);
          expect(await tx.participantEnrollment.count()).toBe(0);
          const mapping = {
            version: 1,
            organization: {
              id: "legacy-organization",
              name: "Verified synthetic legacy organization",
            },
            program: {
              id: "legacy-program",
              slug: "legacy",
              name: "Verified synthetic legacy program",
              defaultConfigSlug: null,
            },
            staffIds: [],
            participantIds: [user.id],
            serviceIds: [],
            configIds: [],
            acceptLegacyPool: false,
            verificationReference: "synthetic-verification",
          };
          const plan = await programBoundaryPlan(tx, mapping);
          await applyProgramBoundaryPlan(tx, mapping, plan.hash);
          const after = await programBoundaryPlan(tx, mapping);
          expect(after.totals.createEnrollments).toBe(0);
          expect(after.totals.assignPayouts).toBe(0);
          expect(
            (await tx.user.findUniqueOrThrow({ where: { id: user.id } }))
              .totalXp,
          ).toBe(77);
          const p = await tx.payoutRequest.findUniqueOrThrow({
            where: { id: "synthetic-legacy-money" },
          });
          expect(p.dollarAmount).toBe(1.005);
          expect(p.amountCents).toBeNull();
          expect(p.programId).toBe("legacy-program");
          const repeat = await programBoundaryPlan(tx, mapping);
          await applyProgramBoundaryPlan(tx, mapping, repeat.hash);
          expect(
            await tx.auditLog.count({
              where: { action: "LEGACY_PROGRAM_BOUNDARY_REVIEWED" },
            }),
          ).toBe(1);
          await tx.program.create({
            data: {
              id: "synthetic-other-program",
              organizationId: "legacy-organization",
              slug: "synthetic-other-program",
              name: "Other synthetic program",
            },
          });
          await tx.$executeRawUnsafe("SAVEPOINT owner_guard");
          let ownerBlocked = false;
          try {
            await tx.participantEnrollment.update({
              where: { userId: user.id },
              data: { programId: "synthetic-other-program" },
            });
          } catch {
            ownerBlocked = true;
          }
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT owner_guard");
          expect(ownerBlocked).toBe(true);
          // Verify support evidence triggers using the exact migration, not db-push alone.
          const intake = await tx.case.create({
            data: {
              programId: "legacy-program",
              userId: user.id,
              title: "Synthetic intake evidence",
              message: "Synthetic private help",
              intakeKey: "synthetic-key",
              intakePayloadHash: "synthetic-hash",
              intakeSnapshot: "{}",
            },
          });
          await tx.$executeRawUnsafe("SAVEPOINT support_evidence_guard");
          let supportEvidenceBlocked = false;
          try {
            await tx.case.update({
              where: { id: intake.id },
              data: { message: "Overwritten original" },
            });
          } catch {
            supportEvidenceBlocked = true;
          }
          await tx.$executeRawUnsafe(
            "ROLLBACK TO SAVEPOINT support_evidence_guard",
          );
          expect(supportEvidenceBlocked).toBe(true);
          await tx.adminUser.create({
            data: {
              id: "synthetic-ack-actor",
              email: "ack-actor@example.test",
              fullName: "Synthetic actor",
              passwordHash: "unused-synthetic-hash",
              role: "finance",
            },
          });
          await tx.staffMembership.create({
            data: {
              adminId: "synthetic-ack-actor",
              programId: "legacy-program",
              role: "finance",
            },
          });
          await tx.$executeRawUnsafe("SAVEPOINT support_ack_guard");
          let unauthorizedAckBlocked = false;
          try {
            await tx.case.update({
              where: { id: intake.id },
              data: {
                acknowledgedAt: new Date(),
                acknowledgedById: "synthetic-ack-actor",
              },
            });
          } catch {
            unauthorizedAckBlocked = true;
          }
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT support_ack_guard");
          expect(unauthorizedAckBlocked).toBe(true);
          await tx.staffMembership.updateMany({
            where: { adminId: "synthetic-ack-actor" },
            data: { role: "caseworker" },
          });
          await tx.case.update({
            where: { id: intake.id },
            data: {
              acknowledgedAt: new Date(),
              acknowledgedById: "synthetic-ack-actor",
            },
          });
          evidence = {
            supportEvidenceBlocked,
            unauthorizedAckBlocked,
            authorizedAckRecorded: true,
            exactMigrationNames: [
              "20261027040000_program_boundaries",
              "20261029000000_staff_workflows",
              "20261101000000_support_integrity",
            ],
            source: "nonce-attested disposable PostgreSQL",
            exactAdditiveSqlApplied: true,
            automaticMemberships: 0,
            automaticEnrollments: 0,
            reviewedEnrollments: 1,
            lifetimeXpBefore: 77,
            lifetimeXpAfter: 77,
            recordedFloatBefore: 1.005,
            recordedFloatAfter: 1.005,
            exactCentsNotRepriced: true,
            remainingAssignments: after.totals.assignPayouts,
            ownerChangeBlocked: true,
            idempotentAuditCount: 1,
            transactionRolledBack: true,
            originalRowsPreserved: true,
          };
          throw rollback;
        },
        { timeout: 60000 },
      );
    } catch (e) {
      if (e !== rollback) throw e;
    }
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).totalXp,
    ).toBe(77);
    expect(
      (
        await prisma.payoutRequest.findUniqueOrThrow({
          where: { id: "synthetic-legacy-money" },
        })
      ).programId,
    ).toBeNull();
    if (process.env.PROGRAM_EVIDENCE_DIR) {
      mkdirSync(process.env.PROGRAM_EVIDENCE_DIR, { recursive: true });
      writeFileSync(
        join(process.env.PROGRAM_EVIDENCE_DIR, "migration-evidence.json"),
        JSON.stringify(evidence, null, 2),
      );
    }
  });
  it("runs the actual target-confirmed operator CLI without broad grants or production credentials", async () => {
    await assertTestDatabase(prisma);
    const dir = mkdtempSync(join(tmpdir(), "l2e-program-map-"));
    try {
      const path = join(dir, "mapping.json");
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          organization: {
            id: "legacy-organization",
            name: "Synthetic reviewed organization",
          },
          program: {
            id: "legacy-program",
            slug: "legacy",
            name: "Synthetic reviewed program",
            defaultConfigSlug: null,
          },
          staffIds: [],
          participantIds: [],
          serviceIds: [],
          configIds: [],
          acceptLegacyPool: false,
          verificationReference: "synthetic-reviewed-mapping",
        }),
      );
      const args = [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/reconcile-programs.ts",
        "--confirm-database",
        new URL(process.env.DATABASE_URL!).pathname.slice(1),
        "--mapping",
        path,
      ];
      const output = execFileSync(process.execPath, args, {
        encoding: "utf8",
        env: process.env,
      });
      const report = JSON.parse(output);
      expect(report.issues).toEqual([]);
      expect(report.totals.reviewedStaff).toBe(0);
      expect(await prisma.staffMembership.count()).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("verified operator provisioning and credential recovery", () => {
  beforeEach(clearDb);
  it("provisions one reviewed independent program, refuses overwrite, and revokes credentials through the real recovery CLI", async () => {
    await assertTestDatabase(prisma);
    const dir = mkdtempSync(join(tmpdir(), "l2e-program-provision-"));
    try {
      const path = join(dir, "plan.json");
      writeFileSync(
        path,
        JSON.stringify({
          organization: {
            id: "operator-new-org",
            name: "Synthetic independent organization",
          },
          program: {
            id: "operator-new-program",
            slug: "operator-new-program",
            name: "Synthetic independent program",
          },
          memberships: [],
          firstAdmin: {
            email: "operator-program-admin@example.test",
            fullName: "Synthetic new administrator",
          },
          verificationReference: "synthetic-reviewed-provisioning",
        }),
      );
      const env = {
          ...process.env,
          STAFF_PROVISION_PASSWORD: "synthetic-private-provision-password",
          STAFF_RECOVERY_PASSWORD: "synthetic-private-recovery-password",
        },
        name = new URL(process.env.DATABASE_URL!).pathname.slice(1),
        args = [
          "node_modules/tsx/dist/cli.mjs",
          "scripts/provision-program.ts",
          "--confirm-database",
          name,
          "--plan",
          path,
        ];
      const report = JSON.parse(
        execFileSync(process.execPath, args, { encoding: "utf8", env }),
      );
      expect(report.newStaff).toBe(1);
      expect(await prisma.program.count()).toBe(0);
      execFileSync(
        process.execPath,
        [...args, "--apply", "--expected-hash", report.hash],
        { encoding: "utf8", env },
      );
      const admin = await prisma.adminUser.findUniqueOrThrow({
        where: { email: "operator-program-admin@example.test" },
      });
      expect(admin.mustChangePassword).toBe(true);
      expect(
        await prisma.staffMembership.count({
          where: {
            adminId: admin.id,
            programId: "operator-new-program",
            role: "program_admin",
          },
        }),
      ).toBe(1);
      await prisma.adminSession.create({
        data: {
          token: "synthetic-old-opaque-session-hash",
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      const recover = [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/recover-staff.ts",
        "--confirm-database",
        name,
        "--staff-id",
        admin.id,
        "--verification-reference",
        "synthetic-verified-identity-record",
      ];
      execFileSync(process.execPath, recover, { encoding: "utf8", env });
      expect(
        await prisma.adminSession.count({
          where: { adminId: admin.id, revokedAt: null },
        }),
      ).toBe(1);
      execFileSync(process.execPath, [...recover, "--apply"], {
        encoding: "utf8",
        env,
      });
      const updated = await prisma.adminUser.findUniqueOrThrow({
        where: { id: admin.id },
      });
      expect(updated.passwordHash !== admin.passwordHash).toBe(true);
      expect(updated.mustChangePassword).toBe(true);
      expect(updated.mfaConfirmedAt).toBeNull();
      expect(
        await prisma.adminSession.count({
          where: { adminId: admin.id, revokedAt: null },
        }),
      ).toBe(0);
      expect(
        await prisma.staffMembership.count({ where: { adminId: admin.id } }),
      ).toBe(1);
      expect(
        await prisma.auditLog.count({
          where: { action: "VERIFIED_OPERATOR_STAFF_RECOVERY" },
        }),
      ).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
