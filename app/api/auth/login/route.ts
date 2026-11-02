import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { enrollFromInvitation } from "@/lib/program-enrollment";
import { loginSchema } from "@/lib/learner-auth-schema";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  setUserSessionCookie,
  sameOriginError,
  revokeUserSession,
} from "@/lib/user-session";
import { setDemoAccessCookie } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  rateLimitResponse,
} from "@/lib/api-helpers";

// Ten admitted login attempts per IP per ten minutes, shared across app instances.

const Schema = loginSchema;

export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const ip = getClientIp(req);
    const gate = await consumeRateLimit("learner-login", ip, 10, 10 * 60 * 1000);
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
    if (!user || !user.passwordHash || !user.isActive) {

      return apiError("unauthorized", "Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {

      await logAudit({
        action: "USER_LOGIN_FAILED",
        entity: "User",
        details: JSON.stringify({ email }),
        ipAddress: ip,
      });
      return apiError("unauthorized", "Invalid email or password", 401);
    }


    await logAudit({
      action: "USER_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: ip,
    });

    await prisma.$transaction((tx) => enrollFromInvitation(req, tx, user.id));
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    await revokeUserSession(req);
    const res = apiOk({
      onboardingRequired: user.onboardingState === "pending-v1",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        totalXp: user.totalXp,
        hearts: user.hearts,
        streak: user.streak,
      },
    });

    await gate.release?.();
    await setUserSessionCookie(res, user.id);
    setDemoAccessCookie(res);
    return res;
  } catch (error) {
    return apiServerError("auth/login", error);
  }
}
