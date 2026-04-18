import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { setUserSessionCookie } from "@/lib/user-session";
import { setDemoAccessCookie } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";

// 10 failed login attempts per IP per 10 minutes.
const loginLimiter = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 });

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Password is required").max(200),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = loginLimiter.check(`login:${ip}`);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many login attempts. Please wait a few minutes and try again.",
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      loginLimiter.record(`login:${ip}`);
      return apiError("unauthorized", "Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      loginLimiter.record(`login:${ip}`);
      await logAudit({
        action: "USER_LOGIN_FAILED",
        entity: "User",
        details: JSON.stringify({ email }),
        ipAddress: ip,
      });
      return apiError("unauthorized", "Invalid email or password", 401);
    }

    loginLimiter.reset(`login:${ip}`);

    await logAudit({
      action: "USER_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: ip,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const res = apiOk({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        totalXp: user.totalXp,
        hearts: user.hearts,
        streak: user.streak,
      },
    });

    setUserSessionCookie(res, user.id);
    setDemoAccessCookie(res);
    return res;
  } catch (error) {
    return apiServerError("auth/login", error);
  }
}
