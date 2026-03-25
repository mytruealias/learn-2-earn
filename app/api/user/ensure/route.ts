import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = (await req.json()) as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

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
        return NextResponse.json({ ok: true, actualUserId: guestUser.id });
      }

      await prisma.user.create({
        data: { id: userId, guestId: userId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User ensure error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
