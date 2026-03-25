import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, xpAmount } = body;

    if (!userId || !xpAmount || xpAmount < 3) {
      return NextResponse.json({ error: "Invalid request. Minimum 3 XP required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        payoutRequests: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.email || !user.fullName) {
      return NextResponse.json({ error: "Please complete your profile before requesting a payout" }, { status: 400 });
    }

    const totalPayoutXp = user.payoutRequests
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.xpAmount, 0);

    const availableXp = user.totalXp - totalPayoutXp;

    if (xpAmount > availableXp) {
      return NextResponse.json({ error: "Insufficient XP balance" }, { status: 400 });
    }

    const dollarAmount = Math.floor((xpAmount / 3) * 100) / 100;

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        xpAmount,
        dollarAmount,
        status: "pending",
        note: "Awaiting bank connection setup",
      },
    });

    await logAudit({
      action: "PAYOUT_REQUESTED",
      entity: "PayoutRequest",
      entityId: payout.id,
      details: JSON.stringify({ userId, xpAmount, dollarAmount }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
