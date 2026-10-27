import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { createUserSession } from "@/lib/user-session";
import { POST as start } from "@/app/api/lesson/attempt/route";
import { POST as answer } from "@/app/api/lesson/answer/route";
import { POST as next } from "@/app/api/lesson/next/route";
import { POST as complete } from "@/app/api/progress/complete/route";
import { GET as practice } from "@/app/api/practice/route";
import {
  GET as plan,
  POST as savePlan,
} from "@/app/api/user/learning-plan/route";
import { clearDb, createLesson, createUser } from "../helpers/factories";
import { lessonReq as req, readyAttempt } from "../helpers/lesson";
import { makeRequest } from "../helpers/request";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { readFileSync } from "node:fs";
async function actor() {
  const { user } = await createUser();
  return { user, token: await createUserSession(user.id) };
}
async function questions(lessonId: string, count = 5) {
  await prisma.card.deleteMany({ where: { lessonId } });
  for (let i = 0; i < count; i++)
    await prisma.card.create({
      data: {
        lessonId,
        type: i === 0 ? "SCENARIO" : "MULTIPLE_CHOICE",
        order: i,
        prompt: `Synthetic question ${i + 1}`,
        body: "Synthetic context",
        choicesJson: '["Useful response","Other response"]',
        answerJson: '"Useful response"',
        explain: "The useful response is a practical next step.",
      },
    });
}
async function money(userId: string) {
  return {
    user: await prisma.user.findUnique({ where: { id: userId } }),
    progress: await prisma.progress.findMany({ where: { userId } }),
    payout: await prisma.payoutRequest.findMany({ where: { userId } }),
  };
}
describe("authenticated evidence-backed completion and practice", () => {
  beforeEach(clearDb);
  it("requires authentication and rejects all legacy reward claims", async () => {
    expect(
      (
        await complete(
          makeRequest("http://test/api/progress/complete", { body: {} }),
        )
      ).status,
    ).toBe(401);
    const a = await actor(),
      f = await createLesson();
    for (const payload of [
      { lessonId: f.lesson.id },
      { attemptId: "fake", userId: a.user.id },
      { attemptId: "fake", comboBonus: 5 },
      { attemptId: "fake", perfectRun: true },
      { attemptId: "fake", score: 100 },
      { attemptId: "fake", elapsed: 100 },
    ])
      expect(
        (await complete(req("progress/complete", a.token, payload))).status,
      ).toBe(400);
    expect(await prisma.progress.count()).toBe(0);
  });
  it("does not ship answer keys or explanations before an answer and cannot skip evidence", async () => {
    const a = await actor(),
      f = await createLesson();
    await questions(f.lesson.id);
    const data = await (
      await start(req("lesson/attempt", a.token, { lessonId: f.lesson.id }))
    ).json();
    expect(JSON.stringify(data)).not.toMatch(
      /answerJson|answerIndex|explanation|practical next step/,
    );
    expect(
      (
        await complete(
          req("progress/complete", a.token, { attemptId: data.attempt.id }),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await next(
          req("lesson/next", a.token, {
            attemptId: data.attempt.id,
            cardId: data.attempt.card.id,
          }),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await answer(
          req("lesson/answer", a.token, {
            attemptId: data.attempt.id,
            cardId: data.attempt.card.id,
            answer: { kind: "choice", choice: 15 },
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("preserves immutable first answers and resumes feedback/position across devices", async () => {
    const a = await actor(),
      f = await createLesson();
    await questions(f.lesson.id, 2);
    const { attempt } = await (
      await start(req("lesson/attempt", a.token, { lessonId: f.lesson.id }))
    ).json();
    const body = {
      attemptId: attempt.id,
      cardId: attempt.card.id,
      answer: { kind: "choice", choice: 1 },
    };
    await answer(req("lesson/answer", a.token, body));
    await answer(
      req("lesson/answer", a.token, {
        ...body,
        answer: { kind: "choice", choice: 0 },
      }),
    );
    const second = await createUserSession(a.user.id);
    const resumed = (
      await (
        await start(req("lesson/attempt", second, { lessonId: f.lesson.id }))
      ).json()
    ).attempt;
    expect(resumed.id).toBe(attempt.id);
    expect(resumed.feedback.correct).toBe(false);
    expect(resumed.feedback.suggestedAnswer).toBe("Useful response");
    await Promise.all([
      next(
        req("lesson/next", a.token, {
          attemptId: attempt.id,
          cardId: attempt.card.id,
        }),
      ),
      next(
        req("lesson/next", second, {
          attemptId: attempt.id,
          cardId: attempt.card.id,
        }),
      ),
    ]);
    expect(
      (
        await prisma.lessonAttempt.findUniqueOrThrow({
          where: { id: attempt.id },
        })
      ).position,
    ).toBe(1);
  });
  it("derives one award object and serializes replay/parallel completion", async () => {
    const a = await actor(),
      f = await createLesson({ xpReward: 10 });
    await questions(f.lesson.id);
    const id = await readyAttempt(a.token, f.lesson.id);
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        complete(req("progress/complete", a.token, { attemptId: id })),
      ),
    );
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    for (const r of results)
      expect(await r.json()).toMatchObject({
        xpAwarded: 16,
        baseXp: 10,
        comboMultiplier: 1.5,
        perfectRunBonus: 1,
        practice: false,
        streak: 1,
      });
    const after = await money(a.user.id);
    expect(after.user?.totalXp).toBe(16);
    expect(after.progress).toHaveLength(1);
    expect(after.progress[0].xpEarned).toBe(16);
    expect(JSON.parse(after.user!.earnedBadges)).toContain("first_lesson");
    expect(await prisma.lessonReview.count()).toBe(1);
  });
  it("completes different lessons concurrently without losing badges, balances or same-day streak", async () => {
    const a = await actor(),
      f = await createLesson(),
      g = await createLesson();
    const ids = [
      await readyAttempt(a.token, f.lesson.id),
      await readyAttempt(a.token, g.lesson.id),
    ];
    const responses = await Promise.all(
      ids.map((attemptId) =>
        complete(req("progress/complete", a.token, { attemptId })),
      ),
    );
    expect(responses.every((r) => r.ok)).toBe(true);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.totalXp).toBe(22);
    expect(u.streak).toBe(1);
    expect(await prisma.progress.count()).toBe(2);
  });
  it("rolls progress, credit, badges, streak and schedule back on a database failure", async () => {
    const a = await actor(),
      f = await createLesson();
    await questions(f.lesson.id, 1);
    const id = await readyAttempt(a.token, f.lesson.id);
    const before = await money(a.user.id);
    await assertTestDatabase(prisma);
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION test_reject_credit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER test_reject_credit BEFORE UPDATE OF "totalXp" ON "User" FOR EACH ROW EXECUTE FUNCTION test_reject_credit()`,
    );
    try {
      expect(
        (await complete(req("progress/complete", a.token, { attemptId: id })))
          .status,
      ).toBe(503);
      expect(await money(a.user.id)).toEqual(before);
      expect(await prisma.lessonReview.count()).toBe(0);
      expect(
        (await prisma.lessonAttempt.findUniqueOrThrow({ where: { id } }))
          .completedAt,
      ).toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER test_reject_credit ON "User"',
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION test_reject_credit()");
    }
    expect(
      (await complete(req("progress/complete", a.token, { attemptId: id }))).ok,
    ).toBe(true);
  });
  it("makes practice a separate record with no duplicated entitlement, even in parallel", async () => {
    const a = await actor(),
      f = await createLesson();
    await questions(f.lesson.id, 2);
    const first = await readyAttempt(a.token, f.lesson.id, true);
    await complete(req("progress/complete", a.token, { attemptId: first }));
    const before = await money(a.user.id),
      old = await prisma.lessonReview.findFirstOrThrow();
    expect(JSON.parse(old.missedCardIds)).toHaveLength(2);
    const id = await readyAttempt(a.token, f.lesson.id, false, true);
    const results = await Promise.all([
      complete(req("progress/complete", a.token, { attemptId: id })),
      complete(req("progress/complete", a.token, { attemptId: id })),
    ]);
    for (const r of results)
      expect(await r.json()).toMatchObject({
        practice: true,
        xpAwarded: 0,
        perfectRunBonus: 0,
      });
    const after = await money(a.user.id);
    expect(after.user?.totalXp).toBe(before.user?.totalXp);
    expect(after.progress).toEqual(before.progress);
    expect(after.payout).toEqual(before.payout);
    expect(
      await prisma.lessonAttempt.count({
        where: { completedAt: { not: null } },
      }),
    ).toBe(2);
    const review = await prisma.lessonReview.findFirstOrThrow();
    expect(review.successes).toBe(1);
    expect(JSON.parse(review.missedCardIds)).toEqual([]);
    expect(review.dueAt.getTime() - review.lastReviewedAt.getTime()).toBe(
      3 * 86400000,
    );
  });
  it("permits practice before first completion without minting XP or a Progress row", async () => {
    const a = await actor(),
      f = await createLesson();
    const id = await readyAttempt(a.token, f.lesson.id, false, true);
    await complete(req("progress/complete", a.token, { attemptId: id }));
    expect(await prisma.progress.count()).toBe(0);
    expect((await money(a.user.id)).user?.totalXp).toBe(0);
  });
  it("isolates attempts from switched, revoked and inactive accounts", async () => {
    const a = await actor(),
      b = await actor(),
      f = await createLesson();
    const id = await readyAttempt(a.token, f.lesson.id);
    expect(
      (await complete(req("progress/complete", b.token, { attemptId: id })))
        .status,
    ).toBe(404);
    await prisma.learnerSession.updateMany({
      where: { userId: a.user.id },
      data: { revokedAt: new Date() },
    });
    expect(
      (await complete(req("progress/complete", a.token, { attemptId: id })))
        .status,
    ).toBe(401);
    await prisma.user.update({
      where: { id: b.user.id },
      data: { isActive: false },
    });
    expect(
      (await start(req("lesson/attempt", b.token, { lessonId: f.lesson.id })))
        .status,
    ).toBe(401);
  });
  it("guards inactive parents and lessons, empty and malformed content at start and completion", async () => {
    const a = await actor();
    for (const kind of [
      "path",
      "module",
      "lesson",
      "empty",
      "malformed",
      "unknown",
    ]) {
      const f = await createLesson(),
        id = await readyAttempt(a.token, f.lesson.id);
      if (kind === "path")
        await prisma.path.update({
          where: { id: f.path.id },
          data: { isActive: false },
        });
      if (kind === "module")
        await prisma.module.update({
          where: { id: f.module.id },
          data: { isActive: false },
        });
      if (kind === "lesson")
        await prisma.lesson.update({
          where: { id: f.lesson.id },
          data: { isActive: false },
        });
      if (kind === "empty")
        await prisma.card.deleteMany({ where: { lessonId: f.lesson.id } });
      if (["malformed", "unknown"].includes(kind))
        await prisma.card.updateMany({
          where: { lessonId: f.lesson.id },
          data: {
            type: kind === "unknown" ? "UNSUPPORTED" : "MULTIPLE_CHOICE",
            choicesJson: "{",
          },
        });
      const expected = ["path", "module", "lesson"].includes(kind) ? 404 : 409;
      expect(
        (await start(req("lesson/attempt", a.token, { lessonId: f.lesson.id })))
          .status,
      ).toBe(expected);
      expect(
        (await complete(req("progress/complete", a.token, { attemptId: id })))
          .status,
      ).toBe(expected);
    }
    expect(await prisma.progress.count()).toBe(0);
  });
  it("retains evidence and stops when curriculum changes mid-attempt", async () => {
    const a = await actor(),
      f = await createLesson(),
      id = await readyAttempt(a.token, f.lesson.id);
    await prisma.card.updateMany({
      where: { lessonId: f.lesson.id },
      data: { prompt: "Updated instruction" },
    });
    const r = await complete(
      req("progress/complete", a.token, { attemptId: id }),
    );
    expect(r.status).toBe(409);
    expect((await r.json()).error.code).toBe("content_changed");
    expect(await prisma.lessonAnswer.count()).toBe(1);
  });
  it("never persists personal reflections and does not depend on correctness, disclosure or hearts", async () => {
    const a = await actor(),
      f = await createLesson();
    await prisma.user.update({ where: { id: a.user.id }, data: { hearts: 0 } });
    await prisma.card.updateMany({
      where: { lessonId: f.lesson.id },
      data: { subtype: "REFLECTION", prompt: "Optional reflection" },
    });
    const { attempt } = await (
      await start(req("lesson/attempt", a.token, { lessonId: f.lesson.id }))
    ).json();
    expect(
      (
        await answer(
          req("lesson/answer", a.token, {
            attemptId: attempt.id,
            cardId: attempt.card.id,
            answer: { kind: "reflect", skipped: false, text: "private" },
          }),
        )
      ).status,
    ).toBe(400);
    const id = await readyAttempt(a.token, f.lesson.id);
    expect(
      (await complete(req("progress/complete", a.token, { attemptId: id }))).ok,
    ).toBe(true);
    expect(
      (await prisma.progress.findFirstOrThrow()).reflectionAnswer,
    ).toBeNull();
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } }))
        .hearts,
    ).toBe(0);
  });
  it("preserves the guest first-completion limit without discarding saved learning", async () => {
    const a = await actor();
    await prisma.user.update({
      where: { id: a.user.id },
      data: { email: null, passwordHash: null },
    });
    const f = await createLesson(),
      g = await createLesson();
    await complete(
      req("progress/complete", a.token, {
        attemptId: await readyAttempt(a.token, f.lesson.id),
      }),
    );
    const id = await readyAttempt(a.token, g.lesson.id);
    expect(
      (await complete(req("progress/complete", a.token, { attemptId: id })))
        .status,
    ).toBe(403);
    expect(
      (await prisma.lessonAttempt.findUniqueOrThrow({ where: { id } }))
        .position,
    ).toBe(1);
    await prisma.user.update({
      where: { id: a.user.id },
      data: { email: "upgraded@example.test", passwordHash: "synthetic" },
    });
    expect(
      (await complete(req("progress/complete", a.token, { attemptId: id }))).ok,
    ).toBe(true);
  });
  it("explains review reasons, filters inactive topics and isolates each learner’s evidence", async () => {
    const a = await actor(),
      b = await actor(),
      f = await createLesson();
    await questions(f.lesson.id, 1);
    await complete(
      req("progress/complete", a.token, {
        attemptId: await readyAttempt(a.token, f.lesson.id, true),
      }),
    );
    await prisma.lessonReview.updateMany({
      data: { dueAt: new Date(Date.now() - 1000) },
    });
    const data = await (await practice(req("practice", a.token, {}))).json();
    expect(data.items[0]).toMatchObject({ due: true, successes: 0 });
    expect(data.items[0].missed).toHaveLength(1);
    expect(data.items[0].reason).toContain("missed");
    expect(
      (await (await practice(req("practice", b.token, {}))).json()).items,
    ).toEqual([]);
    await prisma.path.update({
      where: { id: f.path.id },
      data: { isActive: false },
    });
    expect(
      (await (await practice(req("practice", a.token, {}))).json()).items,
    ).toEqual([]);
  });
  it("counts distinct lessons per saved local day including practice, and saves validated timezone choices", async () => {
    const a = await actor(),
      f = await createLesson();
    await complete(
      req("progress/complete", a.token, {
        attemptId: await readyAttempt(a.token, f.lesson.id),
      }),
    );
    await complete(
      req("progress/complete", a.token, {
        attemptId: await readyAttempt(a.token, f.lesson.id, false, true),
      }),
    );
    expect(
      (
        await (
          await plan(
            req("user/learning-plan?zone=Pacific/Auckland", a.token, undefined),
          )
        ).json()
      ).completedToday,
    ).toBe(1);
    expect(
      (
        await savePlan(
          req("user/learning-plan", a.token, {
            type: "timezone",
            zone: "invalid",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await savePlan(
          req("user/learning-plan", a.token, {
            type: "timezone",
            zone: "America/Chicago",
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await (
          await plan(req("user/learning-plan?zone=UTC", a.token, undefined))
        ).json()
      ).zone,
    ).toBe("America/Chicago");
  });
  it("uses the saved timezone for actual midnight and daylight-saving completions", async () => {
    for (const [first, second] of [
      ["2026-10-27T04:59:00Z", "2026-10-27T05:01:00Z"],
      ["2026-03-08T06:30:00Z", "2026-03-09T05:30:00Z"],
      ["2026-11-01T05:30:00Z", "2026-11-02T06:30:00Z"],
    ]) {
      const a = await actor(),
        f = await createLesson(),
        g = await createLesson();
      await prisma.user.update({
        where: { id: a.user.id },
        data: { learningTimezone: "America/Chicago" },
      });
      vi.useFakeTimers({ toFake: ["Date"] });
      try {
        vi.setSystemTime(new Date(first));
        // Session was issued at real time; give this isolated fixture a matching clock-bound token.
        const token = await createUserSession(a.user.id);
        const firstId = await readyAttempt(token, f.lesson.id);
        expect(
          (
            await (
              await complete(
                req("progress/complete", token, { attemptId: firstId }),
              )
            ).json()
          ).streak,
        ).toBe(1);
        vi.setSystemTime(new Date(second));
        const secondId = await readyAttempt(token, g.lesson.id);
        expect(
          (
            await (
              await complete(
                req("progress/complete", token, { attemptId: secondId }),
              )
            ).json()
          ).streak,
        ).toBe(2);
        const data = await (
          await plan(req("user/learning-plan", token, undefined))
        ).json();
        expect(data.completedToday).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    }
  });
  it("keeps legacy balances/history and explains limited evidence without inventing mastery", async () => {
    const a = await actor(),
      f = await createLesson();
    await questions(f.lesson.id, 1);
    await prisma.progress.create({
      data: {
        userId: a.user.id,
        lessonId: f.lesson.id,
        xpEarned: 17,
        completedAt: new Date(Date.now() - 8 * 86400000),
      },
    });
    await prisma.user.update({
      where: { id: a.user.id },
      data: { totalXp: 17 },
    });
    const before = await money(a.user.id);
    const legacy = (await (await practice(req("practice", a.token, {}))).json())
      .items[0];
    expect(legacy).toMatchObject({
      historical: true,
      successes: null,
      due: true,
    });
    expect(legacy.reason).toContain("history is limited");
    await complete(
      req("progress/complete", a.token, {
        attemptId: await readyAttempt(a.token, f.lesson.id, false, true),
      }),
    );
    const after = await money(a.user.id);
    expect(after.progress).toEqual(before.progress);
    expect(after.user?.totalXp).toBe(17);
  });
  it("rejects cross-origin lesson writes", async () => {
    const a = await actor(),
      f = await createLesson();
    expect(
      (
        await start(
          makeRequest("http://test/api/lesson/attempt", {
            body: { lessonId: f.lesson.id },
            cookies: { l2e_user_session: a.token },
            headers: { origin: "https://untrusted.test" },
          }),
        )
      ).status,
    ).toBe(403);
  });
  it("applies additive migration SQL without rewriting historical balances, progress or payouts", async () => {
    await assertTestDatabase(prisma);
    const a = await actor(),
      f = await createLesson();
    await prisma.progress.create({
      data: { userId: a.user.id, lessonId: f.lesson.id, xpEarned: 17 },
    });
    await prisma.user.update({
      where: { id: a.user.id },
      data: { totalXp: 17 },
    });
    await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 10,
        dollarAmount: 0.5,
        status: "paid",
      },
    });
    const before = await money(a.user.id);
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          'DROP TABLE "LessonAnswer", "LessonReview", "LessonAttempt"',
        );
        await tx.$executeRawUnsafe(
          'ALTER TABLE "User" DROP COLUMN "learningTimezone", DROP COLUMN "lastLearningAt"',
        );
        const sql = readFileSync(
          "prisma/migrations/20261027020000_lesson_attempts_review/migration.sql",
          "utf8",
        );
        for (const statement of sql.split(";").filter((s) => s.trim()))
          await tx.$executeRawUnsafe(statement);
        expect(await tx.user.findUnique({ where: { id: a.user.id } })).toEqual(
          before.user,
        );
        expect(await tx.progress.findMany()).toEqual(before.progress);
        expect(await tx.payoutRequest.findMany()).toEqual(before.payout);
        throw new Error("ROLLBACK_TEST");
      });
    } catch (e) {
      if (!(e instanceof Error && e.message === "ROLLBACK_TEST")) throw e;
    }
    expect(await money(a.user.id)).toEqual(before);
  });
});
