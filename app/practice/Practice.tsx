"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Skeleton,
} from "../components/ui";
import DailyGoal from "../components/learner/DailyGoal";
import { badgeDefinitions } from "@/lib/lesson/rules";
import type { practiceData } from "@/lib/lesson/practice";
import styles from "./practice.module.css";
type Data = Awaited<ReturnType<typeof practiceData>>;
export default function Practice() {
  const [data, setData] = useState<Data | null>(null),
    [state, setState] = useState("loading"),
    [retry, setRetry] = useState(0),
    [filter, setFilter] = useState("due"),
    [topic, setTopic] = useState("all");
  const [zone, setZone] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setState("loading");
    fetch("/api/practice", {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (active) {
          setData(d);
          setZone(d.zone);
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
  async function saveZone(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/user/learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "timezone", zone }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Your timezone could not be confirmed.",
        );
      setMessage(
        `Timezone saved: ${d.zone}. Future activity uses this local day.`,
      );
      setRetry((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your timezone could not be confirmed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const items =
    data?.items.filter(
      (i) =>
        (filter === "all" ||
          (filter === "missed" && i.missed.length > 0) ||
          (filter === "due" && i.due)) &&
        (topic === "all" || i.topicId === topic),
    ) || [];
  const topics = [
    ...new Map(data?.items.map((i) => [i.topicId, i.topic]) || []).entries(),
  ];
  return (
    <main className={styles.page}>
      <header>
        <p className={styles.label}>Keep a useful skill close</p>
        <h1>Practice</h1>
        <p>
          Review at your pace. Practice saves learning activity and never adds
          cash credit or XP to your first completions.
        </p>
      </header>
      {state === "loading" ? (
        <Skeleton label="Loading practice" />
      ) : state === "error" ? (
        <ErrorState onRetry={() => setRetry((n) => n + 1)}>
          Your practice could not load. Try again, or return to Learn.
        </ErrorState>
      ) : (
        data && (
          <>
            <section
              aria-label="Learning and practice totals"
              className={styles.totals}
            >
              <p>
                <strong>{data.firstCompletions}</strong> first{" "}
                {data.firstCompletions === 1 ? "completion" : "completions"}
              </p>
              <p>
                <strong>{data.practiceCount}</strong> completed practice{" "}
                {data.practiceCount === 1 ? "session" : "sessions"}
              </p>
              <p>
                <strong>{data.streak}</strong> learning{" "}
                {data.streak === 1 ? "day" : "days"} in your streak
              </p>
            </section>
            <div
              className={styles.filters}
              role="group"
              aria-label="Practice choices"
            >
              {[
                ["due", "Due for review"],
                ["missed", "Missed questions"],
                ["all", "Topic practice"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant="secondary"
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <label className={styles.field}>
              Topic
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="all">All topics</option>
                {topics.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {!items.length ? (
              <Card>
                <h2>
                  {data.items.length
                    ? "Nothing in this view right now"
                    : "Practice grows with your learning"}
                </h2>
                <p>
                  {data.items.length
                    ? "There is no deadline. Choose Topic practice to revisit a lesson whenever it helps."
                    : "Complete a lesson to see review work here. Earlier completions are kept even when a pathway is no longer available."}
                </p>
                <ButtonLink href="/app">Find a lesson</ButtonLink>
              </Card>
            ) : (
              <ul className={styles.list}>
                {items.map((i) => (
                  <li key={i.id}>
                    <Card className={styles.item}>
                      <p className={styles.label}>
                        {i.path} · {i.topic}
                      </p>
                      <h2>{i.title}</h2>
                      <p>
                        {i.minutes} min ·{" "}
                        {i.due ? "Review suggested now" : "Available anytime"}
                      </p>
                      <p>{i.reason}</p>
                      {i.dueAt && (
                        <p>
                          Review date:{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeZone: data.zone,
                          }).format(new Date(i.dueAt))}{" "}
                          ({data.zone})
                        </p>
                      )}
                      {i.successes !== null && (
                        <p>
                          {i.successes} consecutive completed attempts without a
                          missed question. This is a practice signal, not a
                          mastery certification.
                        </p>
                      )}
                      {!!i.missed.length && (
                        <details>
                          <summary>
                            {i.missed.length}{" "}
                            {i.missed.length === 1 ? "question" : "questions"}{" "}
                            to revisit
                          </summary>
                          <ul>
                            {i.missed.map((p, n) => (
                              <li key={n}>{p}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <ButtonLink href={`/lesson/${i.id}?practice=1`}>
                        Practice: {i.title}
                      </ButtonLink>
                      <p className={styles.note}>
                        Review the full lesson, including its teaching cards. No
                        additional XP or cash credit.
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            <Card>
              <h2>Your milestones</h2>
              <p>
                {data.badges.length
                  ? badgeDefinitions
                      .filter((b) => data.badges.includes(b.id))
                      .map((b) => b.label)
                      .join(" · ") || "Your earlier milestones are saved."
                  : "Your first lesson and practice milestones will appear here."}{" "}
                Breaks do not erase your earned badges or balances.
              </p>
            </Card>
            <div className={styles.settings}>
              <DailyGoal allComplete={false} hasAvailable={true} />
              <Card>
                <h2>Your learning day</h2>
                <p>
                  Current timezone: {data.zone}.{" "}
                  {data.timezoneStored
                    ? "Saved for your account across devices."
                    : "Using the program timezone, or UTC when unconfigured."}{" "}
                  No penalties for a missed day.
                </p>
                <form onSubmit={saveZone} className={styles.form}>
                  <label className={styles.field}>
                    Timezone (IANA name)
                    <input
                      required
                      maxLength={100}
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="America/Chicago"
                      aria-describedby="timezone-help"
                    />
                  </label>
                  <p id="timezone-help">
                    Choose the timezone where you usually learn. Changing it
                    affects future daily goals and streak calculations; it does
                    not change rewards.
                  </p>
                  <Button type="submit" busy={busy}>
                    Save timezone
                  </Button>
                </form>
                <Button
                  variant="quiet"
                  onClick={() =>
                    setZone(
                      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                    )
                  }
                >
                  Use this device’s timezone
                </Button>
                {message && <p role="status">{message}</p>}
                {error && <Alert tone="error">{error}</Alert>}
              </Card>
            </div>
            <Card>
              <h2>How review works</h2>
              <p>
                A completed attempt with a missed question suggests review after
                1 day. Attempts without missed questions suggest review after 3,
                then 7, then 14 days. A later missed question returns the
                interval to 1 day. These are elapsed 24-hour days; the review
                date is shown in your saved timezone. You can practice earlier
                or later.
              </p>
              <p>
                Only completed, server-checked attempts update this schedule.
                Personal reflection is optional. No reminders or messages are
                sent.
              </p>
            </Card>
          </>
        )
      )}
    </main>
  );
}
