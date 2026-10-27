"use client";
import Link from "next/link";
import { CheckCircleIcon, BookIcon } from "./icons";
import { StatusBadge } from "./ui";
import {
  lessonState,
  STATE_LABELS,
  type LearningUnit,
} from "@/lib/learning-progression";
import styles from "../paths/[pathSlug]/path.module.css";
export type ModuleSummary = LearningUnit;
export default function LessonList({
  modules,
  completedIds,
  visitedIds,
  reviewIds,
  nextId,
  progressKnown,
  view,
}: {
  modules: LearningUnit[];
  completedIds: string[];
  visitedIds: string[];
  reviewIds: string[];
  nextId?: string;
  progressKnown: boolean;
  view: "path" | "list";
}) {
  const completed = new Set(completedIds),
    visited = new Set(visitedIds),
    reviews = new Set(reviewIds);
  return (
    <div
      className={`${styles.units} ${view === "path" ? styles.pathMode : styles.linearMode}`}
      aria-label={
        view === "path" ? "Vertical learning path" : "Linear lesson list"
      }
    >
      {modules.map((unit, index) => {
        const available = unit.lessons.filter((l) => l.available),
          count = available.filter((l) => completed.has(l.id)).length;
        return (
          <section
            key={unit.id}
            aria-labelledby={`unit-${unit.id}`}
            className={styles.unit}
          >
            <header className={styles.unitHeading}>
              <span className={styles.landmark} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className={styles.eyebrow}>Unit {index + 1}</p>
                <h2 id={`unit-${unit.id}`}>{unit.title}</h2>
                {unit.description && (
                  <p className={styles.muted}>{unit.description}</p>
                )}
                <p className={styles.unitCount}>
                  {progressKnown
                    ? available.length
                      ? `${count} of ${available.length} available lessons complete`
                      : "No lessons ready to start in this unit"
                    : "Completion status is loading or unavailable"}
                </p>
              </div>
            </header>
            {unit.lessons.length ? (
              <ol className={styles.lessonList}>
                {unit.lessons.map((lesson, order) => {
                  const state = lessonState(
                      lesson,
                      completed,
                      visited,
                      reviews,
                    ),
                    done =
                      state === "completed" || state === "review_suggested",
                    known = progressKnown || state === "unavailable";
                  const content = (
                    <>
                      <span
                        className={`${styles.node} ${done ? styles.done : ""} ${nextId === lesson.id ? styles.currentNode : ""}`}
                        aria-hidden="true"
                      >
                        {done ? (
                          <CheckCircleIcon size={24} />
                        ) : (
                          <BookIcon size={22} />
                        )}
                      </span>
                      <span className={styles.lessonBody}>
                        <span className={styles.lessonOrder}>
                          Lesson {order + 1}
                        </span>
                        <span className={styles.lessonTitle}>
                          {lesson.title}
                        </span>
                        <span className={styles.lessonMeta}>
                          <StatusBadge
                            tone={
                              state === "unavailable"
                                ? "warning"
                                : done
                                  ? "success"
                                  : "info"
                            }
                          >
                            {known ? STATE_LABELS[state] : "Status unavailable"}
                          </StatusBadge>
                          {lesson.estimatedMinutes > 0 && (
                            <span>About {lesson.estimatedMinutes} min</span>
                          )}
                          {nextId === lesson.id && <span>Up next</span>}
                          {lesson.lessonType !== "learn" && (
                            <span>
                              {lesson.lessonType === "capstone"
                                ? "Final challenge"
                                : "Checkpoint"}
                            </span>
                          )}
                        </span>
                        <span className={styles.lessonExplanation}>
                          {state === "unavailable"
                            ? "The learning content is being prepared. Choose another lesson."
                            : !known
                              ? "You can open this lesson while progress is unavailable."
                              : state === "in_progress"
                                ? "You opened this lesson. It opens from the beginning until completed."
                                : state === "review_suggested"
                                  ? "Saved questions are marked to revisit. Review is optional."
                                  : state === "completed"
                                    ? "Your completion is saved. Review anytime."
                                    : "Available to start. You can choose any ready lesson."}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li
                      key={lesson.id}
                      className={styles.step}
                      data-lesson-state={known ? state : "unknown"}
                    >
                      {lesson.available ? (
                        <Link
                          href={`/lesson/${lesson.id}`}
                          className={`${styles.lesson} ${nextId === lesson.id ? styles.lessonCurrent : ""}`}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          className={`${styles.lesson} ${styles.unavailable}`}
                        >
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.emptyUnit}>
                No published lessons in this unit yet. Other units and Help
                remain available.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
