import { PrismaClient } from "@prisma/client";
import type { APIRequestContext } from "@playwright/test";
import {
  assertTestDatabase,
  getTestDatabaseUrl,
} from "../../lib/test-database-safety";
const prisma = new PrismaClient({
  datasources: { db: { url: getTestDatabaseUrl() } },
});
export async function completeLesson(
  request: APIRequestContext,
  lessonId: string,
) {
  await assertTestDatabase(prisma);
  const start = await request.post("/api/lesson/attempt", {
    data: { lessonId },
  });
  if (!start.ok()) throw new Error(`Attempt failed: ${start.status()}`);
  let { attempt } = await start.json();
  while (attempt.card) {
    const c = attempt.card,
      raw = await prisma.card.findUniqueOrThrow({ where: { id: c.id } });
    const answer =
      "choices" in c
        ? {
            kind: "choice",
            choice: c.choices.indexOf(JSON.parse(raw.answerJson!)),
          }
        : c.kind === "reflection"
          ? { kind: "reflect", skipped: true }
          : { kind: "acknowledge" };
    const checked = await request.post("/api/lesson/answer", {
      data: { attemptId: attempt.id, cardId: c.id, answer },
    });
    if (!checked.ok()) throw new Error(`Answer failed: ${checked.status()}`);
    const next = await request.post("/api/lesson/next", {
      data: { attemptId: attempt.id, cardId: c.id },
    });
    if (!next.ok()) throw new Error(`Advance failed: ${next.status()}`);
    attempt = (await next.json()).attempt;
  }
  return request.post("/api/progress/complete", {
    data: { attemptId: attempt.id },
  });
}
export async function lessonFixture(moduleId: string) {
  await assertTestDatabase(prisma);
  return prisma.lesson.upsert({
    where: { moduleId_slug: { moduleId, slug: "synthetic-evidence-flow" } },
    update: {},
    create: {
      moduleId,
      slug: "synthetic-evidence-flow",
      title: "Synthetic: a useful step and a thoughtful decision",
      order: 20,
      xpReward: 10,
      estimatedMinutes: 4,
      cards: {
        create: [
          {
            order: 1,
            type: "INFO",
            prompt: "One useful step",
            body: "Choose one manageable step. You can take breaks and return to this lesson.",
          },
          {
            order: 2,
            type: "MULTIPLE_CHOICE",
            prompt: "Which step is manageable?",
            choicesJson: '["One small action","Everything at once"]',
            answerJson: '"One small action"',
            explain: "One small action gives you a clear place to begin.",
            hint: "Start with something small.",
          },
          {
            order: 3,
            type: "SCENARIO",
            prompt: "Your plan changes. What could help?",
            body: "An appointment moves to a different time.",
            choicesJson: '["Check the new time","Ignore the change"]',
            answerJson: '"Check the new time"',
            explain: "Checking the time helps you adjust your plan.",
          },
          {
            order: 4,
            type: "INFO",
            subtype: "REFLECTION",
            prompt: "Reflect: a next step",
            body: "Think of a step that feels useful. You can keep it to yourself.",
          },
          {
            order: 5,
            type: "TRUE_FALSE",
            prompt: "Taking a break erases your saved learning.",
            choicesJson: '["True","False"]',
            answerJson: '"False"',
            explain:
              "Your saved learning stays in your account when you take a break.",
          },
        ],
      },
    },
    include: { cards: { orderBy: { order: "asc" } } },
  });
}
export async function lessonEvidence(userId: string) {
  await assertTestDatabase(prisma);
  return {
    user: await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    progress: await prisma.progress.findMany({ where: { userId } }),
    attempts: await prisma.lessonAttempt.findMany({
      where: { userId },
      include: { answers: true },
    }),
    reviews: await prisma.lessonReview.findMany({ where: { userId } }),
    payouts: await prisma.payoutRequest.findMany({ where: { userId } }),
  };
}
export async function dueNow(userId: string) {
  await assertTestDatabase(prisma);
  await prisma.lessonReview.updateMany({
    where: { userId },
    data: { dueAt: new Date(Date.now() - 86400000) },
  });
}
export async function setHearts(userId: string) {
  await assertTestDatabase(prisma);
  await prisma.user.update({ where: { id: userId }, data: { hearts: 0 } });
}
export async function malformed(lessonId: string, enabled: boolean) {
  await assertTestDatabase(prisma);
  await prisma.card.updateMany({
    where: { lessonId, order: 2 },
    data: {
      choicesJson: enabled ? "{" : '["One small action","Everything at once"]',
    },
  });
}
export async function disconnectLesson() {
  await prisma.$disconnect();
}
