import { sameOriginError } from "@/lib/request-origin";
import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { z } from "zod";
import { setCityAccessCookie, getExpectedPin, getCityAccess, type CitySlug } from "@/lib/city-access";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  parseParam,
  slugParamSchema,
  getClientIp,
  rateLimitResponse,
} from "@/lib/api-helpers";

// Ten admitted PIN attempts per IP/city per ten minutes, shared across instances.

const Schema = z.object({
  pin: z.string().min(1, "PIN is required").max(40),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const { slug: rawSlug } = await context.params;
    const slugCheck = parseParam(rawSlug, slugParamSchema, "slug");
    if (!slugCheck.ok) return slugCheck.response;
    const citySlug = slugCheck.data as CitySlug;
    if (!getCityAccess(citySlug)) {
      return apiError("not_found", "Unknown city", 404);
    }

    const ip = getClientIp(req);

    const gate = await consumeRateLimit(`city:${citySlug}`, ip, 10, 10 * 60 * 1000);
    if (!gate.allowed) {
      const minutes = Math.max(1, Math.ceil(gate.retryAfterSec / 60));
      return rateLimitResponse(
        gate.retryAfterSec,
        `Too many incorrect PIN attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;

    const expected = getExpectedPin(citySlug);
    if (!expected) {
      return apiError("service_unavailable", "City access gate is not configured", 503);
    }

    if (parsed.data.pin.trim() !== expected) {

      return apiError("unauthorized", "Invalid PIN", 401);
    }

    await gate.release?.();
    const response = apiOk();
    setCityAccessCookie(response, citySlug);
    return response;
  } catch (error) {
    return apiServerError("city-access", error);
  }
}
