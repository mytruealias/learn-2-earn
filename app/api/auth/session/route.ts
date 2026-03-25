import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const BADGE_DEFS: BadgeDefinition[] = [
  { id: "first_lesson", label: "First Lesson", icon: "🎓", description: "Completed your first lesson" },
  { id: "streak_3", label: "3-Day Streak", icon: "🔥", description: "Kept a 3-day learning streak" },
  { id: "streak_7", label: "7-Day Streak", icon: "⚡", description: "Kept a 7-day learning streak" },
  { id: "first_path", label: "First Path Complete", icon: "🏆", description: "Completed all lessons in a learning path" },
  { id: "perfect_lesson", label: "Perfect Lesson", icon: "⭐", description: "Completed a lesson without losing any hearts" },
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

    const totalPayoutXp = user.payoutRequests
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.xpAmount, 0);

    const availableXp = user.totalXp - totalPayoutXp;
    const availableBalance = Math.floor((availableXp / 3) * 100) / 100;

    const completedLessonIds = new Set(user.progress.map((p) => p.lessonId));

    const earnedBadgeIds = new Set<string>();

    if (completedLessonIds.size >= 1) earnedBadgeIds.add("first_lesson");
    if (user.streak >= 3) earnedBadgeIds.add("streak_3");
    if (user.streak >= 7) earnedBadgeIds.add("streak_7");

    const checkedPaths = new Set<string>();
    let firstPathComplete = false;
    for (const p of user.progress) {
      const path = p.lesson?.module?.path;
      if (!path || checkedPaths.has(path.id)) continue;
      checkedPaths.add(path.id);
      const allPathLessonIds = path.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (allPathLessonIds.length > 0 && allPathLessonIds.every((id) => completedLessonIds.has(id))) {
        firstPathComplete = true;
        break;
      }
    }
    if (firstPathComplete) earnedBadgeIds.add("first_path");

    if (user.progress.some((p) => p.crownLevel >= 2)) {
      earnedBadgeIds.add("perfect_lesson");
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
        lessonsCompleted: user.progress.length,
        availableXp,
        availableBalance,
        totalEarnings: Math.floor((user.totalXp / 3) * 100) / 100,
        payoutRequests: user.payoutRequests,
        badges,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
