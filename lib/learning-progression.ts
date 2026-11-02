export interface LearningLesson {
  id: string;
  title: string;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  lessonType: string;
  available: boolean;
}
export interface LearningUnit {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: LearningLesson[];
}
export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  modules: LearningUnit[];
}
export interface SavedProgress {
  lessonId: string;
  completedAt: Date | string;
  missedCardIds: string;
}
export interface SavedVisit {
  lessonId: string;
  openedAt: Date | string;
}
export type LessonState =
  | "ready"
  | "in_progress"
  | "completed"
  | "review_suggested"
  | "unavailable";
export const STATE_LABELS: Record<LessonState, string> = {
  ready: "Ready",
  in_progress: "In progress",
  completed: "Completed",
  review_suggested: "Review suggested",
  unavailable: "Unavailable",
};
export function reviewSuggested(
  progress: Pick<SavedProgress, "missedCardIds">,
) {
  try {
    const ids: unknown = JSON.parse(progress.missedCardIds);
    return (
      Array.isArray(ids) &&
      ids.some((id) => typeof id === "string" && id.length > 0)
    );
  } catch {
    return false;
  }
}
export function lessonState(
  lesson: LearningLesson,
  completed: Set<string>,
  visited: Set<string>,
  reviews: Set<string>,
): LessonState {
  if (!lesson.available) return "unavailable";
  if (completed.has(lesson.id))
    return reviews.has(lesson.id) ? "review_suggested" : "completed";
  return visited.has(lesson.id) ? "in_progress" : "ready";
}
export function availableLessons(path: LearningPath) {
  return path.modules
    .flatMap((unit) => unit.lessons)
    .filter((lesson) => lesson.available);
}
export function pathProgress(path: LearningPath, completed: Set<string>) {
  const lessons = availableLessons(path);
  return {
    total: lessons.length,
    completed: lessons.filter((lesson) => completed.has(lesson.id)).length,
    preparing: path.modules
      .flatMap((unit) => unit.lessons)
      .filter((lesson) => !lesson.available).length,
  };
}
export function recommendLesson(
  paths: LearningPath[],
  progress: SavedProgress[],
  visits: SavedVisit[],
  selected: string[],
) {
  const entries = paths.flatMap((path) =>
    path.modules.flatMap((unit) =>
      unit.lessons
        .filter((l) => l.available)
        .map((lesson) => ({ path, unit, lesson })),
    ),
  );
  const done = new Set(progress.map((p) => p.lessonId));
  const unfinished = entries.filter((e) => !done.has(e.lesson.id));
  if (!entries.length) return null;
  const opened = [...visits]
    .sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt))
    .map((v) => unfinished.find((e) => e.lesson.id === v.lessonId))
    .find(Boolean);
  if (opened)
    return {
      ...opened,
      intent: "continue" as const,
      reason:
        "You opened this lesson and have not completed it yet. It opens from the beginning so you can take another look.",
    };
  const recent = [...progress]
    .sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt))
    .map((p) => entries.find((e) => e.lesson.id === p.lessonId)?.path)
    .find(Boolean);
  const following = recent && unfinished.find((e) => e.path.id === recent.id);
  if (following)
    return {
      ...following,
      intent: "continue" as const,
      reason: `The next available lesson in ${recent.title}, where you last completed a lesson.`,
    };
  const choice = unfinished.find((e) => selected.includes(e.path.id));
  if (choice)
    return {
      ...choice,
      intent: progress.length ? ("continue" as const) : ("start" as const),
      reason:
        "A next step from a pathway you kept in My paths. Every available pathway is still open to you.",
    };
  if (unfinished.length)
    return {
      ...unfinished[0],
      intent: progress.length ? ("continue" as const) : ("start" as const),
      reason: progress.length
        ? "A next step in an available pathway. Your earlier progress is still saved."
        : "A useful place to begin. You can choose any available lesson or pathway.",
    };
  const review =
    [...progress]
      .filter(reviewSuggested)
      .map((p) => entries.find((e) => e.lesson.id === p.lessonId))
      .find(Boolean) ||
    entries.find((e) => e.lesson.id === progress[0]?.lessonId) ||
    entries[0];
  return {
    ...review,
    intent: "review" as const,
    reason:
      "You have completed every currently available lesson. Revisit this one whenever it is useful.",
  };
}
export function validTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}
export function completedOnLocalDay(
  progress: { completedAt: Date | string }[],
  zone: string,
  now = new Date(),
) {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = format.format(now);
  return progress.filter((p) => format.format(new Date(p.completedAt)) === day)
    .length;
}
