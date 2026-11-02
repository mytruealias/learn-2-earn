import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { enrollFromInvitation } from "@/lib/program-enrollment";
import { newRewardRelations } from "@/lib/rewards/new-account";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  createUserSession,
  getUserIdFromRequest,
  readCookie,
  sameOriginError,
  writeUserSessionCookie,
} from "@/lib/user-session";
import { hasProgramAccess } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  getClientIp,
  parseJson,
  rateLimitResponse,
} from "@/lib/api-helpers";
// Caller IDs are never credentials. Older clients must reload instead of claiming a record.
const Schema = z.object({}).strict();
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const current = await getUserIdFromRequest(req);
    if (current) return apiOk({ actualUserId: current });
    if (readCookie(req, "l2e_user_session"))
      return apiError(
        "unauthorized",
        "Your session ended. Sign in to resume your saved progress.",
        401,
      );
    if (!hasProgramAccess(req))
      return apiError(
        "forbidden",
        "Enter your program access code before exploring.",
        403,
      );
    const ip = getClientIp(req),
      gate = await consumeRateLimit("guest", ip, 20, 60 * 60 * 1000);
    if (!gate.allowed) return rateLimitResponse(gate.retryAfterSec);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: newRewardRelations() });
      await enrollFromInvitation(req, tx, user.id);
      return { id: user.id, token: await createUserSession(user.id, tx) };
    });
    const res = apiOk({ actualUserId: result.id });
    writeUserSessionCookie(res, result.token);
    return res;
  } catch (error) {
    return apiServerError("user/ensure", error);
  }
}
