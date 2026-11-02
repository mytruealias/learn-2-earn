import { z } from "zod";
import prisma from "@/lib/prisma";
import { reviewSuggested } from "@/lib/learning-progression";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";

const Schema = z.object({
  userId: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    // Identity comes from the signed session cookie. A body userId is only
    // accepted as a sanity check and must match the cookie. Missing/expired
    // sessions return 401 so a failed read cannot look like zero progress.
    const sessionUserId = await getUserIdFromRequest(req);
    if (!sessionUserId) {
      return apiError(
        "unauthorized",
        "Your session ended. Sign in to load saved progress.",
        401,
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const bodyUserId = parsed.data.userId;

    if (bodyUserId && sessionUserId !== bodyUserId) {
      return apiError("forbidden", "Cannot read another user's progress.", 403);
    }

    const userId = sessionUserId;

    const progress = await prisma.progress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true, missedCardIds: true },
      orderBy: { completedAt: "desc" },
    });

    const reviews = await prisma.lessonReview.findMany({
      where: { userId },
      select: { lessonId: true, missedCardIds: true },
    });
    const current = new Map(reviews.map((r) => [r.lessonId, r]));
    const visits = await prisma.lessonVisit.findMany({
      where: { userId },
      select: { lessonId: true, openedAt: true },
      orderBy: { openedAt: "desc" },
    });
    return apiOk({
      visits,
      reviewLessonIds: progress
        .filter((p) => reviewSuggested(current.get(p.lessonId) || p))
        .map((p) => p.lessonId),
      completedLessonIds: progress.map((p) => p.lessonId),
      recentProgress: progress.map((p) => ({
        lessonId: p.lessonId,
        completedAt: p.completedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiServerError("progress/list", error);
  }
}
