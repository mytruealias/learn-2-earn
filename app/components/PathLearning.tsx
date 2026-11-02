"use client";
import { useEffect, useState } from "react";
import LessonList from "./LessonList";
import PathProgressBar from "./PathProgressBar";
import { Button, ButtonLink, Card, ErrorState, Skeleton } from "./ui";
import type { LearningUnit } from "@/lib/learning-progression";
import styles from "../paths/[pathSlug]/path.module.css";
export default function PathLearning({ modules }: { modules: LearningUnit[] }) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading"),
    [completed, setCompleted] = useState<string[]>([]),
    [visits, setVisits] = useState<{ lessonId: string }[]>([]),
    [reviews, setReviews] = useState<string[]>([]),
    [attempt, setAttempt] = useState(0),
    [view, setView] = useState<"path" | "list">("path");
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
        if (active) {
          setCompleted(data.completedLessonIds);
          setVisits(data.visits || []);
          setReviews(data.reviewLessonIds || []);
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
  const lessons = modules.flatMap((m) => m.lessons).filter((l) => l.available),
    done = new Set(completed),
    count = lessons.filter((l) => done.has(l.id)).length,
    opened = visits
      .map((v) => lessons.find((l) => l.id === v.lessonId && !done.has(l.id)))
      .find(Boolean),
    next = opened || lessons.find((l) => !done.has(l.id)),
    review = lessons.find((l) => reviews.includes(l.id)) || lessons[0];
  return (
    <div className={styles.learning}>
      <aside className={styles.progressRail}>
        <Card className={styles.progressCard}>
          <h2>Your progress</h2>
          {state === "loading" ? (
            <Skeleton label="Loading your path progress" />
          ) : state === "error" ? (
            <ErrorState onRetry={() => setAttempt((n) => n + 1)}>
              Your progress could not load. You can still open a published
              lesson, or try again.
            </ErrorState>
          ) : (
            <>
              <PathProgressBar total={lessons.length} completed={count} />
              {lessons.length > 0 && (
                <>
                  <p>
                    {next
                      ? opened
                        ? "Pick up an unfinished lesson you opened before."
                        : "One lesson at a time. Every ready lesson is open to you."
                      : "You’ve completed every available lesson in this path. Review whenever it helps."}
                  </p>
                  <ButtonLink href={`/lesson/${(next || review).id}`}>
                    {next
                      ? count || opened
                        ? "Continue learning"
                        : "Start learning"
                      : "Review this path"}
                  </ButtonLink>
                </>
              )}
            </>
          )}
        </Card>
        <details className={styles.legend}>
          <summary>What the lesson states mean</summary>
          <p>
            Ready: available to start. In progress: opened, not completed.
            Completed: saved work. Review suggested: saved questions to revisit,
            when you want. Unavailable: content is being prepared.
          </p>
          <p>You can choose lessons in any order. Help is always available.</p>
        </details>
      </aside>
      <div className={styles.pathContent}>
        <div
          className={styles.viewSwitch}
          role="group"
          aria-label="Lesson view"
        >
          <Button
            variant="secondary"
            aria-pressed={view === "path"}
            disabled={state === "loading"}
            disabledReason="Wait while your progress loads."
            onClick={() => setView("path")}
          >
            Learning path
          </Button>
          <Button
            variant="secondary"
            aria-pressed={view === "list"}
            disabled={state === "loading"}
            disabledReason="Wait while your progress loads."
            onClick={() => setView("list")}
          >
            Linear list
          </Button>
        </div>
        <LessonList
          modules={modules}
          completedIds={completed}
          visitedIds={visits.map((v) => v.lessonId)}
          reviewIds={reviews}
          nextId={state === "ready" ? next?.id : undefined}
          progressKnown={state === "ready"}
          view={view}
        />
      </div>
    </div>
  );
}
