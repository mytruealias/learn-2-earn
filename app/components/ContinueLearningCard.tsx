"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LessonSummary {
  id: string;
  title: string;
  order: number;
}

interface ModuleSummary {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
}

interface PathSummary {
  id: string;
  slug: string;
  title: string;
  icon: string;
  modules: ModuleSummary[];
}

interface ContinueLearningCardProps {
  paths: PathSummary[];
}

export default function ContinueLearningCard({ paths }: ContinueLearningCardProps) {
  const [nextLesson, setNextLesson] = useState<{
    id: string;
    title: string;
    pathTitle: string;
    pathSlug: string;
    completedCount: number;
    totalCount: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("l2e_user_id");
    if (!userId || paths.length === 0) {
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
        if (!data.ok || !data.completedLessonIds || data.completedLessonIds.length === 0) {
          setLoaded(true);
          return;
        }

        const completedIds = new Set<string>(data.completedLessonIds);
        const recentProgress: { lessonId: string; completedAt: string }[] = data.recentProgress ?? [];

        const lessonToPath = new Map<string, PathSummary>();
        for (const path of paths) {
          for (const mod of path.modules) {
            for (const lesson of mod.lessons) {
              lessonToPath.set(lesson.id, path);
            }
          }
        }

        let mostRecentPath: PathSummary | null = null;
        for (const rp of recentProgress) {
          const path = lessonToPath.get(rp.lessonId);
          if (path) {
            mostRecentPath = path;
            break;
          }
        }

        if (!mostRecentPath) {
          setLoaded(true);
          return;
        }

        const allLessons = mostRecentPath.modules.flatMap((m) =>
          m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))
        );
        const totalCount = allLessons.length;
        const completedCount = allLessons.filter((l) => completedIds.has(l.id)).length;
        const nextIncomplete = allLessons.find((l) => !completedIds.has(l.id));

        if (nextIncomplete) {
          setNextLesson({
            id: nextIncomplete.id,
            title: nextIncomplete.title,
            pathTitle: mostRecentPath.title,
            pathSlug: mostRecentPath.slug,
            completedCount,
            totalCount,
          });
        }

        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [paths]);

  if (!loaded || !nextLesson) return null;

  const progressPct = nextLesson.totalCount > 0 ? (nextLesson.completedCount / nextLesson.totalCount) * 100 : 0;

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--accent-green)",
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background: "linear-gradient(90deg, transparent, var(--accent-green), transparent)",
      }} />

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        color: "var(--accent-green)",
        letterSpacing: "0.15em",
        marginBottom: "0.5rem",
      }}>
        {'>'} continue_learning
      </div>

      <div style={{
        color: "var(--text-muted)",
        fontSize: "0.75rem",
        fontWeight: "600",
        marginBottom: "0.25rem",
      }}>
        {nextLesson.pathTitle}
      </div>

      <div style={{
        color: "var(--text-primary)",
        fontWeight: "700",
        fontSize: "1rem",
        fontFamily: "var(--font-display)",
        marginBottom: "0.75rem",
      }}>
        {nextLesson.title}
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.35rem",
        }}>
          <span style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {nextLesson.completedCount} / {nextLesson.totalCount} lessons
          </span>
          <span style={{
            fontSize: "0.7rem",
            color: "var(--accent-green)",
            fontFamily: "var(--font-mono)",
            fontWeight: "700",
          }}>
            {Math.round(progressPct)}%
          </span>
        </div>
        <div style={{
          height: "6px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            backgroundColor: "var(--accent-green)",
            width: `${progressPct}%`,
            transition: "width 0.6s ease",
            boxShadow: "0 0 6px rgba(88,204,2,0.4)",
          }} />
        </div>
      </div>

      <Link
        href={`/lesson/${nextLesson.id}`}
        style={{
          display: "block",
          padding: "0.75rem",
          backgroundColor: "transparent",
          color: "var(--accent-green)",
          border: "1px solid var(--accent-green)",
          fontWeight: "700",
          fontSize: "0.9rem",
          textAlign: "center",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.05em",
          boxShadow: "var(--glow-green)",
          marginTop: "0.75rem",
        }}
      >
        CONTINUE &gt;
      </Link>
    </div>
  );
}
