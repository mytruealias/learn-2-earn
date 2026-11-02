import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
const prisma = new PrismaClient({
  datasources: { db: { url: getTestDatabaseUrl() } },
});
export async function programFixture() {
  await assertTestDatabase(prisma);
  await prisma.path.updateMany({ data: { isActive: false } });
  const path = await prisma.path.upsert({
    where: { slug: "synthetic-practical-confidence" },
    update: { isActive: true },
    create: {
      slug: "synthetic-practical-confidence",
      title:
        "Synthetic: everyday confidence and practical steps for a steadier week, one useful lesson at a time",
      description:
        "A synthetic pathway for testing a welcoming learning experience.",
      order: -1000,
      modules: {
        create: [
          {
            slug: "begin",
            title: "Getting started with useful small steps",
            description: "Choose the skill that helps you today.",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "a",
                  title: "A small first step",
                  order: 0,
                  xpReward: 7,
                  estimatedMinutes: 3,
                  cards: {
                    create: {
                      type: "INFO",
                      prompt: "Synthetic first lesson",
                      body: "This content exists only in the disposable test program.",
                    },
                  },
                },
                {
                  slug: "b",
                  title: "Make a useful plan for today",
                  order: 1,
                  xpReward: 4,
                  estimatedMinutes: 5,
                  cards: {
                    create: {
                      type: "INFO",
                      prompt: "Synthetic planning lesson",
                      body: "A plan can be one small step.",
                    },
                  },
                },
                {
                  slug: "preparing",
                  title: "A lesson being prepared",
                  order: 2,
                  estimatedMinutes: 1,
                },
              ],
            },
          },
          {
            slug: "continue",
            title: "Keep building, at your own pace",
            order: 1,
            lessons: {
              create: [
                {
                  slug: "c",
                  title: "Finding useful support",
                  order: 0,
                  xpReward: 6,
                  estimatedMinutes: 8,
                  cards: {
                    create: {
                      type: "INFO",
                      prompt: "Synthetic support lesson",
                      body: "Help is available.",
                    },
                  },
                },
                {
                  slug: "d",
                  title: "Choose a next useful step",
                  order: 1,
                  xpReward: 3,
                  estimatedMinutes: 4,
                  cards: {
                    create: {
                      type: "INFO",
                      prompt: "Synthetic next step",
                      body: "Choose what is useful.",
                    },
                  },
                },
                {
                  slug: "inactive",
                  title: "Hidden inactive lesson",
                  order: 2,
                  isActive: false,
                  cards: { create: { type: "INFO", prompt: "Not published" } },
                },
              ],
            },
          },
          {
            slug: "inactive-unit",
            title: "Hidden inactive unit",
            order: 2,
            isActive: false,
            lessons: {
              create: {
                slug: "hidden",
                title: "Hidden unit lesson",
                cards: { create: { type: "INFO", prompt: "Not published" } },
              },
            },
          },
        ],
      },
    },
    include: {
      modules: {
        include: { lessons: { include: { cards: true } } },
        orderBy: { order: "asc" },
      },
    },
  });
  const empty = await prisma.path.upsert({
    where: { slug: "synthetic-empty-path" },
    update: { isActive: true },
    create: {
      slug: "synthetic-empty-path",
      title: "Synthetic: a pathway on its way",
      order: -999,
      modules: { create: { slug: "soon", title: "Lessons on their way" } },
    },
  });
  const lessons = path.modules.flatMap((m) => m.lessons);
  return {
    path,
    empty,
    a: lessons.find((l) => l.slug === "a")!,
    b: lessons.find((l) => l.slug === "b")!,
    c: lessons.find((l) => l.slug === "c")!,
    d: lessons.find((l) => l.slug === "d")!,
    preparing: lessons.find((l) => l.slug === "preparing")!,
    inactive: lessons.find((l) => l.slug === "inactive")!,
    hidden: lessons.find((l) => l.slug === "hidden")!,
  };
}
let n = 0;
export async function learnerFixture() {
  await assertTestDatabase(prisma);
  return prisma.user.create({
    data: {
      email: `progression-${Date.now()}-${n++}@example.test`,
      fullName: "Synthetic progression learner",
      passwordHash: await bcrypt.hash("synthetic-progression-password", 4),
    },
  });
}
export async function savedSnapshot(userId: string) {
  await assertTestDatabase(prisma);
  return {
    user: await prisma.user.findUnique({ where: { id: userId } }),
    progress: await prisma.progress.findMany({
      where: { userId },
      orderBy: { lessonId: "asc" },
    }),
    payouts: await prisma.payoutRequest.findMany({ where: { userId } }),
  };
}
export async function markEarlierReview(
  userId: string,
  lessonId: string,
  cardId: string,
) {
  await assertTestDatabase(prisma);
  await prisma.progress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: {
      completedAt: new Date(Date.now() - 9 * 86400000),
      missedCardIds: JSON.stringify([cardId]),
    },
  });
}
export async function programVisible(visible: boolean, ids: string[]) {
  await assertTestDatabase(prisma);
  await prisma.path.updateMany({
    where: { id: { in: ids } },
    data: { isActive: visible },
  });
}
export async function disconnectLearning() {
  await prisma.$disconnect();
}
