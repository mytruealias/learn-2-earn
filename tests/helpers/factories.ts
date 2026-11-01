import { encryptMfa, authenticator } from "@/lib/staff-security";
import { membershipRole } from "@/lib/program-scope";
import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

getTestDatabaseUrl();
let counter = 0;
function uniq(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function clearDb() {
  await assertTestDatabase(prisma);
  await prisma.supportLease.deleteMany();
  await prisma.supportUsage.deleteMany();
  await prisma.staffActionReceipt.deleteMany();
  await prisma.rewardEntry.deleteMany();
  await prisma.rewardAccount.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.resourceAllocation.deleteMany();
  await prisma.case.deleteMany();
  await prisma.poolAdjustment.deleteMany();
  await prisma.participantEnrollment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.staffMembership.deleteMany();
  await prisma.staffRecoveryCode.deleteMany();
  await prisma.staffAuthThrottle.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.card.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.path.deleteMany();
  await prisma.payoutConfig.deleteMany();
  await prisma.poolBalance.deleteMany();
  await prisma.serviceDirectory.deleteMany();
  await prisma.programInvitation.deleteMany();
  await prisma.program.deleteMany();
  await prisma.organization.deleteMany();
}

export async function createUser(
  overrides: {
    email?: string;
    password?: string;
    fullName?: string;
    totalXp?: number;
    city?: string;
  } = {},
) {
  await assertTestDatabase(prisma);
  const email = overrides.email ?? `${uniq("user")}@example.com`;
  const password = overrides.password ?? "password123";
  const passwordHash = await bcrypt.hash(password, 4);
  await ensureTestProgram();
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: overrides.fullName ?? "Test User",
      totalXp: overrides.totalXp ?? 0,
      city: overrides.city ?? "Austin",
      enrollment: { create: { programId: "test-program" } },
    },
  });
  return { user, password };
}

export async function createAdmin(
  overrides: { email?: string; password?: string; role?: string } = {},
) {
  await assertTestDatabase(prisma);
  const email = overrides.email ?? `${uniq("admin")}@example.com`;
  const password = overrides.password ?? "adminpass";
  const passwordHash = await bcrypt.hash(password, 4);
  await ensureTestProgram();
  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      fullName: "Test Admin",
      role: overrides.role ?? "admin",
      mfaConfirmedAt: new Date(),
      memberships: {
        create: {
          programId: "test-program",
          role: membershipRole(overrides.role ?? "admin")!,
        },
      },
    },
  });
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      mfaSecretEncrypted: encryptMfa(authenticator().secret.base32, admin.id),
    },
  });
  return { admin, password };
}

export async function createLesson(overrides: { xpReward?: number } = {}) {
  await assertTestDatabase(prisma);
  const path = await prisma.path.create({
    data: { title: "Test Path", slug: uniq("path") },
  });
  const mod = await prisma.module.create({
    data: { pathId: path.id, title: "Test Module", slug: uniq("mod") },
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: "Test Lesson",
      slug: uniq("lesson"),
      xpReward: overrides.xpReward ?? 10,
      cards: {
        create: {
          type: "INFO",
          prompt: "Synthetic test lesson",
          body: "Test content only.",
        },
      },
    },
  });
  return { path, module: mod, lesson };
}

export async function ensureTestProgram() {
  await assertTestDatabase(prisma);
  await prisma.organization.upsert({
    where: { id: "test-organization" },
    create: { id: "test-organization", name: "Synthetic organization" },
    update: {},
  });
  return prisma.program.upsert({
    where: { id: "test-program" },
    create: {
      id: "test-program",
      slug: "test-program",
      name: "Synthetic program",
      organizationId: "test-organization",
      defaultConfigSlug: "default",
    },
    update: {},
  });
}
