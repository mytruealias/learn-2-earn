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

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 83);
    twelveWeeksAgo.setHours(0, 0, 0, 0);

    const [recentUsers, recentPayouts] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payoutRequest.findMany({
        where: {
          status: { in: ["completed"] },
          updatedAt: { gte: twelveWeeksAgo },
        },
        select: { dollarAmount: true, updatedAt: true },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

    const userGrowthMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      userGrowthMap[key] = 0;
    }
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (key in userGrowthMap) userGrowthMap[key]++;
    }
    const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => ({ date, count }));

    const payoutVolumeMap: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(twelveWeeksAgo);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const key = weekStart.toISOString().slice(0, 10);
      payoutVolumeMap[key] = 0;
    }
    for (const p of recentPayouts) {
      const d = new Date(p.updatedAt);
      const weekStart = new Date(twelveWeeksAgo);
      let assignedWeek = weekStart.toISOString().slice(0, 10);
      for (let i = 0; i < 12; i++) {
        const ws = new Date(twelveWeeksAgo);
        ws.setDate(ws.getDate() + i * 7);
        const we = new Date(ws);
        we.setDate(we.getDate() + 7);
        if (d >= ws && d < we) {
          assignedWeek = ws.toISOString().slice(0, 10);
          break;
        }
      }
      if (assignedWeek in payoutVolumeMap) {
        payoutVolumeMap[assignedWeek] += p.dollarAmount;
      }
    }
    const payoutVolume = Object.entries(payoutVolumeMap).map(([week, dollars]) => ({
      week,
      dollars: Math.round(dollars * 100) / 100,
    }));

    return NextResponse.json({
      ok: true,
      trends: { userGrowth, payoutVolume },
    });
  } catch (error) {
    console.error("Admin trends error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
