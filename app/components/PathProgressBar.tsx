"use client";
import { ProgressIndicator } from "./ui";
export default function PathProgressBar({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  return (
    <ProgressIndicator label="Path progress" max={total} value={completed} />
  );
}
