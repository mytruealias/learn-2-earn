"use client";
import Link from "next/link";
import { CheckCircleIcon, ChevronRightIcon } from "./icons";
import { StatusBadge } from "./ui";
import styles from "../paths/[pathSlug]/path.module.css";
export interface LessonSummary {
  id: string;
  title: string;
  xpReward: number;
  order: number;
  lessonType?: string;
  estimatedMinutes?: number;
}
export interface ModuleSummary {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
}
export default function LessonList({
  modules,
  completedIds,
  nextId,
  progressKnown,
}: {
  modules: ModuleSummary[];
  completedIds: string[];
  nextId?: string;
  progressKnown: boolean;
}) {
  const completed = new Set(completedIds);
  return (
    <div className={styles.units}>
      {modules.map((mod, index) => (
        <section key={mod.id} aria-labelledby={`unit-${mod.id}`}>
          <div className={styles.unitHeading}>
            <span className={styles.unitNumber}>Unit {index + 1}</span>
            <h2 id={`unit-${mod.id}`}>{mod.title}</h2>
          </div>
          <ol className={styles.lessonList}>
            {mod.lessons.map((lesson, lessonIndex) => {
              const done = completed.has(lesson.id),
                next = nextId === lesson.id;
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/lesson/${lesson.id}`}
                    className={`${styles.lesson} ${next ? styles.lessonCurrent : ""}`}
                  >
                    <span
                      className={`${styles.lessonNumber} ${done ? styles.done : ""}`}
                      aria-hidden="true"
                    >
                      {done ? <CheckCircleIcon size={20} /> : lessonIndex + 1}
                    </span>
                    <span className={styles.lessonBody}>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      <span className={styles.lessonMeta}>
                        {done ? (
                          <span>Complete · Review anytime</span>
                        ) : (
                          <span>{lesson.xpReward} base XP</span>
                        )}
                        {!!lesson.estimatedMinutes && (
                          <span>{lesson.estimatedMinutes} min</span>
                        )}
                        {next && <StatusBadge>Up next</StatusBadge>}
                        {lesson.lessonType && lesson.lessonType !== "learn" && (
                          <StatusBadge tone="warning">
                            {lesson.lessonType === "capstone"
                              ? "Final challenge"
                              : "Checkpoint"}
                          </StatusBadge>
                        )}
                        {!progressKnown && (
                          <span className="sr-only">
                            Completion status unavailable
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={styles.arrow}>
                      <ChevronRightIcon />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
