import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, fullName, dateOfBirth, phone, city, state, zipCode, emergencyContactName, emergencyContactPhone } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName?.trim() || existing.fullName,
        dateOfBirth: dateOfBirth?.trim() || existing.dateOfBirth,
        phone: phone?.trim() || existing.phone,
        city: city?.trim() || existing.city,
        state: state?.trim() || existing.state,
        zipCode: zipCode?.trim() || existing.zipCode,
        emergencyContactName: emergencyContactName?.trim() || existing.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone?.trim() || existing.emergencyContactPhone,
      },
    });

    return NextResponse.json({
      ok: true,
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
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
