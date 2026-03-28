import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import FinanceClient, { FinanceData } from "./FinanceClient";
import styles from "./finance.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getFinanceData(adminId: string): Promise<FinanceData> {
  const now = new Date();
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [payouts7, payouts30, payouts90, pendingLiability, recentPayouts, poolRecord, adjustmentRecords] =
    await Promise.all([
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
      prisma.poolBalance.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.poolAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { fullName: true } } },
      }),
    ]);

  let pool = poolRecord;
  if (!pool) {
    pool = await prisma.poolBalance.create({ data: { balanceCents: 0, updatedById: adminId } });
  }

  let stripeBalance: { available: number; pending: number; currency: string } | null = null;
  let stripeConnected = false;
  let stripeAccountName: string | null = null;
  let stripeError: string | null = null;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
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

  return {
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
      date: p.updatedAt.toISOString(),
    })),
    stripe: {
      connected: stripeConnected,
      balance: stripeBalance,
      accountName: stripeAccountName,
      error: stripeError,
      keyConfigured: !!process.env.STRIPE_SECRET_KEY,
    },
    pool: {
      balanceCents: pool.balanceCents,
      updatedAt: pool.updatedAt.toISOString(),
    },
    adjustments: adjustmentRecords.map((a) => ({
      id: a.id,
      amountCents: a.amountCents,
      reason: a.reason,
      createdAt: a.createdAt.toISOString(),
      adminName: a.admin.fullName,
    })),
  };
}

export default async function AdminFinancePage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!["admin", "finance"].includes(admin.role)) {
    return (
      <div className={styles.forbiddenPage}>
        <div className={styles.forbiddenIcon}>🔒</div>
        <h1 className={styles.forbiddenTitle}>Access Restricted</h1>
        <p className={styles.forbiddenText}>
          The Finance dashboard is only available to Admin and Finance staff.
        </p>
      </div>
    );
  }

  const data = await getFinanceData(admin.id);

  return <FinanceClient initialData={data} />;
}
