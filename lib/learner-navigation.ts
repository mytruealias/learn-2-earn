/** Deliberately small allowlist; never forward arbitrary `next` URLs. */
export function safeLearnerDestination(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 300 ||
    /[\u0000-\u0020\\%]/.test(value)
  )
    return "/app";
  if (
    /^\/(?:app|lifeline|profile|paths\/[a-zA-Z0-9_-]+|lesson\/[a-zA-Z0-9_-]+)$/.test(
      value,
    )
  )
    return value;
  return value === "/profile?tab=earnings" ? value : "/app";
}
export const LEARNING_GOALS = {
  explore: "Explore at my own pace",
  short: "Make time for a short lesson",
  routine: "Build a learning routine",
} as const;
