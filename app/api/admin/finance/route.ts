import { NextResponse } from "next/server";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "finance"];

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden — admin or finance role required" }, { status: 403 });
    }

    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      payouts7,
      payouts30,
      payouts90,
      pendingLiability,
      recentPayouts,
    ] = await Promise.all([
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["completed", "approved"] }, updatedAt: { gte: days7 } },
        _sum: { dollarAmount: true, xpAmount: true },
        _count: { id: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["completed", "approved"] }, updatedAt: { gte: days30 } },
        _sum: { dollarAmount: true, xpAmount: true },
        _count: { id: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["completed", "approved"] }, updatedAt: { gte: days90 } },
        _sum: { dollarAmount: true, xpAmount: true },
        _count: { id: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["pending", "reviewed"] } },
        _sum: { dollarAmount: true },
        _count: { id: true },
      }),
      prisma.payoutRequest.findMany({
        where: { status: { in: ["completed", "approved"] } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          user: { select: { fullName: true, email: true, caseNumber: true } },
        },
      }),
    ]);

    let stripeBalance: { available: number; pending: number; currency: string } | null = null;
    let stripeConnected = false;
    let stripeAccountName: string | null = null;
    let stripeError: string | null = null;

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Dynamically import stripe — package must be installed for Stripe integration to work
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

        const [balance, account] = await Promise.all([
          stripe.balance.retrieve(),
          stripe.accounts.retrieve(),
        ]);

        const availableUSD = balance.available.find((b: { currency: string }) => b.currency === "usd");
        const pendingUSD = balance.pending.find((b: { currency: string }) => b.currency === "usd");

        stripeBalance = {
          available: availableUSD ? availableUSD.amount : 0,
          pending: pendingUSD ? pendingUSD.amount : 0,
          currency: "usd",
        };
        stripeConnected = true;
        stripeAccountName = account.display_name || account.email || null;
      } catch (e) {
        stripeError = e instanceof Error ? e.message : "Stripe connection failed";
      }
    }

    const poolBalance = await prisma.poolBalance.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton", balanceCents: 0 },
    });

    await logAudit({
      adminId: admin.id,
      action: "FINANCE_DASHBOARD_VIEW",
      entity: "Finance",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      disbursement: {
        days7: {
          dollars: payouts7._sum.dollarAmount ?? 0,
          xp: payouts7._sum.xpAmount ?? 0,
          count: payouts7._count.id,
        },
        days30: {
          dollars: payouts30._sum.dollarAmount ?? 0,
          xp: payouts30._sum.xpAmount ?? 0,
          count: payouts30._count.id,
        },
        days90: {
          dollars: payouts90._sum.dollarAmount ?? 0,
          xp: payouts90._sum.xpAmount ?? 0,
          count: payouts90._count.id,
        },
      },
      pendingLiability: {
        dollars: pendingLiability._sum.dollarAmount ?? 0,
        count: pendingLiability._count.id,
      },
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        learnerName: p.user.fullName || "Unknown",
        learnerEmail: p.user.email,
        caseNumber: p.user.caseNumber,
        dollarAmount: p.dollarAmount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        date: p.updatedAt,
      })),
      stripe: {
        connected: stripeConnected,
        balance: stripeBalance,
        accountName: stripeAccountName,
        error: stripeError,
        keyConfigured: !!process.env.STRIPE_SECRET_KEY,
      },
      pool: {
        balanceCents: poolBalance.balanceCents,
        updatedAt: poolBalance.updatedAt,
      },
    });
  } catch (error) {
    console.error("Finance dashboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
