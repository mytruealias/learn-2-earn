import { z } from "zod";
import prisma from "@/lib/prisma";
import { completedOnLocalDay, validTimeZone } from "@/lib/learning-progression";
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
    const zone = new URL(req.url).searchParams.get("zone") || "UTC";
    if (zone.length > 100 || !validTimeZone(zone))
      return apiError(
        "validation_error",
        "Your local day could not be identified. Try again.",
        400,
      );
    const [user, progress] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id },
        select: { dailyGoal: true },
      }),
      prisma.progress.findMany({
        where: { userId: id },
        select: { completedAt: true },
      }),
    ]);
    return apiOk(
      {
        target: user.dailyGoal,
        completedToday: completedOnLocalDay(progress, zone),
        zone,
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
    if (data.type === "goal") {
      await prisma.user.update({
        where: { id },
        data: { dailyGoal: data.target },
      });
      return apiOk({ target: data.target });
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
