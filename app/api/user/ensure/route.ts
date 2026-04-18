import { z } from "zod";
import prisma from "@/lib/prisma";
import { setUserSessionCookie } from "@/lib/user-session";
import { apiOk, apiServerError, parseJson } from "@/lib/api-helpers";

// Public bootstrap endpoint: a brand-new guest doesn't have a session
// cookie yet — they POST a client-generated guestId here and we create
// (or fetch) the user record and issue a signed session cookie.
const Schema = z.object({
  userId: z.string().trim().min(1, "Missing userId").max(120),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { userId } = parsed.data;

    let resolvedId = userId;
    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (existing) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    } else {
      const guestUser = await prisma.user.findUnique({ where: { guestId: userId } });
      if (guestUser) {
        await prisma.user.update({
          where: { id: guestUser.id },
          data: { lastActiveAt: new Date() },
        });
        resolvedId = guestUser.id;
        const res = apiOk({ actualUserId: guestUser.id });
        setUserSessionCookie(res, guestUser.id);
        return res;
      }

      await prisma.user.create({ data: { id: userId, guestId: userId } });
    }

    const res = apiOk();
    setUserSessionCookie(res, resolvedId);
    return res;
  } catch (error) {
    return apiServerError("user/ensure", error);
  }
}
