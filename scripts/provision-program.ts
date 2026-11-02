import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { parse } from "dotenv";
import { assertDatabaseOperation } from "./database-operation";
const planSchema = z
  .object({
    organization: z
      .object({
        id: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
      })
      .strict(),
    program: z
      .object({
        id: z.string().min(1).max(120),
        slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
        name: z.string().min(1).max(200),
      })
      .strict(),
    memberships: z
      .array(
        z
          .object({
            adminId: z.string().min(1).max(120),
            role: z.enum(["program_admin", "caseworker", "finance"]),
          })
          .strict(),
      )
      .max(200),
    firstAdmin: z
      .object({
        email: z.string().trim().toLowerCase().email(),
        fullName: z.string().min(1).max(120),
      })
      .strict()
      .optional(),
    verificationReference: z.string().min(5).max(200),
  })
  .strict();
async function main() {
  if (existsSync(".env"))
    for (const [k, v] of Object.entries(parse(readFileSync(".env"))))
      if (process.env[k] === undefined) process.env[k] = v;
  const args = process.argv.slice(2),
    o: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (
      !["--confirm-database", "--plan", "--expected-hash", "--apply"].includes(
        args[i],
      )
    )
      throw new Error();
    o[args[i]] = args[i] === "--apply" ? "yes" : args[++i];
  }
  if (!o["--confirm-database"] || !o["--plan"]) throw new Error();
  const plan = planSchema.parse(JSON.parse(readFileSync(o["--plan"], "utf8")));
  if (
    !plan.firstAdmin &&
    !plan.memberships.some((m) => m.role === "program_admin")
  )
    throw new Error();
  process.env.RELEASE_OPERATION = "program-provisioning";
  process.env.RELEASE_DATABASE_NAME = o["--confirm-database"];
  const db = new PrismaClient();
  try {
    await assertDatabaseOperation(db, "program-provisioning");
    const result = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(74219932)::text`;
        const [org, program, slug, staff, email] = await Promise.all([
          tx.organization.findUnique({ where: { id: plan.organization.id } }),
          tx.program.findUnique({ where: { id: plan.program.id } }),
          tx.program.findUnique({ where: { slug: plan.program.slug } }),
          tx.adminUser.findMany({
            where: { id: { in: plan.memberships.map((m) => m.adminId) } },
            select: { id: true, isActive: true },
          }),
          plan.firstAdmin
            ? tx.adminUser.findUnique({
                where: { email: plan.firstAdmin.email },
                select: { id: true },
              })
            : null,
        ]);
        if (
          program ||
          slug ||
          email ||
          (org && org.name !== plan.organization.name) ||
          plan.memberships.some(
            (m) => !staff.some((a) => a.id === m.adminId && a.isActive),
          ) ||
          new Set(plan.memberships.map((m) => m.adminId)).size !==
            plan.memberships.length
        )
          throw new Error();
        const hash = createHash("sha256")
            .update(JSON.stringify({ plan, org, staff }))
            .digest("hex"),
          summary = {
            hash,
            organizationAlreadyExists: !!org,
            newPrograms: 1,
            existingStaffGrants: plan.memberships.length,
            newStaff: plan.firstAdmin ? 1 : 0,
          };
        if (!o["--apply"]) return summary;
        if (o["--expected-hash"] !== hash) throw new Error();
        if (!org) await tx.organization.create({ data: plan.organization });
        await tx.program.create({
          data: { ...plan.program, organizationId: plan.organization.id },
        });
        for (const m of plan.memberships)
          await tx.staffMembership.create({
            data: { ...m, programId: plan.program.id },
          });
        if (plan.firstAdmin) {
          const password = z
            .string()
            .min(16)
            .max(200)
            .parse(process.env.STAFF_PROVISION_PASSWORD);
          await tx.adminUser.create({
            data: {
              ...plan.firstAdmin,
              passwordHash: await bcrypt.hash(password, 12),
              role: "admin",
              mustChangePassword: true,
              memberships: {
                create: { programId: plan.program.id, role: "program_admin" },
              },
            },
          });
        }
        await tx.auditLog.create({
          data: {
            programId: plan.program.id,
            action: "VERIFIED_PROGRAM_PROVISIONED",
            entity: "Program",
            entityId: plan.program.id,
            details: JSON.stringify({
              verificationReference: plan.verificationReference,
              reviewedHash: hash,
              existingStaffGrants: plan.memberships.length,
              newStaff: plan.firstAdmin ? 1 : 0,
            }),
          },
        });
        return { ...summary, applied: true };
      },
      { isolationLevel: "Serializable", timeout: 20000 },
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Program provisioning refused or failed. Verify target, reviewed private plan/hash, unique identities and private first-admin password. No existing account or membership was overwritten.",
  );
  process.exitCode = 1;
});
