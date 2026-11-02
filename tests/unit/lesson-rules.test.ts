import { describe, expect, it } from "vitest";
import { adaptCard } from "../../lib/lesson/cards";
import {
  calculateAward,
  learningZone,
  localDay,
  nextReview,
  streakChange,
} from "../../lib/lesson/rules";
import { authoredCards } from "../../scripts/audit-lesson-cards";
describe("card adapters preserve authored curriculum", () => {
  it("validates every authored definition without changing answer formats", () => {
    const cards = authoredCards();
    expect(cards.length).toBe(1502);
    const results = cards.map(adaptCard);
    expect(results.filter((r) => !r.ok)).toEqual([]);
    expect(
      new Set(results.flatMap((r) => (r.ok ? [r.card.public.kind] : []))),
    ).toEqual(new Set(["teaching", "question", "scenario", "reflection"]));
  });
  it("makes unsupported and malformed cards recoverable rather than completable", () => {
    for (const card of [
      { type: "OTHER" },
      { type: "MULTIPLE_CHOICE", choicesJson: "{" },
      { type: "TRUE_FALSE", choicesJson: '["Yes","No"]', answerJson: '"Yes"' },
      { type: "MULTIPLE_CHOICE", choicesJson: '["A","A"]', answerJson: '"A"' },
      { type: "MULTIPLE_CHOICE", choicesJson: '["A","B"]', answerJson: '"C"' },
      { type: "INFO", subtype: "UNSUPPORTED" },
    ])
      expect(adaptCard({ id: "a", prompt: "Prompt", ...card }).ok).toBe(false);
  });
});
describe("nonfinancial review and local calendar rules", () => {
  it("keeps actual historic combo economics and perfect credit from one calculation", () => {
    expect(calculateAward(10, Array(5).fill({ correct: true }))).toMatchObject({
      xpAwarded: 16,
      comboMultiplier: 1.5,
      perfectRunBonus: 1,
    });
    expect(
      calculateAward(10, [
        { correct: false },
        ...Array(3).fill({ correct: true }),
      ]),
    ).toMatchObject({
      xpAwarded: 13,
      comboMultiplier: 1.25,
      perfectRunBonus: 0,
    });
    expect(calculateAward(10, [{ correct: null }]).xpAwarded).toBe(11);
  });
  it("uses stored, program then UTC timezone without trusting a device", () => {
    expect(learningZone("America/Chicago", "Europe/London")).toBe(
      "America/Chicago",
    );
    expect(learningZone(null, "Europe/London")).toBe("Europe/London");
    expect(learningZone("invalid", "invalid")).toBe("UTC");
  });
  it("handles midnight independently of elapsed hours", () => {
    const a = new Date("2026-10-27T04:59:00Z"),
      b = new Date("2026-10-27T05:01:00Z");
    expect(
      localDay(b, "America/Chicago") - localDay(a, "America/Chicago"),
    ).toBe(1);
    expect(streakChange(a, b, "America/Chicago", 2, 1).streak).toBe(3);
  });
  it("handles the spring 23-hour day and autumn 25-hour day", () => {
    for (const [a, b] of [
      ["2026-03-08T06:30:00Z", "2026-03-09T05:30:00Z"],
      ["2026-11-01T05:30:00Z", "2026-11-02T06:30:00Z"],
    ])
      expect(
        streakChange(new Date(a), new Date(b), "America/Chicago", 2, 0).streak,
      ).toBe(3);
  });
  it("initializes the first learning day and keeps duplicate same-day activity stable", () => {
    const now = new Date("2026-10-27T10:00:00Z");
    expect(streakChange(null, now, "UTC", 0, 1).streak).toBe(1);
    expect(streakChange(now, now, "UTC", 3, 0)).toMatchObject({
      streak: 3,
      freezes: 0,
      freezeConsumed: false,
    });
  });
  it("welcomes returning learners and preserves the existing free freeze policy", () => {
    const now = new Date("2026-10-27T10:00:00Z");
    expect(
      streakChange(new Date("2026-10-25T10:00:00Z"), now, "UTC", 4, 1),
    ).toMatchObject({
      streak: 5,
      freezeConsumed: true,
      welcomeBack: true,
      freezes: 0,
    });
    expect(
      streakChange(new Date("2026-10-20T10:00:00Z"), now, "UTC", 4, 0),
    ).toMatchObject({ streak: 1, welcomeBack: true });
  });
  it("documents 1/3/7/14-day intervals and resets after a missed question", () => {
    const now = new Date("2026-10-27T00:00:00Z");
    for (const [missed, successes, days] of [
      [1, 5, 1],
      [0, 0, 3],
      [0, 1, 7],
      [0, 2, 14],
      [0, 10, 14],
    ])
      expect(
        nextReview(now, missed, successes).dueAt.getTime() - now.getTime(),
      ).toBe(days * 86400000);
    expect(nextReview(now, 1, 5).successes).toBe(0);
  });
});
