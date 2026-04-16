import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getUserIdFromRequest } from "@/lib/user-session";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["venmo", "paypal", "cashapp", "check"];
const MAX_HANDLE_LENGTH = 255;

const DEFAULT_MIN_XP = 20;
const DEFAULT_XP_TO_DOLLAR = 0.05;
const DEFAULT_WEEKLY_XP_CAP = 500;

async function getPayoutRules(userCity: string | null) {
  if (userCity) {
    const slug = userCity.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const config = await prisma.payoutConfig.findFirst({
      where: { programSlug: slug, isActive: true },
    });
    if (config) {
      return {
        minXp: config.minimumXp,
        xpToDollar: config.xpToDollar,
        weeklyXpCap: config.weeklyXpCap,
      };
    }
  }

  const defaultConfig = await prisma.payoutConfig.findFirst({
    where: { programSlug: "default", isActive: true },
  });
  if (defaultConfig) {
    return {
      minXp: defaultConfig.minimumXp,
      xpToDollar: defaultConfig.xpToDollar,
      weeklyXpCap: defaultConfig.weeklyXpCap,
    };
  }

  return {
    minXp: DEFAULT_MIN_XP,
    xpToDollar: DEFAULT_XP_TO_DOLLAR,
    weeklyXpCap: DEFAULT_WEEKLY_XP_CAP,
  };
}

export async function POST(req: Request) {
  try {
    const sessionUserId = getUserIdFromRequest(req);

    const body = await req.json();
    const { xpAmount, paymentMethod, paymentHandle } = body;

    const userId = sessionUserId ?? body.userId;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (sessionUserId && body.userId && sessionUserId !== body.userId) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { minXp, xpToDollar, weeklyXpCap } = await getPayoutRules(user.city);

    if (!Number.isInteger(xpAmount) || xpAmount < minXp) {
      return NextResponse.json(
        { error: `You need at least ${minXp} XP to request a payout` },
        { status: 400 }
      );
    }

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Please select a valid payment method." }, { status: 400 });
    }

    const handle = typeof paymentHandle === "string" ? paymentHandle.trim() : "";
    if (!handle) {
      return NextResponse.json(
        { error: "Please provide your payment handle or address." },
        { status: 400 }
      );
    }
    if (handle.length > MAX_HANDLE_LENGTH) {
      return NextResponse.json(
        { error: `Payment handle must be ${MAX_HANDLE_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (!user.email || !user.fullName) {
      return NextResponse.json(
        { error: "Please complete your profile before requesting a payout." },
        { status: 400 }
      );
    }

    const { _sum } = await prisma.payoutRequest.aggregate({
      where: { userId, status: { not: "rejected" } },
      _sum: { xpAmount: true },
    });

    const totalPayoutXp = _sum.xpAmount ?? 0;
    const availableXp = user.totalXp - totalPayoutXp;

    if (availableXp < minXp) {
      const needed = minXp - availableXp;
      return NextResponse.json(
        { error: `You need ${needed} more XP to request a payout.` },
        { status: 400 }
      );
    }

    if (xpAmount > availableXp) {
      return NextResponse.json({ error: "Insufficient XP balance." }, { status: 400 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { _sum: weeklySum } = await prisma.payoutRequest.aggregate({
      where: { userId, status: { not: "rejected" }, createdAt: { gte: sevenDaysAgo } },
      _sum: { xpAmount: true },
    });
    const weeklyXpRequested = weeklySum.xpAmount ?? 0;
    if (weeklyXpRequested + xpAmount > weeklyXpCap) {
      const remaining = Math.max(0, weeklyXpCap - weeklyXpRequested);
      return NextResponse.json(
        { error: `Weekly payout limit reached. You can request up to ${remaining} more XP this week.` },
        { status: 400 }
      );
    }

    const dollarAmount = Math.round(xpAmount * xpToDollar * 100) / 100;

    const methodLabels: Record<string, string> = {
      venmo: "Venmo",
      paypal: "PayPal",
      cashapp: "Cash App",
      check: "Check",
    };

    const methodLabel = methodLabels[paymentMethod] ?? paymentMethod;
    const note =
      paymentMethod === "check"
        ? `Pay via Check to: ${handle}`
        : `Pay via ${methodLabel}: ${handle}`;

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        xpAmount,
        dollarAmount,
        status: "pending",
        note,
        paymentMethod,
        paymentHandle: handle,
      },
    });

    await logAudit({
      action: "PAYOUT_REQUESTED",
      entity: "PayoutRequest",
      entityId: payout.id,
      details: JSON.stringify({ userId, xpAmount, dollarAmount, paymentMethod, xpToDollar, weeklyXpCap, minXp }),
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    });

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
