import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";

const Schema = z.object({
  userId: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    // Identity comes from the signed session cookie. A body userId is only
    // accepted as a sanity check and must match the cookie. Brand-new
    // visitors with no session get an empty list (no data leak possible).
    const sessionUserId = getUserIdFromRequest(req);
    if (!sessionUserId) {
      return apiOk({ completedLessonIds: [], recentProgress: [] });
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
