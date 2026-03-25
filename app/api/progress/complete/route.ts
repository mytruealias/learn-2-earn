import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, lessonId } = body as {
      userId: string;
      lessonId: string;
    };

    if (!userId || !lessonId) {
      return NextResponse.json({ error: "Missing userId or lessonId" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const existing = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      return NextResponse.json({ ok: true, progress: existing, alreadyCompleted: true });
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

    const progress = await prisma.progress.create({
      data: { userId, lessonId, xpEarned: lesson.xpReward },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: lesson.xpReward },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, progress, xpAwarded: lesson.xpReward });
  } catch (error) {
    console.error("Progress completion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
