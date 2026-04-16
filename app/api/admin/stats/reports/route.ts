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
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      engagementRaw,
      pathsWithCounts,
      totalUsers,
      registeredUsers,
      activeMonth,
      activeWeek,
      totalXp,
      totalLessonsCompleted,
      payoutSummary,
      completedPayoutSum,
    ] = await Promise.all([
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("completedAt") as day, COUNT(*)::bigint as count
        FROM "Progress"
        WHERE "completedAt" >= ${ninetyDaysAgo}
        GROUP BY DATE("completedAt")
        ORDER BY day ASC
      `,

      prisma.path.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          modules: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              lessons: {
                where: { isActive: true },
                select: {
                  id: true,
                  progress: { select: { userId: true } },
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      }),

      prisma.user.count(),
      prisma.user.count({ where: { email: { not: null } } }),
      prisma.user.count({
        where: { lastActiveAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.user.count({
        where: { lastActiveAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.progress.aggregate({ _sum: { xpEarned: true } }),
      prisma.progress.count(),
      prisma.payoutRequest.aggregate({
        _sum: { dollarAmount: true },
        _count: { id: true },
        where: { status: { in: ["pending", "reviewed", "approved", "completed"] } },
      }),
      prisma.payoutRequest.aggregate({
        _sum: { dollarAmount: true },
        _count: { id: true },
        where: { status: "completed" },
      }),
    ]);

    const engagement = engagementRaw.map((row) => ({
      date: (row.day instanceof Date ? row.day : new Date(row.day)).toISOString().slice(0, 10),
      count: Number(row.count),
    }));

    const dropoff: {
      pathTitle: string;
      modules: {
        title: string;
        totalLessons: number;
        uniqueStarters: number;
        uniqueCompleters: number;
        completionRate: number;
      }[];
      totalLessons: number;
      uniqueStarters: number;
      uniqueCompleters: number;
      completionRate: number;
    }[] = [];

    let totalPathCompletions = 0;
    let totalModuleCompletions = 0;

    for (const path of pathsWithCounts) {
      const pathStarters = new Set<string>();
      const pathCompleters = new Set<string>();
      let pathTotalLessons = 0;
      const moduleStats: typeof dropoff[0]["modules"] = [];

      for (const mod of path.modules) {
        const modStarters = new Set<string>();
        const modLessonCount = mod.lessons.length;
        pathTotalLessons += modLessonCount;

        const userCompletedLessons = new Map<string, number>();

        for (const lesson of mod.lessons) {
          for (const p of lesson.progress) {
            modStarters.add(p.userId);
            pathStarters.add(p.userId);
            userCompletedLessons.set(p.userId, (userCompletedLessons.get(p.userId) || 0) + 1);
          }
        }

        const modCompleters = new Set<string>();
        for (const [userId, count] of userCompletedLessons) {
          if (count >= modLessonCount && modLessonCount > 0) {
            modCompleters.add(userId);
          }
        }
        totalModuleCompletions += modCompleters.size;

        moduleStats.push({
          title: mod.title,
          totalLessons: modLessonCount,
          uniqueStarters: modStarters.size,
          uniqueCompleters: modCompleters.size,
          completionRate: modStarters.size > 0
            ? Math.round((modCompleters.size / modStarters.size) * 100)
            : 0,
        });
      }

      const userTotalLessonsInPath = new Map<string, number>();
      for (const mod of path.modules) {
        for (const lesson of mod.lessons) {
          for (const p of lesson.progress) {
            userTotalLessonsInPath.set(p.userId, (userTotalLessonsInPath.get(p.userId) || 0) + 1);
          }
        }
      }
      for (const [userId, count] of userTotalLessonsInPath) {
        if (count >= pathTotalLessons && pathTotalLessons > 0) {
          pathCompleters.add(userId);
        }
      }
      totalPathCompletions += pathCompleters.size;

      dropoff.push({
        pathTitle: path.title,
        modules: moduleStats,
        totalLessons: pathTotalLessons,
        uniqueStarters: pathStarters.size,
        uniqueCompleters: pathCompleters.size,
        completionRate: pathStarters.size > 0
          ? Math.round((pathCompleters.size / pathStarters.size) * 100)
          : 0,
      });
    }

    return NextResponse.json({
      ok: true,
      reports: {
        engagement,
        dropoff,
        milestones: {
          pathCompletions: totalPathCompletions,
          moduleCompletions: totalModuleCompletions,
          lessonsCompleted: totalLessonsCompleted,
        },
        summary: {
          totalUsers,
          registeredUsers,
          guestUsers: totalUsers - registeredUsers,
          activeWeek,
          activeMonth,
          totalXpDistributed: totalXp._sum.xpEarned || 0,
          totalLessonsCompleted,
          totalPayoutRequests: payoutSummary._count.id,
          totalPayoutDollars: payoutSummary._sum.dollarAmount || 0,
          completedPayouts: completedPayoutSum._count.id,
          completedPayoutDollars: completedPayoutSum._sum.dollarAmount || 0,
          pathCompletions: totalPathCompletions,
          moduleCompletions: totalModuleCompletions,
        },
      },
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
