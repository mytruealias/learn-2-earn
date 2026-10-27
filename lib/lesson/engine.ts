import { creditLearningReward, RewardIssue } from "../rewards/accounting";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../prisma";
import { activeLessonWhere } from "../learning-data";
import { getUserIdFromRequest, sameOriginError } from "../user-session";
import { apiError, apiOk, parseJson } from "../api-helpers";
import { adaptCard, evaluate, type CardAnswer } from "./cards";
import {
  badgeDefinitions,
  calculateAward,
  learningZone,
  nextReview,
  readIds,
  streakChange,
} from "./rules";
import type { AttemptView, Completion } from "./contracts";
export class LessonIssue extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
type Tx = Prisma.TransactionClient;
export const opaqueId = z.string().min(1).max(120);
export async function lessonEndpoint<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
  work: (
    tx: Tx,
    userId: string,
    data: z.infer<S>,
  ) => Promise<Record<string, unknown>>,
) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Your session ended. Sign in to return to your saved lesson.",
        401,
      );
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;
    const result = await prisma.$transaction(
      async (tx) => {
        // All attempt writes and first-completion credits for one learner serialize.
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
        if ((await getUserIdFromRequest(req, tx)) !== id)
          throw new LessonIssue(
            "unauthorized",
            "Your session ended. Sign in to return to your saved lesson.",
            401,
          );
        return work(tx, id, parsed.data);
      },
      { maxWait: 15000, timeout: 20000 },
    );
    return apiOk(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RewardIssue)
      return apiError(error.code, error.message, error.status);
    if (error instanceof LessonIssue)
      return apiError(error.code, error.message, error.status, {
        headers: { "Cache-Control": "private, no-store" },
      });
    // Never log payloads, card keys, learner identifiers or Prisma connection details.
    console.error("[lesson] Save failed; transaction rolled back.");
    return apiError(
      "service_unavailable",
      "Your save could not be confirmed. Try again; saved answers and rewards will not be duplicated.",
      503,
    );
  }
}
async function content(tx: Tx, lessonId: string) {
  const lesson = await tx.lesson.findFirst({
    where: { id: lessonId, ...activeLessonWhere },
    include: {
      cards: { orderBy: [{ order: "asc" }, { id: "asc" }] },
      module: { include: { path: true } },
    },
  });
  if (!lesson)
    throw new LessonIssue(
      "not_found",
      "This lesson is not available. Choose another lesson.",
      404,
    );
  if (!lesson.cards.length)
    throw new LessonIssue(
      "content_issue",
      "This lesson is being prepared. Choose another lesson; your saved progress has not changed.",
    );
  const cards = lesson.cards.map((card) => {
    const r = adaptCard(card);
    if (!r.ok) throw new LessonIssue("content_issue", r.message);
    return r.card;
  });
  const hash = createHash("sha256")
    .update(JSON.stringify({ xp: lesson.xpReward, cards }))
    .digest("hex");
  return { lesson, cards, hash };
}
async function load(tx: Tx, userId: string, id: string) {
  const attempt = await tx.lessonAttempt.findFirst({
    where: { id, userId },
    include: { answers: { orderBy: { ordinal: "asc" } } },
  });
  if (!attempt)
    throw new LessonIssue(
      "not_found",
      "This saved attempt is not available for this account. Return to Learn.",
      404,
    );
  const data = await content(tx, attempt.lessonId);
  if (data.hash !== attempt.contentHash && !attempt.completedAt)
    throw new LessonIssue(
      "content_changed",
      "This lesson has changed since you started. Your answers are retained. Choose another lesson while staff checks this content.",
    );
  return { attempt, ...data };
}
type Loaded = Awaited<ReturnType<typeof load>>;
function view(data: Loaded): AttemptView {
  const { attempt, cards } = data;
  const card = cards[attempt.position];
  const answer = attempt.answers.find((a) => a.ordinal === attempt.position);
  return {
    id: attempt.id,
    userId: attempt.userId,
    mode: attempt.mode as "first" | "practice",
    position: attempt.position,
    saved: attempt.answers.length,
    total: cards.length,
    card: attempt.completedAt ? null : card?.public || null,
    feedback:
      answer && card
        ? {
            correct: answer.correct,
            explanation:
              card.explanation ||
              (card.public.kind === "reflection"
                ? "Reflection is optional. Your personal words stay on this screen and are cleared when you leave."
                : "This step is saved. Continue when you are ready."),
            suggestedAnswer:
              card.answerIndex !== null && "choices" in card.public
                ? card.public.choices[card.answerIndex]
                : null,
            choice: answer.choice,
          }
        : null,
    result: attempt.resultJson
      ? (JSON.parse(attempt.resultJson) as Completion)
      : null,
  };
}
export async function startAttempt(
  tx: Tx,
  userId: string,
  lessonId: string,
  practice: boolean,
) {
  const data = await content(tx, lessonId);
  const progress = await tx.progress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const mode = practice || progress ? "practice" : "first";
  let attempt = await tx.lessonAttempt.findFirst({
    where: { userId, lessonId, mode, completedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt && mode === "first")
    attempt = await tx.lessonAttempt.findFirst({
      where: { userId, lessonId, mode },
      orderBy: { createdAt: "desc" },
    });
  if (!attempt)
    attempt = await tx.lessonAttempt.create({
      data: { userId, lessonId, mode, contentHash: data.hash },
    });
  await tx.lessonVisit.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: { openedAt: new Date() },
  });
  return { attempt: view(await load(tx, userId, attempt.id)) };
}
export async function saveAnswer(
  tx: Tx,
  userId: string,
  id: string,
  cardId: string,
  input: CardAnswer,
) {
  const data = await load(tx, userId, id);
  if (data.attempt.completedAt) return { attempt: view(data) };
  const prior = data.attempt.answers.find((a) => a.cardId === cardId);
  if (prior) return { attempt: view(data) }; // The first submitted answer is immutable, even after a lost response.
  const card = data.cards[data.attempt.position];
  if (!card || card.public.id !== cardId)
    throw new LessonIssue(
      "conflict",
      "Your saved place has changed. Reload the lesson to continue.",
    );
  const evaluated = evaluate(card, input);
  if (!evaluated)
    throw new LessonIssue(
      "validation_error",
      "Choose one of the answers shown on this card.",
      400,
    );
  await tx.lessonAnswer.create({
    data: {
      attemptId: id,
      cardId,
      ordinal: data.attempt.position,
      ...evaluated,
    },
  });
  return { attempt: view(await load(tx, userId, id)) };
}
export async function advance(
  tx: Tx,
  userId: string,
  id: string,
  cardId: string,
) {
  const data = await load(tx, userId, id);
  const answer = data.attempt.answers.find((a) => a.cardId === cardId);
  if (!answer)
    throw new LessonIssue("conflict", "Save this step before continuing.");
  if (!data.attempt.completedAt && answer.ordinal === data.attempt.position)
    await tx.lessonAttempt.update({
      where: { id },
      data: { position: { increment: 1 } },
    });
  return { attempt: view(await load(tx, userId, id)) };
}
export async function completeAttempt(tx: Tx, userId: string, id: string) {
  const data = await load(tx, userId, id);
  const { attempt, lesson, cards } = data;
  if (attempt.resultJson)
    return {
      attempt: view(data),
      ...(JSON.parse(attempt.resultJson) as Completion),
    };
  if (
    attempt.position !== cards.length ||
    attempt.answers.length !== cards.length ||
    !cards.every((c, i) =>
      attempt.answers.some((a) => a.ordinal === i && a.cardId === c.public.id),
    )
  )
    throw new LessonIssue(
      "incomplete_attempt",
      "Finish and save each card before completing this lesson.",
    );
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    include: { progress: true },
  });
  const existing = user.progress.find((p) => p.lessonId === lesson.id);
  const practice = attempt.mode === "practice" || !!existing;
  if (
    !practice &&
    (!user.email || !user.passwordHash) &&
    user.progress.length >= 1
  )
    throw new LessonIssue(
      "signup_required",
      "Your lesson steps are saved. Create an account to save another first completion and earn XP.",
      403,
    );
  const now = new Date();
  const award = calculateAward(lesson.xpReward, attempt.answers);
  const missed = attempt.answers
    .filter((a) => a.correct === false)
    .map((a) => a.cardId);
  const questions = attempt.answers.filter((a) => a.correct !== null);
  if (!practice)
    await tx.progress.create({
      data: {
        userId,
        lessonId: lesson.id,
        completedAt: now,
        xpEarned: award.xpAwarded,
        crownLevel: award.perfect ? 2 : 1,
        score: questions.length
          ? Math.round(
              (100 * questions.filter((a) => a.correct).length) /
                questions.length,
            )
          : null,
        missedCardIds: JSON.stringify(missed),
      },
    });
  if (!practice) {
    const savedProgress = await tx.progress.findUniqueOrThrow({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    });
    await creditLearningReward(tx, user, award.xpAwarded, savedProgress.id);
  }
  const completed = new Set([
    ...user.progress.map((p) => p.lessonId),
    ...(!practice ? [lesson.id] : []),
  ]);
  const pathLessons = await tx.lesson.findMany({
    where: {
      ...activeLessonWhere,
      module: {
        isActive: true,
        pathId: lesson.module.pathId,
        path: { isActive: true },
      },
    },
    select: { id: true },
  });
  const pathComplete =
    pathLessons.length > 0 && pathLessons.every((l) => completed.has(l.id));
  const lastLearning =
    user.lastLearningAt ||
    (user.progress.length
      ? new Date(Math.max(...user.progress.map((p) => p.completedAt.getTime())))
      : null);
  const streak = streakChange(
    lastLearning,
    now,
    learningZone(user.learningTimezone, process.env.PROGRAM_TIMEZONE),
    user.streak,
    user.streakFreezes,
  );
  const earned = new Set(readIds(user.earnedBadges));
  // Infer historic badges without rewriting historical Progress or awarding old balances again.
  if (user.progress.length) earned.add("first_lesson");
  if (user.progress.some((p) => p.crownLevel >= 2))
    earned.add("perfect_lesson");
  if (user.streak >= 3) earned.add("streak_3");
  if (user.streak >= 7) earned.add("streak_7");
  if (
    pathLessons.length &&
    pathLessons.every((l) => user.progress.some((p) => p.lessonId === l.id))
  )
    earned.add("first_path");
  const before = new Set(earned);
  if (completed.size) earned.add("first_lesson");
  if (!practice && award.perfect) earned.add("perfect_lesson");
  if (practice) earned.add("first_practice");
  if (streak.streak >= 3) earned.add("streak_3");
  if (streak.streak >= 7) earned.add("streak_7");
  if (pathComplete) earned.add("first_path");
  await tx.user.update({
    where: { id: userId },
    data: {
      totalXp: { increment: practice ? 0 : award.xpAwarded },
      lastActiveAt: now,
      lastLearningAt: now,
      streak: streak.streak,
      streakFreezes: streak.freezes,
      ...(streak.freezeConsumed ? { lastFreezeUsedAt: now } : {}),
      earnedBadges: JSON.stringify([...earned]),
    },
  });
  if (questions.length) {
    const old = await tx.lessonReview.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    });
    const schedule = nextReview(now, missed.length, old?.successes || 0);
    const record = {
      successes: schedule.successes,
      dueAt: schedule.dueAt,
      missedCardIds: JSON.stringify(missed),
      lastReviewedAt: now,
    };
    await tx.lessonReview.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: { userId, lessonId: lesson.id, ...record },
      update: record,
    });
  }
  const available = await tx.lesson.findMany({
    where: {
      ...activeLessonWhere,
      cards: { some: {} },
      module: {
        isActive: true,
        pathId: lesson.module.pathId,
        path: { isActive: true },
      },
    },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }, { id: "asc" }],
    select: { id: true, title: true },
  });
  const result: Completion = {
    xpAwarded: practice ? 0 : award.xpAwarded,
    baseXp: practice ? 0 : award.baseXp,
    comboMultiplier: practice ? 1 : award.comboMultiplier,
    perfectRunBonus: practice ? 0 : award.perfectRunBonus,
    practice,
    alreadyCompleted: !!existing,
    newBadges: badgeDefinitions.filter(
      (b) => earned.has(b.id) && !before.has(b.id),
    ),
    streak: streak.streak,
    welcomeBack: streak.welcomeBack,
    next:
      available.find((l) => !completed.has(l.id) && l.id !== lesson.id) || null,
  };
  await tx.lessonAttempt.update({
    where: { id },
    data: { completedAt: now, resultJson: JSON.stringify(result) },
  });
  return { attempt: view(await load(tx, userId, id)), ...result };
}
