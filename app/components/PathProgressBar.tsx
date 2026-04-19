"use client";

import { useState, useEffect } from "react";

interface LessonRef {
  id: string;
}

interface ModuleRef {
  lessons: LessonRef[];
}

interface PathProgressBarProps {
  allLessonIds: string[];
}

export default function PathProgressBar({ allLessonIds }: PathProgressBarProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("l2e_user_id");
    if (!userId || allLessonIds.length === 0) {
      setLoaded(true);
      return;
    }

    fetch("/api/progress/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.completedLessonIds) {
          const completedIds = new Set<string>(data.completedLessonIds);
          const count = allLessonIds.filter((id) => completedIds.has(id)).length;
          setCompletedCount(count);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [allLessonIds]);

  if (!loaded || allLessonIds.length === 0) return null;

  const total = allLessonIds.length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius)",
      padding: "1rem 1.25rem",
      marginBottom: "1.5rem",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.6rem",
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.85rem",
          color: "var(--text-primary)",
          fontWeight: 700,
        }}>
          Path progress
        </span>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
        }}>
          {completedCount} / {total} lessons
        </span>
      </div>
      <div style={{
        height: "10px",
        backgroundColor: "rgba(15,25,35,0.06)",
        borderRadius: "var(--radius-pill)",
        overflow: "hidden",
        marginBottom: "0.5rem",
      }}>
        <div style={{
          height: "100%",
          backgroundColor: "var(--accent-green)",
          borderRadius: "var(--radius-pill)",
          width: `${pct}%`,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{
        fontSize: "0.78rem",
        color: pct === 100 ? "var(--accent-green)" : "var(--text-secondary)",
        fontWeight: 600,
        textAlign: "right",
        fontFamily: "var(--font-display)",
      }}>
        {pct === 100 ? "✓ Path complete" : `${Math.round(pct)}% complete`}
      </div>
    </div>
  );
}

export type { ModuleRef, LessonRef };
