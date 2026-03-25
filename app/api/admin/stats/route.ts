import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      registeredUsers,
      activeUsersMonth,
      activeUsersWeek,
      totalLessonsCompleted,
      totalXpDistributed,
      pendingPayouts,
      approvedPayouts,
      completedPayouts,
      totalPayoutDollars,
      totalPaths,
      totalLessons,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { email: { not: null } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.progress.count(),
      prisma.progress.aggregate({ _sum: { xpEarned: true } }),
      prisma.payoutRequest.count({ where: { status: "pending" } }),
      prisma.payoutRequest.count({ where: { status: "approved" } }),
      prisma.payoutRequest.count({ where: { status: "completed" } }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["approved", "completed"] } },
        _sum: { dollarAmount: true },
      }),
      prisma.path.count({ where: { isActive: true } }),
      prisma.lesson.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        users: {
          total: totalUsers,
          registered: registeredUsers,
          guests: totalUsers - registeredUsers,
          activeMonth: activeUsersMonth,
          activeWeek: activeUsersWeek,
        },
        learning: {
          totalPaths,
          totalLessons,
          lessonsCompleted: totalLessonsCompleted,
          totalXpDistributed: totalXpDistributed._sum.xpEarned || 0,
        },
        payouts: {
          pending: pendingPayouts,
          approved: approvedPayouts,
          completed: completedPayouts,
          totalDollars: totalPayoutDollars._sum.dollarAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
