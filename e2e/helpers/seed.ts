/**
 * E2E test helpers. These talk to the SAME database the running dev server
 * uses (since Playwright drives the live app). We seed/clean only data we
 * create ourselves and never wipe anything.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function findAnyLessonId(): Promise<string> {
  const lesson = await prisma.lesson.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  if (!lesson) {
    throw new Error("No lessons in dev DB. Run `npx tsx prisma/seed.ts` first.");
  }
  return lesson.id;
}

export async function ensureTestAdmin(
  email: string,
  password: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      role: "admin",
      loginFailures: 0,
      lockedUntil: null,
    },
    create: {
      email,
      passwordHash,
      fullName: "E2E Test Admin",
      role: "admin",
    },
  });
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.payoutRequest.deleteMany({ where: { userId: user.id } });
  await prisma.progress.deleteMany({ where: { userId: user.id } });
  await prisma.consentRecord.deleteMany({ where: { userId: user.id } });
  await prisma.case.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

export async function setUserXp(email: string, totalXp: number): Promise<void> {
  await prisma.user.update({ where: { email }, data: { totalXp } });
}

export function uniqEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e.test`;
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
