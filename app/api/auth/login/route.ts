import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { setUserSessionCookie } from "@/lib/user-session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAudit({
        action: "USER_LOGIN_FAILED",
        entity: "User",
        details: JSON.stringify({ email }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await logAudit({
      action: "USER_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const res = NextResponse.json({
      ok: true,
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
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
