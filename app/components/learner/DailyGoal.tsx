"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  ErrorState,
  ProgressIndicator,
  Skeleton,
} from "../ui";
import styles from "./home.module.css";
export default function DailyGoal({
  allComplete,
  hasAvailable,
}: {
  allComplete: boolean;
  hasAvailable: boolean;
}) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = useState<{
    target: number | null;
    completedToday: number;
    zone: string;
  } | null>(null);
  const [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setState("loading");
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    fetch(`/api/user/learning-plan?zone=${encodeURIComponent(zone)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (active) {
          setData(result);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function save(target: number | null) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/user/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ type: "goal", target }),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!result.ok) throw new Error();
      setMessage(
        result.target === null
          ? "Daily goal turned off."
          : `Daily goal saved: ${result.target} new ${result.target === 1 ? "lesson" : "lessons"}.`,
      );
      setData((current) =>
        current ? { ...current, target: result.target } : current,
      );
    } catch {
      setError(
        "Your goal could not be confirmed. Reload to check it, or try saving again. Learning is still available.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className={styles.goal}>
      <h2>A small goal for today</h2>
      {!hasAvailable ? (
        <p>
          Goals can wait until lessons are available. Help is still here
          whenever you need it.
        </p>
      ) : allComplete ? (
        <p>
          Every available lesson is complete. Review whenever it helps; you do
          not need a new lesson today.
        </p>
      ) : state === "loading" ? (
        <Skeleton label="Loading today’s learning" />
      ) : state === "error" ? (
        <ErrorState onRetry={() => setRetry((n) => n + 1)}>
          Your daily goal could not load. Your next lesson is still available.
        </ErrorState>
      ) : (
        data && (
          <>
            {data.target ? (
              <>
                <p>
                  {data.completedToday >= data.target
                    ? "Your small goal is reached. You can stop here or keep exploring."
                    : `Try ${data.target} new ${data.target === 1 ? "lesson" : "lessons"} today. One step at a time.`}
                </p>
                <ProgressIndicator
                  value={Math.min(data.completedToday, data.target)}
                  max={data.target}
                  label="Daily learning goal"
                />
                <p className={styles.muted}>
                  {data.completedToday} new lessons completed in your local day.
                </p>
              </>
            ) : (
              <p>
                One short lesson is a useful place to start. Set an optional
                goal, or learn without one.
              </p>
            )}
            <div
              className={styles.goalActions}
              role="group"
              aria-label="Daily goal choices"
            >
              {[1, 2].map((target) => (
                <Button
                  key={target}
                  variant="secondary"
                  busy={busy}
                  disabledReason="Saving your goal. Please wait."
                  aria-pressed={data.target === target}
                  onClick={() => void save(target)}
                >
                  {target} {target === 1 ? "lesson" : "lessons"}
                </Button>
              ))}
              <Button
                variant="quiet"
                aria-pressed={data.target === null}
                busy={busy}
                disabledReason="Saving your choice. Please wait."
                onClick={() => void save(null)}
              >
                No daily goal
              </Button>
            </div>
            <p className={styles.fine}>
              Your local day ({data.zone.replaceAll("_", " ")}). Goals do not
              change XP, incentives or access. No penalties for taking a break.
            </p>
          </>
        )
      )}
      {message && <p role="status">{message}</p>}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
