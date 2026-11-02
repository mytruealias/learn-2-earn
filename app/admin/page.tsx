"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { staffFetch } from "@/lib/staff-fetch";
import { useAdmin } from "./AdminContext";
import {
  Card,
  Button,
  ButtonLink,
  ErrorState,
  Skeleton,
} from "@/app/components/ui";
import styles from "./components/staff.module.css";
type Overview = {
  queues: {
    pending: number;
    reviewed: number;
    approved: number;
    unassigned: number | null;
    followUps: number | null;
  };
  unacknowledged: number | null;
  participants: number;
  firstCompletions: number;
  activity: {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
  }[];
  asOf: string;
};
export default function Page() {
  const { admin } = useAdmin(),
    [data, setData] = useState<Overview | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const r = await staffFetch("/api/admin/overview");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Queues unavailable.");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Queues unavailable.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return <section className={styles.page} data-design="staff"><h1>Your program workspace</h1>{error ? (
      <ErrorState onRetry={load}>{error}</ErrorState>
    ) : (
      <Skeleton label="Loading program work queues…" />
    )}</section>;
  const review = admin?.role !== "finance",
    finance = admin?.role !== "caseworker";
  const queues = [
    ...(review
      ? [
          {
            label: "Reward requests awaiting review",
            count: data.queues.pending,
            href: "/admin/payouts?status=pending",
          },
        ]
      : []),
    ...(finance
      ? [
          {
            label: "Reviewed requests awaiting approval",
            count: data.queues.reviewed,
            href: "/admin/payouts?status=reviewed",
          },
          {
            label: "Approved requests awaiting manual payment record",
            count: data.queues.approved,
            href: "/admin/payouts?status=approved",
          },
        ]
      : []),
    ...(review
      ? [
          {
            label: "Support requests awaiting acknowledgment",
            count: data.unacknowledged ?? 0,
            href: "/admin/cases?status=unacknowledged",
          },
          {
            label: "Unassigned support cases",
            count: data.queues.unassigned ?? 0,
            href: "/admin/cases?status=unassigned",
          },
          {
            label: "Scheduled follow-ups due",
            count: data.queues.followUps ?? 0,
            href: "/admin/cases?status=follow-up",
          },
        ]
      : []),
  ];
  const next = queues.find((q) => q.count > 0);
  return (
    <section className={styles.page} data-design="staff">
      <header>
        <p className={styles.eyebrow}>
          {admin?.organizationName} · {admin?.programName}
        </p>
        <h1>Your program workspace</h1>
        <p>
          Start with the next staff action. All queues and totals are limited to
          your active program.
        </p>
      </header>
      {error && <p role="alert">{error}</p>}
      <Card>
        <h2>{next ? "Next action" : "Your queues are clear"}</h2>
        <p>
          {next
            ? `${next.count} ${next.label.toLowerCase()}. Open the queue to review an individual record.`
            : "No work is currently waiting in these queues. Scheduled follow-ups appear when due."}
        </p>
        <ButtonLink href={next?.href || "/admin/users"}>
          {next ? "Open next queue" : "View participants"}
        </ButtonLink>
      </Card>
      <div className={styles.grid}>
        {queues.map((q) => (
          <Card key={q.href}>
            <h2>{q.label}</h2>
            <p className={styles.metric}>{q.count}</p>
            <Link href={q.href}>View queue</Link>
          </Card>
        ))}
      </div>
      <Card>
        <h2>Learning participation</h2>
        <p>
          {data.participants} currently enrolled participant accounts.{" "}
          {data.firstCompletions} first lesson completions in the last seven
          elapsed days.
        </p>
        <p>
          Completion measures participation, not recovery, housing stability or
          causal program impact.
        </p>
        <Link href="/admin/reports">Explore defined metrics</Link>
      </Card>
      <Card>
        <h2>Recent program activity</h2>
        {data.activity.length ? (
          <ol className={styles.timeline}>
            {data.activity.map((e) => (
              <li key={e.id}>
                <strong>{e.action.toLowerCase().replaceAll("_", " ")}</strong>
                <br />
                <time dateTime={e.createdAt}>
                  {new Date(e.createdAt).toLocaleString()}
                </time>
                <br />
                <Link
                  href={
                    e.entity === "Case"
                      ? `/admin/cases/${e.entityId}`
                      : e.action.startsWith("PAYOUT")
                        ? "/admin/payouts?status=all"
                        : "/admin/finance"
                  }
                >
                  Open related workspace
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p>No matching staff or reward activity has been recorded yet.</p>
        )}
      </Card>
      <p role="status">
        {busy
          ? "Updating queues…"
          : `Updated ${new Date(data.asOf).toLocaleString()}.`}
      </p>
      <Button variant="secondary" busy={busy} onClick={load}>
        Refresh queues
      </Button>
    </section>
  );
}
