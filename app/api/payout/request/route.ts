import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["venmo", "paypal", "cashapp", "check"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, xpAmount, paymentMethod, paymentHandle } = body;

    if (!userId || !xpAmount) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Please select a valid payment method." }, { status: 400 });
    }

    if (!paymentHandle || !paymentHandle.trim()) {
      return NextResponse.json({ error: "Please provide your payment handle or address." }, { status: 400 });
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

    if (availableXp < 3) {
      const needed = 3 - availableXp;
      return NextResponse.json({ error: `You need ${needed} more XP to request a payout` }, { status: 400 });
    }

    if (xpAmount < 3) {
      return NextResponse.json({ error: "You need at least 3 XP to request a payout" }, { status: 400 });
    }

    if (xpAmount > availableXp) {
      return NextResponse.json({ error: "Insufficient XP balance" }, { status: 400 });
    }

    const dollarAmount = Math.floor((xpAmount / 3) * 100) / 100;

    const methodLabels: Record<string, string> = {
      venmo: "Venmo",
      paypal: "PayPal",
      cashapp: "Cash App",
      check: "Check",
    };

    const methodLabel = methodLabels[paymentMethod] || paymentMethod;
    const note = paymentMethod === "check"
      ? `Pay via Check to: ${paymentHandle.trim()}`
      : `Pay via ${methodLabel}: ${paymentHandle.trim()}`;

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        xpAmount,
        dollarAmount,
        status: "pending",
        note,
        paymentMethod,
        paymentHandle: paymentHandle.trim(),
      },
    });

    await logAudit({
      action: "PAYOUT_REQUESTED",
      entity: "PayoutRequest",
      entityId: payout.id,
      details: JSON.stringify({ userId, xpAmount, dollarAmount, paymentMethod }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
