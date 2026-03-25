import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ ok: true, completedLessonIds: [] });
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      select: { lessonId: true },
    });

    return NextResponse.json({
      ok: true,
      completedLessonIds: progress.map((p) => p.lessonId),
    });
  } catch (error) {
    console.error("Progress list error:", error);
    return NextResponse.json({ ok: true, completedLessonIds: [] });
  }
}
