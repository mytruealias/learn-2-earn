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

// Light rate limit: 8 signups per IP per hour.
const signupLimiter = createRateLimiter({ max: 8, windowMs: 60 * 60 * 1000 });

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  dateOfBirth: optionalString(20),
  phone: optionalString(40),
  city: optionalString(120),
  state: optionalString(60),
  zipCode: optionalString(20),
  caseNumber: optionalString(60),
  emergencyContactName: optionalString(120),
  emergencyContactPhone: optionalString(40),
  guestId: optionalString(120),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = signupLimiter.check(`signup:${ip}`);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "Too many sign-up attempts from this device. Please try again later.",
      );
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return apiError("conflict", "An account with this email already exists", 409);
    }

    signupLimiter.record(`signup:${ip}`);

    const passwordHash = await bcrypt.hash(data.password, 10);

    let user;
    if (data.guestId) {
      const guestUser = await prisma.user.findUnique({ where: { guestId: data.guestId } });
      if (guestUser) {
        user = await prisma.user.update({
          where: { id: guestUser.id },
          data: {
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth ?? null,
            phone: data.phone ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            zipCode: data.zipCode ?? null,
            caseNumber: data.caseNumber ?? null,
            emergencyContactName: data.emergencyContactName ?? null,
            emergencyContactPhone: data.emergencyContactPhone ?? null,
          },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          guestId: data.guestId ?? null,
          dateOfBirth: data.dateOfBirth ?? null,
          phone: data.phone ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          zipCode: data.zipCode ?? null,
          caseNumber: data.caseNumber ?? null,
          emergencyContactName: data.emergencyContactName ?? null,
          emergencyContactPhone: data.emergencyContactPhone ?? null,
        },
      });
    }

    await logAudit({
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      details: JSON.stringify({ email: data.email, guestMigration: !!data.guestId }),
      ipAddress: ip,
    });

    const res = apiOk({
      user: { id: user.id, email: user.email, fullName: user.fullName, totalXp: user.totalXp },
    });
    setUserSessionCookie(res, user.id);
    setDemoAccessCookie(res);
    return res;
  } catch (error) {
    return apiServerError("auth/register", error);
  }
}
