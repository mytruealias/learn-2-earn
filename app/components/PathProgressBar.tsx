"use client";
import { ProgressIndicator } from "./ui";
export default function PathProgressBar({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  return total > 0 ? (
    <ProgressIndicator label="Path progress" max={total} value={completed} />
  ) : (
    <p>
      No lessons are ready to start in this pathway yet. Your saved history is
      unchanged.
    </p>
  );
}
