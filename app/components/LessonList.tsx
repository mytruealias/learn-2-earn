"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircleIcon, ChevronRightIcon } from "./icons";

interface Lesson {
  id: string;
  title: string;
  xpReward: number;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LessonListProps {
  modules: Module[];
}

const colors = ["var(--accent-green)", "var(--accent-blue)", "var(--accent-purple)", "var(--accent-gold)", "var(--accent-red)"];

export default function LessonList({ modules }: LessonListProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userId = localStorage.getItem("l2e_user_id");
    if (!userId) return;

    fetch("/api/progress/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.completedLessonIds) {
          setCompletedIds(new Set(data.completedLessonIds));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {modules.map((mod, modIdx) => (
        <section key={mod.id}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-color)",
          }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-green)",
              backgroundColor: "rgba(59,158,255,0.12)",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
            }}>
              Unit {modIdx + 1}
            </div>
            <h2 style={{
              fontSize: "1rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              letterSpacing: "0.02em",
            }}>{mod.title}</h2>
          </div>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {mod.lessons.map((lesson, lessonIdx) => {
              const done = completedIds.has(lesson.id);
              const color = colors[(modIdx * 3 + lessonIdx) % colors.length];

              return (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                  <div className="cyber-card" style={{
                    padding: "0.85rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    borderLeft: `3px solid ${done ? "var(--accent-green)" : color}`,
                    opacity: done ? 0.8 : 1,
                  }}>
                    <div style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      minWidth: "24px",
                    }}>
                      {lessonIdx + 1}
                    </div>
                    {done ? (
                      <div style={{
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "var(--accent-green)",
                      }}>
                        <CheckCircleIcon size={22} color="var(--accent-green)" />
                      </div>
                    ) : (
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: `2px solid ${color}`,
                        flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        color: done ? "var(--text-secondary)" : "var(--text-primary)",
                        letterSpacing: "0.01em",
                      }}>
                        {lesson.title}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      color: done ? "var(--accent-green)" : color,
                      flexShrink: 0,
                      background: done ? "rgba(88,204,2,0.1)" : `${color}15`,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}>
                      {done ? (
                        <>
                          <CheckCircleIcon size={11} color="var(--accent-green)" />
                          Done
                        </>
                      ) : (
                        `+${lesson.xpReward} XP`
                      )}
                    </div>
                    <div style={{
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}>
                      <ChevronRightIcon size={18} color="var(--text-muted)" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
