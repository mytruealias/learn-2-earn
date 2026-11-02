import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { z } from "zod";
import { setDemoAccessCookie } from "@/lib/access-token";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  rateLimitResponse,
} from "@/lib/api-helpers";

import prisma from "@/lib/prisma";
import {
  invitedProgram,
  PROGRAM_INVITATION_COOKIE,
} from "@/lib/program-enrollment";
const DEMO_CODE = process.env.DEMO_ACCESS_CODE;
import { sameOriginError } from "@/lib/user-session";

// 15 attempts per 10 min per IP — generous for shared demo devices but
// enough to throttle automated guessing of the demo gate code.

const Schema = z.object({
  code: z.string().min(1, "Access code is required").max(200),
});

export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    if (!process.env.SESSION_SECRET)
      return apiError(
        "service_unavailable",
        "Program access is not configured. Ask your program staff for help.",
        503,
      );
    const ip = getClientIp(req);
    const gate = await consumeRateLimit("access", ip, 15, 10 * 60 * 1000);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many access attempts. Please wait a few minutes before trying again.",
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;

    const demo =
      !!DEMO_CODE &&
      parsed.data.code.toUpperCase().trim() === DEMO_CODE.toUpperCase().trim();
    const programId = demo
      ? null
      : await invitedProgram(prisma, parsed.data.code);
    if (!demo && !programId) {

      return apiError("unauthorized", "Invalid access code", 401);
    }


    await gate.release?.();
    const response = apiOk();
    setDemoAccessCookie(response);
    response.cookies.set(
      PROGRAM_INVITATION_COOKIE,
      programId ? parsed.data.code.trim().toUpperCase() : "",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: programId ? 24 * 3600 : 0,
      },
    );
    return response;
  } catch (error) {
    return apiServerError("access", error);
  }
}
