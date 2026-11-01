import { z } from "zod";
import { parseQuery } from "@/lib/api-helpers";
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
    const query = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      z.object({
        configPage: z.coerce.number().int().min(1).max(10000).default(1),
      }),
    );
    if (!query.ok) return query.response;
    return apiOk(await financeData(a, query.data.configPage), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return rewardError(e);
  }
}
