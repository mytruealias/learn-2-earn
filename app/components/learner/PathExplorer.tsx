"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookIcon, CheckCircleIcon } from "../icons";
import { Alert, Button } from "../ui";
import {
  availableLessons,
  pathProgress,
  type LearningPath,
} from "@/lib/learning-progression";
import styles from "./home.module.css";
export default function PathExplorer({
  paths,
  completedIds,
  initialSelected,
}: {
  paths: LearningPath[];
  completedIds: string[];
  initialSelected: string[];
}) {
  const router = useRouter(),
    [selected, setSelected] = useState(initialSelected),
    [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const completed = new Set(completedIds);
  async function choose(path: LearningPath) {
    if (pending) return;
    setPending(path.id);
    setError("");
    setMessage("");
    const keep = !selected.includes(path.id);
    try {
      const response = await fetch("/api/user/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ type: "path", pathId: path.id, selected: keep }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!data.ok || typeof data.selected !== "boolean") throw new Error();
      setSelected((current) =>
        data.selected
          ? [...current, path.id]
          : current.filter((id) => id !== path.id),
      );
      setMessage(
        data.selected
          ? `${path.title} is in My paths.`
          : `${path.title} was removed from My paths. It is still available below.`,
      );
      router.refresh();
    } catch {
      setError(
        "Your pathway choice could not be confirmed. Reload to check it, or try again. Every available pathway is still open.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <section aria-labelledby="my-paths-title">
        <h2 id="my-paths-title">My paths</h2>
        <p className={styles.muted}>
          Keep the pathways you want to return to. Every available pathway stays
          open.
        </p>
        <div className={styles.selectedPaths}>
          {paths
            .filter((p) => selected.includes(p.id))
            .map((p) => (
              <Link key={p.id} href={`/paths/${p.slug}`}>
                <CheckCircleIcon size={18} />
                {p.title}
              </Link>
            ))}
        </div>
        {!paths.some((p) => selected.includes(p.id)) && (
          <p className={styles.fine}>
            Choose “Keep in My paths” below. You can start any available pathway
            now.
          </p>
        )}
      </section>
      <section aria-labelledby="paths-title">
        <h2 id="paths-title">Choose a learning path</h2>
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}
        <ul className={styles.paths}>
          {paths.map((path) => {
            const progress = pathProgress(path, completed),
              minutes = availableLessons(path).reduce(
                (s, l) => s + Math.max(0, l.estimatedMinutes),
                0,
              );
            return (
              <li key={path.id} className={styles.pathCard}>
                <Link href={`/paths/${path.slug}`} className={styles.path}>
                  <span className={styles.icon} aria-hidden="true">
                    <BookIcon size={24} />
                  </span>
                  <div className={styles.pathText}>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                    <div className={styles.counts}>
                      <span>
                        {path.modules.length}{" "}
                        {path.modules.length === 1 ? "unit" : "units"}
                      </span>
                      <span>
                        {progress.total
                          ? `${progress.completed} of ${progress.total} lessons complete`
                          : "Lessons on their way"}
                      </span>
                      {minutes > 0 && <span>About {minutes} min total</span>}
                      {progress.preparing > 0 && (
                        <span>{progress.preparing} being prepared</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className={styles.selection}>
                  <Button
                    variant="quiet"
                    aria-label={`${selected.includes(path.id) ? "Remove from My paths" : "Keep in My paths"}: ${path.title}`}
                    aria-pressed={selected.includes(path.id)}
                    disabled={!!pending}
                    disabledReason="Saving your pathway choice. Please wait."
                    onClick={() => void choose(path)}
                  >
                    {selected.includes(path.id)
                      ? "Remove from My paths"
                      : "Keep in My paths"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
