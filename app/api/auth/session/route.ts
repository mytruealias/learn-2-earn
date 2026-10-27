import { rewardSummary } from "@/lib/rewards/accounting";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  getUserIdFromRequest,
  revokeUserSession,
  clearLearnerCookies,
  sameOriginError,
} from "@/lib/user-session";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";

interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const BADGE_DEFS: BadgeDefinition[] = [
  // — Lesson milestones —
  {
    id: "first_lesson",
    label: "First Lesson",
    icon: "🎓",
    description: "Completed your first lesson",
  },
  {
    id: "lessons_5",
    label: "Quick Start",
    icon: "🚀",
    description: "Completed 5 lessons",
  },
  {
    id: "lessons_10",
    label: "Study Habit",
    icon: "📚",
    description: "Completed 10 lessons",
  },
  {
    id: "lessons_25",
    label: "Committed",
    icon: "💪",
    description: "Completed 25 lessons",
  },
  {
    id: "lessons_50",
    label: "Scholar",
    icon: "🎖️",
    description: "Completed 50 lessons",
  },
  // — Streak milestones —
  {
    id: "streak_3",
    label: "3-Day Streak",
    icon: "🔥",
    description: "Kept a 3-day learning streak",
  },
  {
    id: "streak_7",
    label: "7-Day Streak",
    icon: "⚡",
    description: "Kept a 7-day learning streak",
  },
  {
    id: "streak_14",
    label: "Two Weeks",
    icon: "🌊",
    description: "Kept a 14-day learning streak",
  },
  {
    id: "streak_30",
    label: "Month Strong",
    icon: "💎",
    description: "Kept a 30-day learning streak",
  },
  // — XP / earnings —
  {
    id: "xp_50",
    label: "50 XP milestone",
    icon: "💰",
    description: "Earned 50 learning XP",
  },
  {
    id: "xp_100",
    label: "100 XP milestone",
    icon: "💵",
    description: "Earned 100 learning XP",
  },
  {
    id: "xp_500",
    label: "500 XP milestone",
    icon: "🤑",
    description: "Earned 500 learning XP",
  },
  {
    id: "first_payout",
    label: "First request",
    icon: "💸",
    description: "Requested your first payout",
  },
  // — Path completion —
  {
    id: "first_path",
    label: "Path Complete",
    icon: "🏆",
    description: "Completed all lessons in a learning path",
  },
  {
    id: "paths_2",
    label: "Double Down",
    icon: "🗺️",
    description: "Completed 2 learning paths",
  },
  {
    id: "paths_3",
    label: "Trailblazer",
    icon: "🌟",
    description: "Completed 3 learning paths",
  },
  // — Perfect play —
  {
    id: "perfect_lesson",
    label: "Perfect Lesson",
    icon: "⭐",
    description: "Completed a lesson without losing any hearts",
  },
  {
    id: "perfect_3",
    label: "Flawless x3",
    icon: "✨",
    description: "Completed 3 lessons without losing any hearts",
  },
  {
    id: "perfect_5",
    label: "Untouchable",
    icon: "👑",
    description: "Completed 5 lessons without losing any hearts",
  },
];

const Schema = z.object({ userId: z.string().min(1).max(120).optional() });

/** Navigation needs a small session description, never payout/contact records. */
export async function GET(req: Request) {
  try {
    const id = await getUserIdFromRequest(req);
    const user = id
      ? await prisma.user.findUnique({
          where: { id },
          select: { id: true, email: true },
        })
      : null;
    return apiOk(
      {
        user: user
          ? { id: user.id, kind: user.email ? "account" : "guest" }
          : null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return apiServerError(
      "auth/session-read",
      new Error("Session could not be checked."),
    );
  }
}
export async function DELETE(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    await revokeUserSession(req);
    const res = apiOk(
      {},
      { headers: { "Cache-Control": "private, no-store" } },
    );
    clearLearnerCookies(res);
    return res;
  } catch {
    return apiServerError(
      "auth/logout",
      new Error("Sign out could not be confirmed. Please try again."),
    );
  }
}

export async function POST(req: Request) {
  try {
    // Identity comes ONLY from the signed session cookie. A body userId, if
    // sent, is treated as a sanity check — it must match the cookie. We do
    // NOT accept a body userId as a fallback identity, since that would let
    // anyone read any user's profile just by guessing the userId.
    const sessionUserId = await getUserIdFromRequest(req);
    if (!sessionUserId) {
      return apiError("unauthorized", "Not signed in.", 401);
    }

    let bodyUserId: string | undefined;
    try {
      const raw = await req.text();
      if (raw && raw.trim()) {
        const parsed = Schema.safeParse(JSON.parse(raw));
        if (parsed.success) bodyUserId = parsed.data.userId;
      }
    } catch {
      // ignore — body was missing or malformed
    }

    if (bodyUserId && sessionUserId !== bodyUserId) {
      return apiError(
        "forbidden",
        "Session does not match requested user.",
        403,
      );
    }

    const userId = sessionUserId;

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
        payoutRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!user) {
      return apiError("not_found", "User not found", 404);
    }

    const rewards = await prisma.$transaction(
      (tx) => rewardSummary(tx, userId),
      { isolationLevel: "RepeatableRead" },
    );
    const payoutRules = rewards.rules;
    const availableXp = rewards.availableXp;
    const availableBalance = rewards.reconciled
      ? Number(
          (await import("@/lib/rewards/money")).exactCents(
            availableXp,
            payoutRules.rate,
          ),
        ) / 100
      : null;
    const totalEarnings =
      rewards.paidCents === null ? null : Number(rewards.paidCents) / 100;

    const completedLessonIds = new Set(user.progress.map((p) => p.lessonId));

    let storedBadgeIds: string[] = [];
    try {
      storedBadgeIds = JSON.parse(user.earnedBadges ?? "[]");
    } catch {
      storedBadgeIds = [];
    }
    const persistedBadgeIds = new Set<string>(storedBadgeIds);
    const freshBadgeIds = new Set<string>();

    const lessonCount = completedLessonIds.size;
    if (lessonCount >= 1) freshBadgeIds.add("first_lesson");
    if (lessonCount >= 5) freshBadgeIds.add("lessons_5");
    if (lessonCount >= 10) freshBadgeIds.add("lessons_10");
    if (lessonCount >= 25) freshBadgeIds.add("lessons_25");
    if (lessonCount >= 50) freshBadgeIds.add("lessons_50");

    if (user.streak >= 3) freshBadgeIds.add("streak_3");
    if (user.streak >= 7) freshBadgeIds.add("streak_7");
    if (user.streak >= 14) freshBadgeIds.add("streak_14");
    if (user.streak >= 30) freshBadgeIds.add("streak_30");

    if (user.totalXp >= 50) freshBadgeIds.add("xp_50");
    if (user.totalXp >= 100) freshBadgeIds.add("xp_100");
    if (user.totalXp >= 500) freshBadgeIds.add("xp_500");

    if (user.payoutRequests.length > 0) freshBadgeIds.add("first_payout");

    const checkedPaths = new Set<string>();
    let completedPathCount = 0;
    for (const p of user.progress) {
      const path = p.lesson?.module?.path;
      if (!path || checkedPaths.has(path.id)) continue;
      checkedPaths.add(path.id);
      const allPathLessonIds = path.modules.flatMap((m) =>
        m.lessons.map((l) => l.id),
      );
      if (
        allPathLessonIds.length > 0 &&
        allPathLessonIds.every((id) => completedLessonIds.has(id))
      ) {
        completedPathCount++;
      }
    }
    if (completedPathCount >= 1) freshBadgeIds.add("first_path");
    if (completedPathCount >= 2) freshBadgeIds.add("paths_2");
    if (completedPathCount >= 3) freshBadgeIds.add("paths_3");

    const perfectCount = user.progress.filter((p) => p.crownLevel >= 2).length;
    if (perfectCount >= 1) freshBadgeIds.add("perfect_lesson");
    if (perfectCount >= 3) freshBadgeIds.add("perfect_3");
    if (perfectCount >= 5) freshBadgeIds.add("perfect_5");

    const earnedBadgeIds = new Set<string>([
      ...persistedBadgeIds,
      ...freshBadgeIds,
    ]);
    const newlyEarned = [...freshBadgeIds].filter(
      (id) => !persistedBadgeIds.has(id),
    );
    if (newlyEarned.length > 0) {
      const updatedBadges = [...earnedBadgeIds];
      prisma.user
        .update({
          where: { id: userId },
          data: { earnedBadges: JSON.stringify(updatedBadges) },
        })
        .catch(() => {});
    }

    const badges = BADGE_DEFS.map((b) => ({
      ...b,
      earned: earnedBadgeIds.has(b.id),
    }));

    return apiOk({
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
        payoutRequests: rewards.payouts,
        rewards,
        badges,
        payoutRules,
      },
    });
  } catch (error) {
    return apiServerError("auth/session", error);
  }
}
