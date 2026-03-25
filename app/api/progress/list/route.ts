import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ ok: true, completedLessonIds: [], recentProgress: [] });
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      completedLessonIds: progress.map((p) => p.lessonId),
      recentProgress: progress.map((p) => ({ lessonId: p.lessonId, completedAt: p.completedAt.toISOString() })),
    });
  } catch (error) {
    console.error("Progress list error:", error);
    return NextResponse.json({ ok: true, completedLessonIds: [], recentProgress: [] });
  }
}
