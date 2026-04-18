import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

let counter = 0;
function uniq(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function clearDb() {
  await prisma.auditLog.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.resourceAllocation.deleteMany();
  await prisma.case.deleteMany();
  await prisma.poolAdjustment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.card.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.path.deleteMany();
  await prisma.payoutConfig.deleteMany();
  await prisma.poolBalance.deleteMany();
}

export async function createUser(
  overrides: { email?: string; password?: string; fullName?: string; totalXp?: number; city?: string } = {}
) {
  const email = overrides.email ?? `${uniq("user")}@example.com`;
  const password = overrides.password ?? "password123";
  const passwordHash = await bcrypt.hash(password, 4);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: overrides.fullName ?? "Test User",
      totalXp: overrides.totalXp ?? 0,
      city: overrides.city ?? "Austin",
    },
  });
  return { user, password };
}

export async function createAdmin(
  overrides: { email?: string; password?: string; role?: string } = {}
) {
  const email = overrides.email ?? `${uniq("admin")}@example.com`;
  const password = overrides.password ?? "adminpass";
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      fullName: "Test Admin",
      role: overrides.role ?? "admin",
    },
  });
  return { admin, password };
}

export async function createLesson(
  overrides: { xpReward?: number } = {}
) {
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
    },
  });
  return { path, module: mod, lesson };
}
