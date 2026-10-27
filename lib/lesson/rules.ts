import { validTimeZone } from "../learning-progression";
export function learningZone(userZone?: string | null, programZone?: string) {
  return userZone && validTimeZone(userZone)
    ? userZone
    : programZone && validTimeZone(programZone)
      ? programZone
      : "UTC";
}
export function localDay(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (key: string) => Number(parts.find((p) => p.type === key)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day")) / 86400000;
}
export function streakChange(
  last: Date | null,
  now: Date,
  zone: string,
  streak: number,
  freezes: number,
) {
  const gap = last ? localDay(now, zone) - localDay(last, zone) : Infinity;
  const freezeConsumed = gap === 2 && freezes > 0;
  const next = !last
    ? 1
    : gap <= 0
      ? Math.max(1, streak)
      : gap === 1 || freezeConsumed
        ? streak + 1
        : 1;
  return {
    streak: next,
    freezeConsumed,
    welcomeBack: !!last && gap > 1,
    freezes:
      gap <= 0
        ? freezes
        : freezeConsumed
          ? freezes - 1
          : next % 7 === 0
            ? Math.min(freezes + 1, 1)
            : freezes,
  };
}
export function calculateAward(
  base: number,
  answers: { correct: boolean | null }[],
) {
  let combo = 0,
    peak = 0;
  for (const a of answers)
    if (a.correct !== null) {
      combo = a.correct ? combo + 1 : 0;
      peak = Math.max(peak, combo);
    }
  const comboMultiplier = peak >= 5 ? 1.5 : peak >= 3 ? 1.25 : 1;
  // Preserve the historical actual credit, including all-instruction lessons.
  const perfect = answers.every((a) => a.correct !== false);
  const perfectRunBonus = perfect ? 1 : 0;
  return {
    baseXp: base,
    comboMultiplier,
    perfectRunBonus,
    xpAwarded: Math.round(base * comboMultiplier) + perfectRunBonus,
    perfect,
  };
}
export function nextReview(
  now: Date,
  missed: number,
  previousSuccesses: number,
) {
  const successes = missed ? 0 : previousSuccesses + 1;
  const days = missed ? 1 : successes === 1 ? 3 : successes === 2 ? 7 : 14;
  return {
    successes,
    dueAt: new Date(now.getTime() + days * 86400000),
    reason: missed
      ? "A question was missed in your latest completed attempt. Review after one day."
      : `Your latest completed attempt had no missed questions. Review after ${days} days.`,
  };
}
export const badgeDefinitions = [
  { id: "first_lesson", label: "First lesson" },
  { id: "streak_3", label: "3 learning days" },
  { id: "streak_7", label: "7 learning days" },
  { id: "first_path", label: "Path complete" },
  { id: "perfect_lesson", label: "Every answer correct" },
  { id: "first_practice", label: "Practice started" },
];
export function readIds(value: string): string[] {
  try {
    const a: unknown = JSON.parse(value);
    return Array.isArray(a)
      ? a.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
