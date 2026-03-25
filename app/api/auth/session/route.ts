import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        payoutRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalPayoutXp = user.payoutRequests
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.xpAmount, 0);

    const availableXp = user.totalXp - totalPayoutXp;
    const availableBalance = Math.floor((availableXp / 3) * 100) / 100;

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        caseNumber: user.caseNumber,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        totalXp: user.totalXp,
        hearts: user.hearts,
        streak: user.streak,
        lessonsCompleted: user.progress.length,
        availableXp,
        availableBalance,
        totalEarnings: Math.floor((user.totalXp / 3) * 100) / 100,
        payoutRequests: user.payoutRequests,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
