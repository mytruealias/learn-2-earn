import { describe, it, expect } from "vitest";
import {
  recommendLesson,
  pathProgress,
  lessonState,
  reviewSuggested,
  completedOnLocalDay,
  validTimeZone,
  type LearningPath,
  type LearningLesson,
} from "../../lib/learning-progression";
const lesson = (id: string, available = true): LearningLesson => ({
  id,
  title: id,
  available,
  order: 0,
  xpReward: 7,
  estimatedMinutes: 3,
  lessonType: "learn",
});
const paths: LearningPath[] = [
  {
    id: "p1",
    slug: "first",
    title: "First",
    description: "",
    icon: "",
    modules: [
      {
        id: "m1",
        title: "Unit",
        description: "",
        order: 0,
        lessons: [lesson("a"), lesson("b"), lesson("preparing", false)],
      },
    ],
  },
  {
    id: "p2",
    slug: "second",
    title: "Second",
    description: "",
    icon: "",
    modules: [
      {
        id: "m2",
        title: "Unit2",
        description: "",
        order: 0,
        lessons: [lesson("c")],
      },
    ],
  },
];
const saved = (id: string, missed = "[]", time = "2026-10-01T12:00:00Z") => ({
  lessonId: id,
  missedCardIds: missed,
  completedAt: time,
});
describe("honest progression and recommendations", () => {
  it("offers a real first step with no invented prerequisites", () => {
    expect(recommendLesson(paths, [], [], [])?.lesson.id).toBe("a");
    expect(recommendLesson(paths, [], [], [])?.intent).toBe("start");
  });
  it("prioritizes a genuinely opened unfinished lesson over selection and order", () => {
    expect(
      recommendLesson(
        paths,
        [saved("a")],
        [{ lessonId: "c", openedAt: new Date() }],
        ["p1"],
      )?.lesson.id,
    ).toBe("c");
  });
  it("continues a returning path without penalizing an old completion", () => {
    expect(
      recommendLesson(paths, [saved("a", "[]", "2025-01-01T00:00:00Z")], [], [])
        ?.lesson.id,
    ).toBe("b");
  });
  it("uses selected pathways when no saved activity identifies a next step", () => {
    expect(recommendLesson(paths, [], [], ["p2"])?.lesson.id).toBe("c");
  });
  it("does not recommend an unavailable lesson or make empty curriculum all-complete", () => {
    expect(
      recommendLesson([{ ...paths[0], modules: [] }], [], [], []),
    ).toBeNull();
    expect(pathProgress(paths[0], new Set(["a", "removed"]))).toEqual({
      total: 2,
      completed: 1,
      preparing: 1,
    });
  });
  it("offers optional review only after all available lessons are complete", () => {
    const rec = recommendLesson(
      paths,
      [saved("c"), saved("b"), saved("a", '["card-a"]')],
      [],
      [],
    );
    expect(rec?.intent).toBe("review");
    expect(rec?.lesson.id).toBe("a");
  });
  it("derives all five lesson states from availability and actual saved records", () => {
    expect(lessonState(lesson("a"), new Set(), new Set(), new Set())).toBe(
      "ready",
    );
    expect(lessonState(lesson("a"), new Set(), new Set(["a"]), new Set())).toBe(
      "in_progress",
    );
    expect(lessonState(lesson("a"), new Set(["a"]), new Set(), new Set())).toBe(
      "completed",
    );
    expect(
      lessonState(lesson("a"), new Set(["a"]), new Set(), new Set(["a"])),
    ).toBe("review_suggested");
    expect(
      lessonState(lesson("a", false), new Set(["a"]), new Set(), new Set()),
    ).toBe("unavailable");
  });
  it("never invents review needs from elapsed time or malformed data", () => {
    expect(reviewSuggested(saved("a", "invalid"))).toBe(false);
    expect(reviewSuggested(saved("a", "{}"))).toBe(false);
    expect(reviewSuggested(saved("a"))).toBe(false);
  });
});
describe("small goals use server timestamps and local calendar days", () => {
  it("counts actual completions across a UTC date boundary in Chicago", () => {
    const rows = [
      { completedAt: "2026-10-27T02:00:00Z" },
      { completedAt: "2026-10-27T18:00:00Z" },
    ];
    expect(
      completedOnLocalDay(
        rows,
        "America/Chicago",
        new Date("2026-10-27T19:00:00Z"),
      ),
    ).toBe(1);
    expect(
      completedOnLocalDay(rows, "UTC", new Date("2026-10-27T19:00:00Z")),
    ).toBe(2);
  });
  it("handles the repeated hour at daylight saving change without changing completion counts", () => {
    expect(
      completedOnLocalDay(
        [
          { completedAt: "2026-11-01T06:30:00Z" },
          { completedAt: "2026-11-01T07:30:00Z" },
        ],
        "America/Chicago",
        new Date("2026-11-01T18:00:00Z"),
      ),
    ).toBe(2);
    expect(validTimeZone("invented/time")).toBe(false);
    expect(validTimeZone("UTC")).toBe(true);
  });
});
