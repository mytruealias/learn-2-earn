import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function computeStreak(lastActiveAt: Date | null, currentStreak: number): number {
  if (!lastActiveAt) return 1;

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastUtc = new Date(Date.UTC(lastActiveAt.getUTCFullYear(), lastActiveAt.getUTCMonth(), lastActiveAt.getUTCDate()));
  const diffDays = Math.round((todayUtc.getTime() - lastUtc.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  return 1;
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

      return NextResponse.json({ ok: true, progress: existing, alreadyCompleted: true, moduleComplete });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { progress: true } } },
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
      xpAwarded += 5;
    }

    const progress = await prisma.progress.create({
      data: { userId, lessonId, xpEarned: xpAwarded, crownLevel: perfectRun ? 2 : 1 },
    });

    const newStreak = computeStreak(user?.lastActiveAt ?? null, user?.streak ?? 0);

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xpAwarded },
        lastActiveAt: new Date(),
        streak: newStreak,
      },
    });

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
    });
  } catch (error) {
    console.error("Progress completion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
