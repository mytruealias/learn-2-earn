import { registrationSchema } from "@/lib/learner-auth-schema";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  createUserSession,
  getUserIdFromRequest,
  readCookie,
  sameOriginError,
  writeUserSessionCookie,
} from "@/lib/user-session";
import { hasProgramAccess, setDemoAccessCookie } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";
const signupLimiter = createRateLimiter({ max: 8, windowMs: 60 * 60 * 1000 });
const Schema = registrationSchema;
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const ip = getClientIp(req),
      gate = signupLimiter.check(ip);
    if (!gate.allowed)
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many sign-up attempts. Wait before trying again, or sign in if you already created an account.",
      );
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const currentId = await getUserIdFromRequest(req);
    if (!currentId && readCookie(req, "l2e_user_session"))
      return apiError(
        "unauthorized",
        "Your session ended. Sign in before creating another account.",
        401,
      );
    if (!currentId && !hasProgramAccess(req))
      return apiError(
        "forbidden",
        "Enter your program access code before creating an account.",
        403,
      );
    signupLimiter.record(ip);
    const { email, password, fullName } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      // Serialize guest promotion/retries; never move progress between arbitrary IDs.
      if (currentId)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${currentId}, 0))`;
      if (currentId && (await getUserIdFromRequest(req, tx)) !== currentId)
        return { error: "expired" as const };
      const current = currentId
        ? await tx.user.findUnique({ where: { id: currentId } })
        : null;
      if (current && !current.isActive) return { error: "inactive" as const };
      if (current?.email || current?.passwordHash) {
        if (current.email !== email) return { error: "signed_in" as const };
        // Retry after a committed response: do not overwrite credentials or mint another account.
        return { user: current, token: null };
      }
      if (await tx.user.findUnique({ where: { email } }))
        return { error: "exists" as const };
      const data = {
        email,
        passwordHash,
        fullName,
        onboardingState: "pending-v1",
      };
      const user = current
        ? await tx.user.update({ where: { id: current.id }, data })
        : await tx.user.create({ data });
      await tx.learnerSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      const token = await createUserSession(user.id, tx);
      await tx.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          entity: "User",
          entityId: user.id,
          details: JSON.stringify({ guestAssociation: !!current }),
          ipAddress: ip,
        },
      });
      return { user, token };
    });
    if ("error" in result) {
      if (result.error === "expired")
        return apiError(
          "unauthorized",
          "Your session changed. Sign in with the account you just created.",
          401,
        );
      if (result.error === "inactive")
        return apiError(
          "forbidden",
          "This account is unavailable. Ask your program staff for help.",
          403,
        );
      return apiError(
        "conflict",
        result.error === "signed_in"
          ? "You are already signed in. Sign out before using another account."
          : "An account with this email already exists. Sign in to continue; your saved work stays with that account.",
        409,
      );
    }
    const res = apiOk({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        totalXp: result.user.totalXp,
      },
      onboardingRequired: result.user.onboardingState === "pending-v1",
    });
    if (result.token) writeUserSessionCookie(res, result.token);
    setDemoAccessCookie(res);
    return res;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return apiError(
        "conflict",
        "This account may already have been created. Sign in with the same email and password.",
        409,
      );
    return apiServerError(
      "auth/register",
      new Error("Registration could not be confirmed."),
    );
  }
}
