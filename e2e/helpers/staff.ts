import { PrismaClient } from "@prisma/client";
import type { APIRequestContext, Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
import {
  authenticator,
  encryptMfa,
  decryptMfa,
} from "../../lib/staff-security";
import { membershipRole } from "../../lib/program-scope";
const db = new PrismaClient({
  datasources: { db: { url: getTestDatabaseUrl() } },
});
export async function syntheticProgram() {
  await assertTestDatabase(db);
  await db.organization.upsert({
    where: { id: "test-organization" },
    create: { id: "test-organization", name: "Synthetic partner" },
    update: {},
  });
  return db.program.upsert({
    where: { id: "test-program" },
    create: {
      id: "test-program",
      organizationId: "test-organization",
      slug: "test-program",
      name: "Synthetic learning program",
      defaultConfigSlug: "default",
    },
    update: {},
  });
}
export async function provisionStaff(
  email: string,
  password: string,
  role = "admin",
) {
  await assertTestDatabase(db);
  await syntheticProgram();
  const passwordHash = await bcrypt.hash(password, 4);
  const a = await db.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, fullName: `Synthetic ${role} staff`, role },
    update: {
      passwordHash,
      isActive: true,
      loginFailures: 0,
      lockedUntil: null,
      mustChangePassword: false,
    },
  });
  await db.adminUser.update({
    where: { id: a.id },
    data: {
      mfaSecretEncrypted: encryptMfa(authenticator().secret.base32, a.id),
      mfaConfirmedAt: new Date(),
      mfaLastStep: null,
    },
  });
  await db.staffMembership.upsert({
    where: { adminId_programId: { adminId: a.id, programId: "test-program" } },
    create: {
      adminId: a.id,
      programId: "test-program",
      role: membershipRole(role)!,
    },
    update: { role: membershipRole(role)!, isActive: true, revokedAt: null },
  });
  return a;
}
export async function staffCode(email: string) {
  await assertTestDatabase(db);
  const a = await db.adminUser.findUniqueOrThrow({ where: { email } });
  return authenticator(decryptMfa(a.mfaSecretEncrypted!, a.id)).generate();
}
export async function verifyStaffRequest(
  context: APIRequestContext,
  email: string,
) {
  const r = await context.post("/api/admin/mfa", {
    data: { action: "verify", code: await staffCode(email) },
  });
  if (!r.ok()) throw new Error("Synthetic staff MFA verification failed.");
}
export async function staffUiLogin(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Authenticator code", { exact: true })
    .fill(await staffCode(email));
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await page.waitForURL(/\/admin$/);
}
export async function enrollSyntheticUser(userId: string) {
  await assertTestDatabase(db);
  await syntheticProgram();
  await db.participantEnrollment.upsert({
    where: { userId },
    create: { userId, programId: "test-program" },
    update: {},
  });
}
export async function staffScreenFixture() {
  await assertTestDatabase(db);
  await syntheticProgram();
  const user = await db.user.create({
    data: {
      email: `staff-learner-${Date.now()}@example.test`,
      fullName: "Synthetic participant",
      consentGiven: true,
      enrollment: { create: { programId: "test-program" } },
    },
  });
  const c = await db.case.create({
    data: {
      programId: "test-program",
      userId: user.id,
      title: "Synthetic support follow-up",
      message: "Synthetic browser fixture only.",
      followUpAt: new Date(Date.now() - 60000),
    },
  });
  await db.serviceDirectory.create({
    data: {
      programId: "test-program",
      name: "Synthetic service contact",
      category: "Food",
      hours: "Verify hours with service",
    },
  });
  return { user, c };
}
export async function disconnectStaff() {
  await db.$disconnect();
}
export async function unconfirmedStaff(email: string, password: string) {
  await assertTestDatabase(db);
  const a = await provisionStaff(email, password);
  await db.adminUser.update({
    where: { id: a.id },
    data: { mfaConfirmedAt: null, mfaSecretEncrypted: null, mfaLastStep: null },
  });
  return a;
}
export async function manyStaffParticipants() {
  await assertTestDatabase(db);
  await syntheticProgram();
  for (let i = 0; i < 25; i++)
    await db.user.create({
      data: {
        fullName: `Paged browser sample ${String(i).padStart(2, "0")}`,
        enrollment: { create: { programId: "test-program" } },
      },
    });
}
export async function syntheticProgramInvitation() {
  await assertTestDatabase(db);
  await syntheticProgram();
  const { randomBytes } = await import("node:crypto"),
    { invitationHash } = await import("../../lib/program-enrollment");
  const code = randomBytes(24).toString("hex");
  await db.programInvitation.create({
    data: {
      programId: "test-program",
      tokenHash: invitationHash(code),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return code;
}
export async function configureSyntheticSupport() {
  await assertTestDatabase(db);
  await syntheticProgram();
  await db.program.update({
    where: { id: "test-program" },
    data: {
      supportEnabled: true,
      supportTeamName: "Synthetic program support team",
      supportMonitoring:
        "Weekdays 09:00–17:00 UTC; no automatic notifications or guaranteed response",
      supportRegion: "US",
      supportReviewReference: "synthetic-browser-review",
    },
  });
}
export async function supportRequestCount(userId: string) {
  await assertTestDatabase(db);
  return db.case.count({ where: { userId, intakeKey: { not: null } } });
}
