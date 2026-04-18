import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";

const Schema = z.object({
  userId: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const sessionUserId = getUserIdFromRequest(req);

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const bodyUserId = parsed.data.userId;

    const userId = sessionUserId ?? bodyUserId;
    if (!userId) {
      // No session yet (brand-new visitor) — return empty list rather than 401
      return apiOk({ completedLessonIds: [], recentProgress: [] });
    }

    if (sessionUserId && bodyUserId && sessionUserId !== bodyUserId) {
      return apiError("forbidden", "Cannot read another user's progress.", 403);
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    });

    return apiOk({
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
