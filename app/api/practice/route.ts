import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk } from "@/lib/api-helpers";
import { practiceData } from "@/lib/lesson/practice";
export async function GET(req: Request) {
  try {
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError("unauthorized", "Sign in to load your practice.", 401);
    return apiOk(await practiceData(id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return apiError(
      "service_unavailable",
      "Practice could not load. Your saved learning is safe. Try again.",
      503,
    );
  }
}
