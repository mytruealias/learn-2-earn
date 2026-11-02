import { z } from "zod";
import { apiError, apiOk, getClientIp, rateLimitResponse } from "@/lib/api-helpers";
import { boundedJson } from "@/lib/support/bounded-json";
import { sameOriginError } from "@/lib/request-origin";
import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { operationalEvent } from "@/lib/reliability/events";
import { routeTemplate } from "@/lib/reliability/route-template";
import { REQUEST_ID_HEADER, requestIdFrom } from "@/lib/reliability/correlation";
export const dynamic = "force-dynamic";
const schema = z.object({ code: z.enum(["client_error", "client_rejection"]), route: z.string().max(80) }).strict();
export async function POST(req: Request) {
    const origin = sameOriginError(req);
    if (origin)
        return origin;
    if (process.env.OPERATIONAL_TELEMETRY_ENABLED !== "true")
        return apiError("not_found", "Reporting is not enabled.", 404);
    const raw = await boundedJson(req, 512);
    if (!raw.ok)
        return raw.response;
    const parsed = schema.safeParse(raw.data);
    if (!parsed.success || routeTemplate(parsed.data.route) !== parsed.data.route && !["/paths/[pathSlug]", "/lesson/[lessonId]", "/admin/cases/[id]", "/admin/users/[userId]", "/[city]", "/other"].includes(parsed.data?.route || ""))
        return apiError("validation_error", "Unsupported report.", 400);
    try {
        const limit = await consumeRateLimit("telemetry", getClientIp(req), 12, 60000);
        if (!limit.allowed)
            return rateLimitResponse(limit.retryAfterSec);
        operationalEvent(parsed.data.code, requestIdFrom(req.headers.get(REQUEST_ID_HEADER)), parsed.data.route);
        return apiOk({}, { headers: { "Cache-Control": "private, no-store" } });
    }
    catch {
        return apiError("service_unavailable", "Reporting unavailable.", 503);
    }
}
