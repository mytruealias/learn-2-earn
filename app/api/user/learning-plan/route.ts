import { z } from "zod";
import prisma from "@/lib/prisma";
import { validTimeZone } from "@/lib/learning-progression";
import { learningZone, localDay } from "@/lib/lesson/rules";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
const Schema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("goal"),
      target: z.union([z.literal(1), z.literal(2), z.null()]),
    })
    .strict(),
  z
    .object({
      type: z.literal("timezone"),
      zone: z
        .string()
        .min(1)
        .max(100)
        .refine(
          validTimeZone,
          "Choose a valid IANA timezone, such as America/Chicago.",
        ),
    })
    .strict(),
  z
    .object({
      type: z.literal("path"),
      pathId: z.string().min(1).max(120),
      selected: z.boolean(),
    })
    .strict(),
]);
export async function GET(req: Request) {
  try {
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to load your learning plan.",
        401,
      );
    // Legacy query is validated for compatibility but never overrides stored day boundaries.
    const hint = new URL(req.url).searchParams.get("zone");
    if (hint && (hint.length > 100 || !validTimeZone(hint)))
      return apiError(
        "validation_error",
        "Choose a valid timezone in Practice settings.",
        400,
      );
    const [user, progress, attempts] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id },
        select: {
          dailyGoal: true,
          learningTimezone: true,
          lastLearningAt: true,
          streak: true,
        },
      }),
      prisma.progress.findMany({
        where: { userId: id },
        select: { lessonId: true, completedAt: true },
      }),
      prisma.lessonAttempt.findMany({
        where: { userId: id, completedAt: { not: null } },
        select: { lessonId: true, completedAt: true },
      }),
    ]);
    const zone = learningZone(
        user.learningTimezone,
        process.env.PROGRAM_TIMEZONE,
      ),
      today = localDay(new Date(), zone);
    const completedToday = new Set(
      [...progress, ...attempts]
        .filter((p) => p.completedAt && localDay(p.completedAt, zone) === today)
        .map((p) => p.lessonId),
    ).size;
    const last =
      user.lastLearningAt ||
      (progress.length
        ? new Date(Math.max(...progress.map((p) => p.completedAt.getTime())))
        : null);
    return apiOk(
      {
        target: user.dailyGoal,
        completedToday,
        zone,
        streak: user.streak,
        welcomeBack: !!last && today - localDay(last, zone) > 1,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return apiServerError(
      "learning-plan/read",
      new Error("Your daily goal could not load."),
    );
  }
}
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to save your learning choices.",
        401,
      );
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;
    if (data.type === "goal" || data.type === "timezone") {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
        await tx.user.update({
          where: { id },
          data:
            data.type === "goal"
              ? { dailyGoal: data.target }
              : { learningTimezone: data.zone },
        });
      });
      return apiOk(
        data.type === "goal" ? { target: data.target } : { zone: data.zone },
      );
    }
    if (
      !(await prisma.path.findFirst({
        where: { id: data.pathId, isActive: true },
        select: { id: true },
      }))
    )
      return apiError(
        "not_found",
        "This pathway is not currently available.",
        404,
      );
    if (data.selected)
      await prisma.pathSelection.upsert({
        where: { userId_pathId: { userId: id, pathId: data.pathId } },
        create: { userId: id, pathId: data.pathId },
        update: {},
      });
    else
      await prisma.pathSelection.deleteMany({
        where: { userId: id, pathId: data.pathId },
      });
    return apiOk({ selected: data.selected });
  } catch {
    return apiServerError(
      "learning-plan/save",
      new Error("Your choice could not be saved."),
    );
  }
}
