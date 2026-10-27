import prisma from "../prisma";
import { activeLessonWhere } from "../learning-data";
import { learningZone, nextReview, readIds } from "./rules";
export async function practiceData(userId: string) {
  const [user, lessons, progress, reviews, attempts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { learningTimezone: true, streak: true, earnedBadges: true },
    }),
    prisma.lesson.findMany({
      where: { ...activeLessonWhere, cards: { some: {} } },
      orderBy: [
        { module: { path: { order: "asc" } } },
        { module: { order: "asc" } },
        { order: "asc" },
      ],
      select: {
        id: true,
        title: true,
        estimatedMinutes: true,
        module: {
          select: { id: true, title: true, path: { select: { title: true } } },
        },
        cards: { select: { id: true, type: true, prompt: true } },
      },
    }),
    prisma.progress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true, missedCardIds: true },
    }),
    prisma.lessonReview.findMany({ where: { userId } }),
    prisma.lessonAttempt.count({
      where: { userId, mode: "practice", completedAt: { not: null } },
    }),
  ]);
  const now = new Date();
  const items = lessons.flatMap((l) => {
    const saved = progress.find((p) => p.lessonId === l.id),
      review = reviews.find((r) => r.lessonId === l.id);
    if (!saved && !review) return [];
    const questionIds = new Set(
      l.cards
        .filter((c) =>
          ["MULTIPLE_CHOICE", "SCENARIO", "TRUE_FALSE"].includes(c.type),
        )
        .map((c) => c.id),
    );
    const missed = readIds(
      review?.missedCardIds || saved?.missedCardIds || "[]",
    ).filter((id) => questionIds.has(id));
    const legacy = !review && !!saved && questionIds.size > 0;
    const dueAt =
      review?.dueAt ||
      (legacy ? nextReview(saved!.completedAt, missed.length, 0).dueAt : null);
    return [
      {
        id: l.id,
        title: l.title,
        minutes: l.estimatedMinutes,
        topicId: l.module.id,
        topic: l.module.title,
        path: l.module.path.title,
        dueAt: dueAt?.toISOString() || null,
        due: !!dueAt && dueAt <= now,
        missed: l.cards
          .filter((c) => missed.includes(c.id))
          .map((c) => c.prompt),
        successes: review?.successes ?? null,
        reason: review
          ? nextReview(
              review.lastReviewedAt,
              missed.length,
              Math.max(0, review.successes - 1),
            ).reason
          : legacy
            ? "Earlier completion. Answer history is limited; this initial review uses the completion date."
            : "A teaching lesson you can revisit whenever it helps.",
        historical: legacy,
      },
    ];
  });
  items.sort(
    (a, b) =>
      Number(b.due) - Number(a.due) ||
      Number(b.missed.length > 0) - Number(a.missed.length > 0) ||
      (a.dueAt || "9999").localeCompare(b.dueAt || "9999") ||
      a.title.localeCompare(b.title),
  );
  return {
    items,
    practiceCount: attempts,
    firstCompletions: progress.length,
    zone: learningZone(user.learningTimezone, process.env.PROGRAM_TIMEZONE),
    timezoneStored: !!user.learningTimezone,
    streak: user.streak,
    badges: readIds(user.earnedBadges),
  };
}
