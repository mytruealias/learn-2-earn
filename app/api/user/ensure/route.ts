import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setUserSessionCookie } from "@/lib/user-session";

export async function POST(req: Request) {
  try {
    const { userId } = (await req.json()) as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

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
        const res = NextResponse.json({ ok: true, actualUserId: guestUser.id });
        setUserSessionCookie(res, guestUser.id);
        return res;
      }

      await prisma.user.create({
        data: { id: userId, guestId: userId },
      });
    }

    const res = NextResponse.json({ ok: true });
    setUserSessionCookie(res, resolvedId);
    return res;
  } catch (error) {
    console.error("User ensure error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
