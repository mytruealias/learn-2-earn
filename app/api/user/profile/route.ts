import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";

const optStr = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

const Schema = z.object({
  userId: z.string().min(1).max(120),
  fullName: optStr(120),
  dateOfBirth: optStr(20),
  phone: optStr(40),
  city: optStr(120),
  state: optStr(60),
  zipCode: optStr(20),
  emergencyContactName: optStr(120),
  emergencyContactPhone: optStr(40),
});

export async function POST(req: Request) {
  try {
    const sessionUserId = getUserIdFromRequest(req);
    if (!sessionUserId) {
      return apiError("unauthorized", "Please sign in to update your profile.", 401);
    }

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { userId, ...rest } = parsed.data;

    if (userId !== sessionUserId) {
      return apiError("forbidden", "You can only edit your own profile.", 403);
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return apiError("not_found", "User not found", 404);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: rest.fullName ?? existing.fullName,
        dateOfBirth: rest.dateOfBirth ?? existing.dateOfBirth,
        phone: rest.phone ?? existing.phone,
        city: rest.city ?? existing.city,
        state: rest.state ?? existing.state,
        zipCode: rest.zipCode ?? existing.zipCode,
        emergencyContactName: rest.emergencyContactName ?? existing.emergencyContactName,
        emergencyContactPhone: rest.emergencyContactPhone ?? existing.emergencyContactPhone,
      },
    });

    return apiOk({
      user: {
        fullName: updated.fullName,
        dateOfBirth: updated.dateOfBirth,
        phone: updated.phone,
        city: updated.city,
        state: updated.state,
        zipCode: updated.zipCode,
        emergencyContactName: updated.emergencyContactName,
        emergencyContactPhone: updated.emergencyContactPhone,
      },
    });
  } catch (error) {
    return apiServerError("user/profile", error);
  }
}
