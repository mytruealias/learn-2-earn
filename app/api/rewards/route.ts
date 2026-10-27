import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk } from "@/lib/api-helpers";
import { rewardSummary } from "@/lib/rewards/accounting";
import { rewardError } from "@/lib/rewards/http";
export async function GET(req: Request) {
  try {
    const id = await getUserIdFromRequest(req);
    if (!id) return apiError("unauthorized", "Sign in to view rewards.", 401);
    const summary = await prisma.$transaction((tx) => rewardSummary(tx, id), {
      isolationLevel: "RepeatableRead",
    });
    return apiOk(summary, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return rewardError(e);
  }
}
