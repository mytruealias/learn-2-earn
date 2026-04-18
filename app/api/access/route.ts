import { z } from "zod";
import { createAccessToken } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";

const DEMO_CODE = process.env.DEMO_ACCESS_CODE || "LEARN2EARN";

// 15 attempts per 10 min per IP — generous for shared demo devices but
// enough to throttle automated guessing of the demo gate code.
const limiter = createRateLimiter({ max: 15, windowMs: 10 * 60 * 1000 });

const Schema = z.object({
  code: z.string().min(1, "Access code is required").max(200),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = limiter.check(`access:${ip}`);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many access attempts. Please wait a few minutes before trying again.",
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;

    if (parsed.data.code.toUpperCase().trim() !== DEMO_CODE.toUpperCase().trim()) {
      limiter.record(`access:${ip}`);
      return apiError("unauthorized", "Invalid access code", 401);
    }

    limiter.reset(`access:${ip}`);

    const token = createAccessToken();
    const response = apiOk();
    const rootDomain = process.env.ROOT_DOMAIN;
    response.cookies.set("l2e_demo_access", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      ...(rootDomain && { domain: `app.${rootDomain}` }),
    });
    return response;
  } catch (error) {
    return apiServerError("access", error);
  }
}
