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
      openCasesHigh,
      openCasesMedium,
      openCasesLow,
      casesThisWeek,
      pendingLiability,
      poolBalance,
      activeUsersWithProgress,
      avgProgressPerUser,
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
      prisma.case.count({ where: { status: { notIn: ["closed", "resolved"] }, priority: "high" } }),
      prisma.case.count({ where: { status: { notIn: ["closed", "resolved"] }, priority: "medium" } }),
      prisma.case.count({ where: { status: { notIn: ["closed", "resolved"] }, priority: "low" } }),
      prisma.case.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ["pending", "reviewed"] } },
        _sum: { dollarAmount: true },
        _count: { id: true },
      }),
      prisma.poolBalance.findUnique({ where: { id: "singleton" } }),
      prisma.progress.groupBy({
        by: ["userId"],
        _count: { lessonId: true },
        where: { user: { lastActiveAt: { gte: thirtyDaysAgo } } },
      }),
      prisma.progress.aggregate({
        _count: { id: true },
        where: { user: { lastActiveAt: { gte: thirtyDaysAgo } } },
      }),
    ]);

    const activeUsersWithAtLeastOneLesson = activeUsersWithProgress.length;
    const avgLessonsPerActiveUser =
      activeUsersMonth > 0
        ? Math.round((avgProgressPerUser._count.id / activeUsersMonth) * 10) / 10
        : 0;
    const engagementRate =
      activeUsersMonth > 0
        ? Math.round((activeUsersWithAtLeastOneLesson / activeUsersMonth) * 100)
        : 0;

    const openCasesTotal = openCasesHigh + openCasesMedium + openCasesLow;

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
          engagementRate,
          avgLessonsPerActiveUser,
        },
        payouts: {
          pending: pendingPayouts,
          approved: approvedPayouts,
          completed: completedPayouts,
          totalDollars: totalPayoutDollars._sum.dollarAmount || 0,
        },
        cases: {
          openTotal: openCasesTotal,
          high: openCasesHigh,
          medium: openCasesMedium,
          low: openCasesLow,
          newThisWeek: casesThisWeek,
        },
        pool: {
          balanceCents: poolBalance?.balanceCents ?? 0,
          pendingLiabilityCents: Math.round((pendingLiability._sum.dollarAmount ?? 0) * 100),
          pendingCount: pendingLiability._count.id,
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
