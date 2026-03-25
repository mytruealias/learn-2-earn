import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { setUserSessionCookie } from "@/lib/user-session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email, password, fullName, dateOfBirth, phone, city, state, zipCode,
      caseNumber, emergencyContactName, emergencyContactPhone, guestId,
    } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;

    if (guestId) {
      const guestUser = await prisma.user.findUnique({ where: { guestId } });
      if (guestUser) {
        user = await prisma.user.update({
          where: { id: guestUser.id },
          data: {
            email,
            passwordHash,
            fullName,
            dateOfBirth: dateOfBirth || null,
            phone: phone || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
            caseNumber: caseNumber || null,
            emergencyContactName: emergencyContactName || null,
            emergencyContactPhone: emergencyContactPhone || null,
          },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          guestId: guestId || null,
          dateOfBirth: dateOfBirth || null,
          phone: phone || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          caseNumber: caseNumber || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
        },
      });
    }

    await logAudit({
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      details: JSON.stringify({ email, guestMigration: !!guestId }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        totalXp: user.totalXp,
      },
    });

    setUserSessionCookie(res, user.id);
    return res;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
