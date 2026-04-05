import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const BADGE_DEFS: BadgeDefinition[] = [
  // — Lesson milestones —
  { id: "first_lesson",  label: "First Lesson",   icon: "🎓", description: "Completed your first lesson" },
  { id: "lessons_5",    label: "Quick Start",     icon: "🚀", description: "Completed 5 lessons" },
  { id: "lessons_10",   label: "Study Habit",     icon: "📚", description: "Completed 10 lessons" },
  { id: "lessons_25",   label: "Committed",       icon: "💪", description: "Completed 25 lessons" },
  { id: "lessons_50",   label: "Scholar",         icon: "🎖️", description: "Completed 50 lessons" },
  // — Streak milestones —
  { id: "streak_3",     label: "3-Day Streak",    icon: "🔥", description: "Kept a 3-day learning streak" },
  { id: "streak_7",     label: "7-Day Streak",    icon: "⚡", description: "Kept a 7-day learning streak" },
  { id: "streak_14",    label: "Two Weeks",       icon: "🌊", description: "Kept a 14-day learning streak" },
  { id: "streak_30",    label: "Month Strong",    icon: "💎", description: "Kept a 30-day learning streak" },
  // — XP / earnings —
  { id: "xp_50",        label: "First $2.50",     icon: "💰", description: "Earned 50 XP ($2.50)" },
  { id: "xp_100",       label: "First $5",        icon: "💵", description: "Earned 100 XP ($5.00)" },
  { id: "xp_500",       label: "High Earner",     icon: "🤑", description: "Earned 500 XP ($25.00)" },
  { id: "first_payout", label: "Cashed Out",      icon: "💸", description: "Requested your first payout" },
  // — Path completion —
  { id: "first_path",   label: "Path Complete",   icon: "🏆", description: "Completed all lessons in a learning path" },
  { id: "paths_2",      label: "Double Down",     icon: "🗺️", description: "Completed 2 learning paths" },
  { id: "paths_3",      label: "Trailblazer",     icon: "🌟", description: "Completed 3 learning paths" },
  // — Perfect play —
  { id: "perfect_lesson", label: "Perfect Lesson", icon: "⭐", description: "Completed a lesson without losing any hearts" },
  { id: "perfect_3",    label: "Flawless x3",     icon: "✨", description: "Completed 3 lessons without losing any hearts" },
  { id: "perfect_5",    label: "Untouchable",     icon: "👑", description: "Completed 5 lessons without losing any hearts" },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    path: {
                      include: {
                        modules: {
                          where: { isActive: true },
                          include: {
                            lessons: {
                              where: { isActive: true },
                              select: { id: true },
                            },
                          },
                        },
                      },
                    },
                    lessons: {
                      where: { isActive: true },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
        payoutRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [totalPayoutXpAgg, totalEarningsAgg] = await Promise.all([
      prisma.payoutRequest.aggregate({
        where: { userId, status: { not: "rejected" } },
        _sum: { xpAmount: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { userId, status: { in: ["approved", "completed"] } },
        _sum: { dollarAmount: true },
      }),
    ]);

    const totalPayoutXp = totalPayoutXpAgg._sum.xpAmount ?? 0;
    const totalEarnings = Math.floor((totalEarningsAgg._sum.dollarAmount ?? 0) * 100) / 100;

    const availableXp = user.totalXp - totalPayoutXp;
    const availableBalance = Math.floor(availableXp * 0.05 * 100) / 100;

    const completedLessonIds = new Set(user.progress.map((p) => p.lessonId));

    // Badges previously earned and stored in the DB — these never go away
    let storedBadgeIds: string[] = [];
    try {
      storedBadgeIds = JSON.parse(user.earnedBadges ?? "[]");
    } catch {
      storedBadgeIds = [];
    }
    const persistedBadgeIds = new Set<string>(storedBadgeIds);

    // Dynamically compute badges earned right now
    const freshBadgeIds = new Set<string>();

    // Lesson milestones
    const lessonCount = completedLessonIds.size;
    if (lessonCount >= 1)  freshBadgeIds.add("first_lesson");
    if (lessonCount >= 5)  freshBadgeIds.add("lessons_5");
    if (lessonCount >= 10) freshBadgeIds.add("lessons_10");
    if (lessonCount >= 25) freshBadgeIds.add("lessons_25");
    if (lessonCount >= 50) freshBadgeIds.add("lessons_50");

    // Streak milestones
    if (user.streak >= 3)  freshBadgeIds.add("streak_3");
    if (user.streak >= 7)  freshBadgeIds.add("streak_7");
    if (user.streak >= 14) freshBadgeIds.add("streak_14");
    if (user.streak >= 30) freshBadgeIds.add("streak_30");

    // XP milestones (total ever earned)
    if (user.totalXp >= 50)  freshBadgeIds.add("xp_50");
    if (user.totalXp >= 100) freshBadgeIds.add("xp_100");
    if (user.totalXp >= 500) freshBadgeIds.add("xp_500");

    // Payout requested at least once
    if (user.payoutRequests.length > 0) freshBadgeIds.add("first_payout");

    // Path completion — count how many paths the user has fully completed
    const checkedPaths = new Set<string>();
    let completedPathCount = 0;
    for (const p of user.progress) {
      const path = p.lesson?.module?.path;
      if (!path || checkedPaths.has(path.id)) continue;
      checkedPaths.add(path.id);
      const allPathLessonIds = path.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (allPathLessonIds.length > 0 && allPathLessonIds.every((id) => completedLessonIds.has(id))) {
        completedPathCount++;
      }
    }
    if (completedPathCount >= 1) freshBadgeIds.add("first_path");
    if (completedPathCount >= 2) freshBadgeIds.add("paths_2");
    if (completedPathCount >= 3) freshBadgeIds.add("paths_3");

    // Perfect play milestones
    const perfectCount = user.progress.filter((p) => p.crownLevel >= 2).length;
    if (perfectCount >= 1) freshBadgeIds.add("perfect_lesson");
    if (perfectCount >= 3) freshBadgeIds.add("perfect_3");
    if (perfectCount >= 5) freshBadgeIds.add("perfect_5");

    // Merge: union of stored (permanent) + freshly earned badges
    const earnedBadgeIds = new Set<string>([...persistedBadgeIds, ...freshBadgeIds]);

    // If any new badges were just earned, persist them so they stick permanently
    const newlyEarned = [...freshBadgeIds].filter((id) => !persistedBadgeIds.has(id));
    if (newlyEarned.length > 0) {
      const updatedBadges = [...earnedBadgeIds];
      prisma.user.update({
        where: { id: userId },
        data: { earnedBadges: JSON.stringify(updatedBadges) },
      }).catch(() => {});
    }

    const badges = BADGE_DEFS.map((b) => ({ ...b, earned: earnedBadgeIds.has(b.id) }));

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        caseNumber: user.caseNumber,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        totalXp: user.totalXp,
        hearts: user.hearts,
        streak: user.streak,
        streakFreezes: user.streakFreezes,
        lastFreezeUsedAt: user.lastFreezeUsedAt,
        lessonsCompleted: user.progress.length,
        availableXp,
        availableBalance,
        totalEarnings,
        payoutRequests: user.payoutRequests,
        badges,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
