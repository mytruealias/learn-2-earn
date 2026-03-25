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
      padding: "1rem 1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.5rem",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color: "var(--accent-green)",
          letterSpacing: "0.15em",
        }}>
          {'>'} path_progress
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontWeight: "700",
        }}>
          {completedCount} / {total} lessons
        </span>
      </div>
      <div style={{
        height: "8px",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        marginBottom: "0.4rem",
      }}>
        <div style={{
          height: "100%",
          backgroundColor: "var(--accent-green)",
          width: `${pct}%`,
          transition: "width 0.6s ease",
          boxShadow: "0 0 8px rgba(88,204,2,0.4)",
        }} />
      </div>
      <div style={{
        fontSize: "0.7rem",
        color: pct === 100 ? "var(--accent-gold)" : "var(--text-muted)",
        fontWeight: "600",
        textAlign: "right",
        fontFamily: "var(--font-mono)",
      }}>
        {pct === 100 ? "✓ PATH COMPLETE" : `${Math.round(pct)}% complete`}
      </div>
    </div>
  );
}

export type { ModuleRef, LessonRef };
