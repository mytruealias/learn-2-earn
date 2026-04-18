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
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";

// 10 PIN attempts per IP+city per 10 minutes.
const limiter = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 });

const Schema = z.object({
  pin: z.string().min(1, "PIN is required").max(40),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: rawSlug } = await context.params;
    const slugCheck = parseParam(rawSlug, slugParamSchema, "slug");
    if (!slugCheck.ok) return slugCheck.response;
    const citySlug = slugCheck.data as CitySlug;
    if (!getCityAccess(citySlug)) {
      return apiError("not_found", "Unknown city", 404);
    }

    const ip = getClientIp(req);
    const rateKey = `${ip}:${citySlug}`;

    const gate = limiter.check(rateKey);
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
      limiter.record(rateKey);
      return apiError("unauthorized", "Invalid PIN", 401);
    }

    limiter.reset(rateKey);
    const response = apiOk();
    setCityAccessCookie(response, citySlug);
    return response;
  } catch (error) {
    return apiServerError("city-access", error);
  }
}
