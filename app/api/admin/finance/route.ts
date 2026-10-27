import { getAdminFromRequest } from "@/lib/admin-auth";
import { apiError, apiOk } from "@/lib/api-helpers";
import { financeData } from "@/lib/rewards/finance";
import { rewardError } from "@/lib/rewards/http";
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (!["admin", "finance"].includes(a.role))
      return apiError("forbidden", "Finance access required.", 403);
    return apiOk(await financeData(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return rewardError(e);
  }
}
