"use client";
import { useEffect, useState } from "react";
import LessonList, { type ModuleSummary } from "./LessonList";
import PathProgressBar from "./PathProgressBar";
import { ButtonLink, Card, EmptyState, ErrorState, Skeleton } from "./ui";
import styles from "../paths/[pathSlug]/path.module.css";
export default function PathLearning({
  modules,
}: {
  modules: ModuleSummary[];
}) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [completed, setCompleted] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState("loading");
    fetch("/api/progress/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok || !Array.isArray(data.completedLessonIds))
          throw new Error();
        return data.completedLessonIds;
      })
      .then((ids) => {
        if (active) {
          setCompleted(ids);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const lessons = modules.flatMap((m) => m.lessons);
  const ids = new Set(completed);
  const next = lessons.find((lesson) => !ids.has(lesson.id));
  const count = lessons.filter((lesson) => ids.has(lesson.id)).length;
  if (!lessons.length)
    return (
      <Card>
        <EmptyState
          title="Lessons are on their way"
          action={<ButtonLink href="/app">Explore other paths</ButtonLink>}
        >
          There are no available lessons in this path yet. You can choose
          another path.
        </EmptyState>
      </Card>
    );
  return (
    <div className={styles.learning}>
      <Card className={styles.progressCard}>
        <h2>Your progress</h2>
        {state === "loading" ? (
          <Skeleton label="Loading your path progress" />
        ) : state === "error" ? (
          <ErrorState onRetry={() => setAttempt((n) => n + 1)}>
            Your progress could not load. You can still open a lesson, or try
            again.
          </ErrorState>
        ) : (
          <>
            <PathProgressBar total={lessons.length} completed={count} />
            <p>
              {next
                ? count
                  ? "Pick up with your next lesson."
                  : "One lesson is a good place to begin."
                : "You’ve completed this path. Revisit any lesson when it helps."}
            </p>
            <ButtonLink href={`/lesson/${(next || lessons[0]).id}`}>
              {next
                ? count
                  ? "Continue learning"
                  : "Start learning"
                : "Review this path"}
            </ButtonLink>
          </>
        )}
      </Card>
      <LessonList
        modules={modules}
        completedIds={completed}
        nextId={state === "ready" ? next?.id : undefined}
        progressKnown={state === "ready"}
      />
    </div>
  );
}
