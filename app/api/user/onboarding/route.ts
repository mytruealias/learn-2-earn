import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
const Schema = z
  .object({ goal: z.enum(["explore", "short", "routine"]).nullable() })
  .strict();
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to resume your welcome steps.",
        401,
      );
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!user?.email)
      return apiError(
        "forbidden",
        "Create an account before saving these choices.",
        403,
      );
    // Conditional update makes a committed response safe to retry, with no duplicate consent record.
    await prisma.user.updateMany({
      where: { id, onboardingState: "pending-v1" },
      data: { learningGoal: parsed.data.goal, onboardingState: "complete-v1" },
    });
    return apiOk();
  } catch {
    return apiServerError(
      "user/onboarding",
      new Error("Welcome choices could not be saved."),
    );
  }
}
