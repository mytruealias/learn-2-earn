"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { staffFetch } from "@/lib/staff-fetch";
import { useAdmin } from "../../AdminContext";
import {
  Alert,
  Button,
  Card,
  Dialog,
  ErrorState,
  Skeleton,
} from "@/app/components/ui";
import { usd } from "@/lib/rewards/money";
import styles from "../../components/staff.module.css";
type Detail = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone?: string | null;
  caseNumber?: string | null;
  staffVersion: number;
  isActive?: boolean;
  totalXp: number;
  consentGiven?: boolean;
  progress?: {
    id: string;
    completedAt: string;
    xpEarned: number;
    lesson: { title: string };
  }[];
  consents?: {
    id: string;
    consentType: string;
    granted: boolean;
    version: string;
    createdAt: string;
  }[];
  cases?: { id: string; title: string; status: string }[];
  payoutRequests: {
    id: string;
    status: string;
    amountCents: number | null;
    createdAt: string;
    paidAt: string | null;
  }[];
  activity?: { id: string; action: string; createdAt: string }[];
  rewards: {
    availableXp: number;
    reservedXp: number;
    spentXp: number;
    paidCents: string | null;
  };
  _count?: { progress: number; cases: number; payoutRequests: number };
};
export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params),
    { admin } = useAdmin(),
    [data, setData] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState<"account" | "case" | null>(null),
    [caseNumber, setCaseNumber] = useState(""),
    [active, setActive] = useState(true),
    [adjustment, setAdjustment] = useState("0"),
    [reason, setReason] = useState(""),
    [title, setTitle] = useState(""),
    [note, setNote] = useState(""),
    [key, setKey] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await staffFetch(`/api/admin/users/${userId}`),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Participant unavailable.");
      setData(d.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Participant could not load.");
    }
  }, [userId]);
  useEffect(() => {
    void load();
  }, [load]);
  function open(type: "account" | "case") {
    if (!data || busy) return;
    setKey(crypto.randomUUID());
    setModal(type);
    setCaseNumber(data.caseNumber || "");
    setActive(data.isActive ?? true);
    setAdjustment("0");
    setReason("");
    setError("");
  }
  async function save() {
    if (!data || !modal || busy) return;
    setBusy(true);
    setError("");
    try {
      const body =
        modal === "case"
          ? {
              userId,
              title,
              message: note,
              priority: "medium",
              requestKey: key,
            }
          : {
              requestKey: key,
              expectedVersion: data.staffVersion,
              ...(admin?.role !== "finance"
                ? { caseNumber, isActive: active }
                : {}),
              ...(Number(adjustment)
                ? { xpAdjustment: Number(adjustment), xpReason: reason }
                : {}),
            };
      const r = await staffFetch(
          modal === "case" ? "/api/admin/cases" : `/api/admin/users/${userId}`,
          {
            method: modal === "case" ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        ),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Change could not be confirmed.");
      setModal(null);
      setMessage("Saved and recorded in the program audit trail.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry unchanged details or reload to verify.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return <section className={styles.page} data-design="staff"><h1>Participant detail</h1>{error ? (
      <ErrorState
        onRetry={() => {
          setError("");
          void load();
        }}
      >
        {error}
      </ErrorState>
    ) : (
      <Skeleton label="Loading participant detail…" />
    )}</section>;
  const finance = admin?.role === "finance",
    canCorrect = admin?.role !== "caseworker";
  const trail = [
    ...(data.activity || []).map((a) => ({
      id: a.id,
      label: a.action.replaceAll("_", " ").toLowerCase(),
      at: a.createdAt,
    })),
    ...(data.progress || []).map((p) => ({
      id: p.id,
      label: `First lesson completed: ${p.lesson.title} (${p.xpEarned} XP)`,
      at: p.completedAt,
    })),
    ...data.payoutRequests.map((p) => ({
      id: p.id,
      label: `Reward request: ${p.status}${p.status === "completed" ? " (external payment recorded)" : " (not paid)"}`,
      at: p.paidAt || p.createdAt,
    })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 100);
  return (
    <section className={styles.page} data-design="staff">
      <Link href="/admin/users">Back to participants</Link>
      <header>
        <h1>{data.fullName || "Guest learner"}</h1>
        <p>
          Participant record {data.id} · {admin?.programName}
        </p>
      </header>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <Button
            variant="quiet"
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Reload latest record
          </Button>
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      <div className={styles.actions}>
        <Button disabled={busy} disabledReason="Wait for the current participant save." onClick={() => open("account")}>
          {finance ? "Correct reward entitlement" : "Update participant"}
        </Button>
        {!finance && (
          <Button disabled={busy} disabledReason="Wait for the current participant save." variant="secondary" onClick={() => open("case")}>
            Create support case
          </Button>
        )}
      </div>
      <div className={styles.grid}>
        <Card>
          <h2>Learning and rewards</h2>
          <p>
            {data.totalXp} lifetime XP record.{" "}
            {data._count?.progress ?? "See authorized learning history"} first
            completions.
          </p>
          <p>
            {data.rewards.availableXp} available XP · {data.rewards.reservedXp}{" "}
            held XP · {data.rewards.spentXp} spent XP
          </p>
          <p>
            Recorded paid:{" "}
            {data.rewards.paidCents === null
              ? "Needs reconciliation"
              : usd(data.rewards.paidCents)}
          </p>
        </Card>
        <Card>
          <h2>Contact and consent</h2>
          <p>
            {data.email || "No email recorded"}
            {!finance && data.phone ? ` · ${data.phone}` : ""}
          </p>
          {finance ? (
            <p>
              Support details and consent documents are restricted to authorized
              support staff.
            </p>
          ) : (
            <>
              <p>
                Account {data.isActive ? "active" : "inactive"}. General consent{" "}
                {data.consentGiven ? "recorded" : "not recorded"}; separate
                choices appear below.
              </p>
              <ul>
                {data.consents?.map((c) => (
                  <li key={c.id}>
                    {c.consentType}:{" "}
                    {c.granted ? "granted" : "declined / withdrawn"}, version{" "}
                    {c.version}, {new Date(c.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
              {!data.consents?.length && <p>No separate consent records.</p>}
            </>
          )}
        </Card>
      </div>
      {!finance && (
        <Card>
          <h2>Support cases</h2>
          {data.cases?.length ? (
            <ul>
              {data.cases.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/cases/${c.id}`}>
                    {c.title} · {c.status}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No authorized support cases.</p>
          )}
          <p>
            Latest 20 cases shown; use the case list to find additional records.
            Notes stay within each authorized case.
          </p>
        </Card>
      )}
      <Card>
        <h2>Reward history</h2>
        {data.payoutRequests.length ? (
          <ul>
            {data.payoutRequests.map((p) => (
              <li key={p.id}>
                {p.amountCents === null
                  ? "Needs reconciliation"
                  : usd(p.amountCents)}{" "}
                · {p.status}
                {p.status === "approved" ? "; not paid" : ""} ·{" "}
                {new Date(p.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No reward requests.</p>
        )}
        <Link href="/admin/payouts?status=all">Open program reward queue</Link>
      </Card>
      <Card>
        <h2>Chronological activity</h2>
        <p>
          Latest 100 authorized learning, account and reward events. No private
          reflection text is shown.
        </p>
        {trail.length ? (
          <ol className={styles.timeline}>
            {trail.map((t) => (
              <li key={t.id}>
                {t.label}
                <br />
                <time dateTime={t.at}>{new Date(t.at).toLocaleString()}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p>No recorded activity.</p>
        )}
      </Card>
      <Dialog
        open={!!modal}
        title={
          modal === "case"
            ? "Create a support case"
            : "Confirm participant change"
        }
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {modal === "case" ? (
            <>
              <label>
                Case title
                <input
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Authorized support note
                <textarea
                  required
                  maxLength={5000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <p>
                This creates a program support record. It does not notify
                emergency services or confirm a service outcome.
              </p>
            </>
          ) : (
            <>
              {!finance && (
                <>
                  <label>
                    Case number
                    <input
                      maxLength={60}
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                    />
                  </label>
                  <label>
                    Account access
                    <select
                      value={active ? "active" : "inactive"}
                      onChange={(e) => setActive(e.target.value === "active")}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  {!active && (
                    <p>
                      Deactivation ends participant sign-in sessions. Saved
                      learning, earned balances and payment history remain.
                    </p>
                  )}
                </>
              )}
              {canCorrect && (
                <>
                  <label>
                    Entitlement correction in XP
                    <input
                      type="number"
                      min={-100000}
                      max={100000}
                      step={1}
                      required
                      value={adjustment}
                      onChange={(e) => setAdjustment(e.target.value)}
                    />
                  </label>
                  <p>
                    Available entitlement changes from{" "}
                    {data.rewards.availableXp} to{" "}
                    {data.rewards.availableXp + Number(adjustment || 0)} XP.
                    Lifetime XP and past payments stay preserved. This moves no
                    funds.
                  </p>
                  <label>
                    Correction reason
                    <input
                      required={Number(adjustment) !== 0}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                </>
              )}
            </>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" busy={busy}>
            Confirm and save
          </Button>
        </form>
      </Dialog>
    </section>
  );
}
