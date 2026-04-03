import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const BADGE_DEFS: BadgeDefinition[] = [
  { id: "first_lesson", label: "First Lesson", icon: "🎓", description: "Completed your first lesson" },
  { id: "streak_3", label: "3-Day Streak", icon: "🔥", description: "Kept a 3-day learning streak" },
  { id: "streak_7", label: "7-Day Streak", icon: "⚡", description: "Kept a 7-day learning streak" },
  { id: "first_path", label: "First Path Complete", icon: "🏆", description: "Completed all lessons in a learning path" },
  { id: "perfect_lesson", label: "Perfect Lesson", icon: "⭐", description: "Completed a lesson without losing any hearts" },
];

function computeEarnedBadgeIds(
  completedLessonIds: Set<string>,
  streak: number,
  hasPerfectLesson: boolean,
  pathsCompleted: boolean
): Set<string> {
  const earned = new Set<string>();
  if (completedLessonIds.size >= 1) earned.add("first_lesson");
  if (streak >= 3) earned.add("streak_3");
  if (streak >= 7) earned.add("streak_7");
  if (pathsCompleted) earned.add("first_path");
  if (hasPerfectLesson) earned.add("perfect_lesson");
  return earned;
}

function computeStreakWithFreeze(
  lastActiveAt: Date | null,
  currentStreak: number,
  streakFreezes: number
): { newStreak: number; freezeConsumed: boolean } {
  if (!lastActiveAt) return { newStreak: 1, freezeConsumed: false };

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastUtc = new Date(Date.UTC(lastActiveAt.getUTCFullYear(), lastActiveAt.getUTCMonth(), lastActiveAt.getUTCDate()));
  const diffDays = Math.round((todayUtc.getTime() - lastUtc.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { newStreak: currentStreak, freezeConsumed: false };
  if (diffDays === 1) return { newStreak: currentStreak + 1, freezeConsumed: false };

  if (diffDays === 2 && streakFreezes >= 1) {
    return { newStreak: currentStreak + 1, freezeConsumed: true };
  }

  return { newStreak: 1, freezeConsumed: false };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, lessonId, comboBonus, perfectRun } = body as {
      userId: string;
      lessonId: string;
      comboBonus?: number;
      perfectRun?: boolean;
    };

    if (!userId || !lessonId) {
      return NextResponse.json({ error: "Missing userId or lessonId" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            path: {
              include: {
                modules: {
                  where: { isActive: true },
                  include: {
                    lessons: {
                      where: { isActive: true },
                      select: { id: true },
                    },
                  },
                },
              },
            },
            lessons: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const existing = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      const allLessonIds = lesson.module.lessons.map((l) => l.id);
      const moduleCompletedProgress = await prisma.progress.findMany({
        where: { userId, lessonId: { in: allLessonIds } },
        select: { lessonId: true },
      });
      const completedModuleLessonIds = new Set(moduleCompletedProgress.map((p) => p.lessonId));
      const moduleComplete = allLessonIds.every((id) => completedModuleLessonIds.has(id));

      return NextResponse.json({ ok: true, progress: existing, alreadyCompleted: true, moduleComplete, newBadges: [] });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { progress: true } },
        progress: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    path: {
                      include: {
                        modules: {
                          where: { isActive: true },
                          include: {
                            lessons: {
                              where: { isActive: true },
                              select: { id: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const isGuest = !user?.email || !user?.passwordHash;
    const completedCount = user?._count?.progress ?? 0;

    if (isGuest && completedCount >= 1) {
      return NextResponse.json({
        error: "signup_required",
        message: "Create an account to continue earning XP. Your first lesson is saved.",
      }, { status: 403 });
    }

    let xpAwarded = lesson.xpReward;
    if (comboBonus && comboBonus >= 5) {
      xpAwarded = Math.round(xpAwarded * 1.5);
    } else if (comboBonus && comboBonus >= 3) {
      xpAwarded = Math.round(xpAwarded * 1.25);
    }
    if (perfectRun) {
      xpAwarded += 1;
    }

    const oldCompletedLessonIds = new Set((user?.progress ?? []).map((p) => p.lessonId));
    const oldHasPerfectLesson = (user?.progress ?? []).some((p) => p.crownLevel >= 2);

    let oldPathCompleted = false;
    const checkedPathsBefore = new Set<string>();
    for (const p of user?.progress ?? []) {
      const path = p.lesson?.module?.path;
      if (!path || checkedPathsBefore.has(path.id)) continue;
      checkedPathsBefore.add(path.id);
      const allPathLessonIds = path.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (allPathLessonIds.length > 0 && allPathLessonIds.every((id) => oldCompletedLessonIds.has(id))) {
        oldPathCompleted = true;
        break;
      }
    }

    const oldBadgeIds = computeEarnedBadgeIds(oldCompletedLessonIds, user?.streak ?? 0, oldHasPerfectLesson, oldPathCompleted);

    const progress = await prisma.progress.create({
      data: { userId, lessonId, xpEarned: xpAwarded, crownLevel: perfectRun ? 2 : 1 },
    });

    const { newStreak, freezeConsumed } = computeStreakWithFreeze(
      user?.lastActiveAt ?? null,
      user?.streak ?? 0,
      user?.streakFreezes ?? 0
    );

    const shouldRegenerateFreeze = newStreak > 0 && newStreak % 7 === 0;
    const newStreakFreezes = freezeConsumed
      ? (user?.streakFreezes ?? 1) - 1
      : shouldRegenerateFreeze
      ? Math.min((user?.streakFreezes ?? 1) + 1, 1)
      : user?.streakFreezes ?? 1;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xpAwarded },
        lastActiveAt: new Date(),
        streak: newStreak,
        streakFreezes: newStreakFreezes,
        ...(freezeConsumed ? { lastFreezeUsedAt: new Date() } : {}),
      },
    });

    const newCompletedLessonIds = new Set([...oldCompletedLessonIds, lessonId]);
    const newHasPerfectLesson = oldHasPerfectLesson || !!perfectRun;

    const allPathLessonIds = lesson.module.path.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const newPathCompleted = oldPathCompleted || (allPathLessonIds.length > 0 && allPathLessonIds.every((id) => newCompletedLessonIds.has(id)));

    const newBadgeIds = computeEarnedBadgeIds(newCompletedLessonIds, newStreak, newHasPerfectLesson, newPathCompleted);
    const newBadges = BADGE_DEFS.filter((b) => newBadgeIds.has(b.id) && !oldBadgeIds.has(b.id));

    const allLessonIds = lesson.module.lessons.map((l) => l.id);
    const moduleCompletedProgress = await prisma.progress.findMany({
      where: { userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true },
    });
    const completedModuleLessonIds = new Set(moduleCompletedProgress.map((p) => p.lessonId));
    const moduleComplete = allLessonIds.every((id) => completedModuleLessonIds.has(id));

    return NextResponse.json({
      ok: true,
      progress,
      xpAwarded,
      baseXp: lesson.xpReward,
      comboMultiplier: comboBonus && comboBonus >= 5 ? 1.5 : comboBonus && comboBonus >= 3 ? 1.25 : 1,
      perfectRunBonus: perfectRun ? 5 : 0,
      newStreak,
      moduleComplete,
      moduleName: lesson.module.title,
      newBadges,
      streakFreezes: updatedUser.streakFreezes,
      freezeConsumed,
    });
  } catch (error) {
    console.error("Progress completion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
