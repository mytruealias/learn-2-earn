import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { activeLessonWhere } from "@/lib/learning-data";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
const Schema = z.object({ lessonId: z.string().min(1).max(120) }).strict();
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return apiError("unauthorized", "Sign in to keep your place.", 401);
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: parsed.data.lessonId,
        ...activeLessonWhere,
        cards: { some: {} },
      },
      select: { id: true },
    });
    if (!lesson)
      return apiError(
        "not_found",
        "This lesson is not currently available. Choose another lesson.",
        404,
      );
    await prisma.lessonVisit.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: { userId, lessonId: lesson.id },
      update: { openedAt: new Date() },
    });
    return apiOk({}, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return apiServerError(
      "progress/open",
      new Error("Your place could not be saved."),
    );
  }
}
