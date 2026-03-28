import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

interface ActivityEvent {
  id: string;
  type: "user" | "payout" | "case" | "stress" | "lesson";
  label: string;
  timestamp: string;
  link?: string;
}

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [recentUsers, recentPayouts, recentCases, stressSignals, recentProgress] =
      await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, fullName: true, email: true, createdAt: true },
        }),
        prisma.payoutRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            dollarAmount: true,
            status: true,
            createdAt: true,
            user: { select: { fullName: true, email: true } },
          },
        }),
        prisma.case.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            priority: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
        }),
        prisma.auditLog.findMany({
          where: { action: "CASE_CREATE_STRESS_SIGNAL" },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            entityId: true,
            details: true,
            createdAt: true,
          },
        }),
        prisma.progress.findMany({
          orderBy: { completedAt: "desc" },
          take: 4,
          select: {
            id: true,
            completedAt: true,
            xpEarned: true,
            user: { select: { fullName: true } },
            lesson: { select: { title: true } },
          },
        }),
      ]);

    const events: ActivityEvent[] = [];

    for (const u of recentUsers) {
      events.push({
        id: `user-${u.id}`,
        type: "user",
        label: `New learner registered: ${u.fullName || u.email || "Guest"}`,
        timestamp: u.createdAt.toISOString(),
        link: "/admin/users",
      });
    }

    for (const p of recentPayouts) {
      const name = p.user.fullName || p.user.email || "Learner";
      events.push({
        id: `payout-${p.id}`,
        type: "payout",
        label: `Payout request $${p.dollarAmount.toFixed(2)} from ${name}`,
        timestamp: p.createdAt.toISOString(),
        link: "/admin/payouts",
      });
    }

    for (const c of recentCases) {
      const name = c.user.fullName || "Learner";
      events.push({
        id: `case-${c.id}`,
        type: "case",
        label: `${c.priority === "high" ? "High-priority case" : "Case"} opened by ${name}: ${c.title}`,
        timestamp: c.createdAt.toISOString(),
        link: `/admin/cases`,
      });
    }

    for (const s of stressSignals) {
      events.push({
        id: `stress-${s.id}`,
        type: "stress",
        label: `Stress signal flagged on case`,
        timestamp: s.createdAt.toISOString(),
        link: s.entityId ? `/admin/cases` : "/admin/cases",
      });
    }

    for (const pr of recentProgress) {
      const name = pr.user.fullName || "Learner";
      events.push({
        id: `lesson-${pr.id}`,
        type: "lesson",
        label: `${name} completed "${pr.lesson.title}" (+${pr.xpEarned} XP)`,
        timestamp: pr.completedAt.toISOString(),
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      ok: true,
      activity: events.slice(0, 15),
    });
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
