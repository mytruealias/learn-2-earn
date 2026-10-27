import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
/**
 * E2E test helpers. These talk to the dedicated test database
 * (DATABASE_URL_TEST), the same one the Playwright webServer is pointed at.
 * Never touches the dev DB.
 *
 * Per-test cleanup removes every row this suite creates; the Playwright
 * global teardown removes the admin fixture.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const testDbUrl = getTestDatabaseUrl();

const prisma = new PrismaClient({
  datasources: { db: { url: testDbUrl } },
});

export async function findAnyLessonId(): Promise<string> {
  await assertTestDatabase(prisma);
  const lesson = await prisma.lesson.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  if (!lesson) {
    throw new Error(
      "No lessons in test DB. The Playwright global setup should have seeded them.",
    );
  }
  return lesson.id;
}

export async function ensureTestAdmin(
  email: string,
  password: string,
): Promise<void> {
  await assertTestDatabase(prisma);
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
  await assertTestDatabase(prisma);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.rewardEntry.deleteMany({ where: { userId: user.id } });
  await prisma.rewardAccount.deleteMany({ where: { userId: user.id } });
  await prisma.payoutRequest.deleteMany({ where: { userId: user.id } });
  await prisma.progress.deleteMany({ where: { userId: user.id } });
  await prisma.consentRecord.deleteMany({ where: { userId: user.id } });
  await prisma.case.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

export async function setUserXp(email: string, totalXp: number): Promise<void> {
  await assertTestDatabase(prisma);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { email },
      include: { rewardAccount: true },
    });
    const delta = totalXp - user.totalXp;
    await tx.user.update({ where: { id: user.id }, data: { totalXp } });
    if (user.rewardAccount && delta) {
      await tx.rewardAccount.update({
        where: { userId: user.id },
        data: {
          learningXp: { increment: delta },
          creditedXp: { increment: delta },
          availableXp: { increment: delta },
        },
      });
      await tx.rewardEntry.create({
        data: {
          userId: user.id,
          sourceKey: `fixture:${crypto.randomUUID()}`,
          kind: "synthetic-fixture-credit",
          availableDelta: delta,
          creditedDelta: delta,
          metadata: '{"scope":"disposable-test-only"}',
        },
      });
    }
  });
}

export function uniqEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e.test`;
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

// Every helper repeats the server-side isolation proof before writing fixtures.
export async function journeyLesson() {
  await assertTestDatabase(prisma);
  const path = await prisma.path.create({
    data: {
      slug: `journey-fixture-${Date.now()}`,
      title: "Synthetic learning path",
      order: -10000,
      modules: {
        create: {
          slug: "welcome",
          title: "A small step",
          lessons: {
            create: {
              slug: "first-step",
              title: "A safe first step (synthetic)",
              xpReward: 7,
              cards: {
                create: {
                  type: "INFO",
                  prompt: "A small step counts",
                  body: "This is a synthetic browser-test lesson.",
                  order: 0,
                },
              },
            },
          },
        },
      },
    },
    include: { modules: { include: { lessons: true } } },
  });
  return { pathSlug: path.slug, lessonId: path.modules[0].lessons[0].id };
}
export async function learnerRecord(email: string) {
  await assertTestDatabase(prisma);
  return prisma.user.findUnique({
    where: { email },
    include: { progress: true },
  });
}
export async function expireLearnerSessions(userId: string) {
  await assertTestDatabase(prisma);
  await prisma.learnerSession.updateMany({
    where: { userId },
    data: { expiresAt: new Date(0) },
  });
}
export async function accountCount(email: string) {
  await assertTestDatabase(prisma);
  return prisma.user.count({ where: { email } });
}
export async function guestRecord(id: string) {
  await assertTestDatabase(prisma);
  return prisma.user.findUnique({ where: { id }, include: { progress: true } });
}
