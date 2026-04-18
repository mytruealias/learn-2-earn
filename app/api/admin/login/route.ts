import { z } from "zod";
import { adminLogin, SESSION_COOKIE } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";

// 10 admin login attempts per IP per 10 minutes (in addition to the
// per-account lockout already enforced by lib/admin-auth).
const limiter = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 });

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Password is required").max(200),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = limiter.check(`admin-login:${ip}`);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many login attempts. Please wait a few minutes and try again.",
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { email, password } = parsed.data;

    const result = await adminLogin(email, password);

    if (!result.success) {
      limiter.record(`admin-login:${ip}`);
      await logAudit({
        action: "LOGIN_FAILED",
        entity: "AdminUser",
        details: JSON.stringify({ email, reason: result.error }),
        ipAddress: ip,
      });
      return apiError("unauthorized", result.error ?? "Invalid credentials", 401);
    }

    limiter.reset(`admin-login:${ip}`);

    await logAudit({
      adminId: result.admin!.id,
      action: "LOGIN_SUCCESS",
      entity: "AdminUser",
      entityId: result.admin!.id,
      ipAddress: ip,
    });

    const response = apiOk({ admin: result.admin });
    const rootDomain = process.env.ROOT_DOMAIN;
    response.cookies.set(SESSION_COOKIE, result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
      ...(rootDomain && { domain: `admin.${rootDomain}` }),
    });
    return response;
  } catch (error) {
    return apiServerError("admin/login", error);
  }
}
