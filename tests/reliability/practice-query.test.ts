import { expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ user: { findUniqueOrThrow: vi.fn() }, lesson: { findMany: vi.fn() }, progress: { findMany: vi.fn() }, lessonReview: { findMany: vi.fn() }, lessonAttempt: { count: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ default: db }));
import { practiceData } from "@/lib/lesson/practice";
it("loads cards only for the signed-in learner's saved completion/review IDs", async () => {
    db.user.findUniqueOrThrow.mockResolvedValue({ learningTimezone: "UTC", streak: 0, earnedBadges: "[]" });
    db.lesson.findMany.mockResolvedValue([]);
    db.progress.findMany.mockResolvedValue([{ lessonId: "synthetic-completed", completedAt: new Date(), missedCardIds: "[]" }]);
    db.lessonReview.findMany.mockResolvedValue([{ lessonId: "synthetic-reviewed" }]);
    db.lessonAttempt.count.mockResolvedValue(0);
    const result = await practiceData("synthetic-learner");
    expect(db.lesson.findMany.mock.calls[0][0].where.id.in).toEqual(["synthetic-completed", "synthetic-reviewed"]);
    expect(db.progress.findMany.mock.calls[0][0].where.userId).toBe("synthetic-learner");
    expect(result.firstCompletions).toBe(1);
    expect(result.items).toEqual([]);
});
