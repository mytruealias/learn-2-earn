"use client";
import { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { staffFetch } from "@/lib/staff-fetch";
import {
  Alert,
  Button,
  Card,
  Dialog,
  ErrorState,
  Skeleton,
} from "@/app/components/ui";
import styles from "../../components/staff.module.css";
type CaseDetail = {
  id: string;
  intakeKey: string | null;
  acknowledgedAt: string | null;
  title: string;
  message: string;
  status: string;
  priority: string;
  version: number;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  location: string | null;
  assignedTo: { id: string; fullName: string } | null;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  };
  notes: {
    id: string;
    text: string;
    type: string;
    createdAt: string;
    admin: { fullName: string };
  }[];
  allocations: {
    id: string;
    resourceType: string;
    quantity: number;
    createdAt: string;
  }[];
};
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params),
    [data, setData] = useState<CaseDetail | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [staff, setStaff] = useState<{ id: string; fullName: string }[]>([]),
    [modal, setModal] = useState<
      "meta" | "dispatch" | "allocate" | "acknowledge" | null
    >(null),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [status, setStatus] = useState("open"),
    [priority, setPriority] = useState("medium"),
    [assignee, setAssignee] = useState(""),
    [followUp, setFollowUp] = useState(""),
    [detail, setDetail] = useState(""),
    [resource, setResource] = useState("shelter"),
    [quantity, setQuantity] = useState("1"),
    intent = useRef<{ url: string; body: object } | null>(null),
    lock = useRef(false);
  const load = useCallback(async () => {
    try {
      const r = await staffFetch(`/api/admin/cases/${id}`),
        d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Case unavailable.");
      setData(d.case);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Case unavailable.");
    }
  }, [id]);
  useEffect(() => {
    void load();
    staffFetch("/api/admin/cases/staff")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setStaff(d.staff);
      })
      .catch(() =>
        setError(
          "Assignment choices could not load. Reload before assigning staff.",
        ),
      );
  }, [id, load]);
  function open(action: "meta" | "dispatch" | "allocate" | "acknowledge") {
    if (!data || lock.current) return;
    intent.current = null;
    setError("");
    setModal(action);
    setStatus(data.status);
    setPriority(data.priority);
    setAssignee(data.assignedTo?.id || "");
    setFollowUp(
      data.followUpAt
        ? new Date(
            Date.parse(data.followUpAt) -
              new Date(data.followUpAt).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    );
    setDetail("");
  }
  async function mutate(
    action: "meta" | "note" | "dispatch" | "allocate" | "acknowledge",
  ) {
    if (!data || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const url = `/api/admin/cases/${id}${action === "meta" ? "" : action === "note" ? "/notes" : `/${action}`}`,
        body = {
          requestKey: crypto.randomUUID(),
          expectedVersion: data.version,
          ...(action === "acknowledge"
            ? {}
            : action === "meta"
              ? {
                  status,
                  priority,
                  assignedToId: assignee || null,
                  followUpAt: followUp
                    ? new Date(followUp).toISOString()
                    : null,
                }
              : action === "note"
                ? { text: note }
                : action === "dispatch"
                  ? { staffId: assignee, notes: detail }
                  : {
                      resourceType: resource,
                      quantity: Number(quantity),
                      notes: detail,
                    }),
        };
      if (intent.current && intent.current.url !== url)
        throw new Error(
          "Verify the previous save by reloading before starting another action.",
        );
      const work = intent.current || { url, body };
      intent.current = work;
      const r = await staffFetch(work.url, {
          method: action === "meta" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(work.body),
        }),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Save could not be confirmed.");
      intent.current = null;
      setModal(null);
      if (action === "note") setNote("");
      setMessage("Saved and audited. The latest case version is shown below.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry unchanged details or reload to verify the record.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reload() {
    intent.current = null;
    setModal(null);
    setError("");
    await load();
  }
  if (!data)
    return <section className={styles.page} data-design="staff"><h1>Support case</h1>{error ? (
      <ErrorState onRetry={reload}>{error}</ErrorState>
    ) : (
      <Skeleton label="Loading authorized case…" />
    )}</section>;
  return (
    <section className={styles.page} data-design="staff">
      <Link href="/admin/cases">Back to cases</Link>
      <header>
        <h1>{data.title}</h1>
        <p>
          {data.status} · {data.priority} priority · version {data.version}
        </p>
        <Link href={`/admin/users/${data.user.id}`}>
          {data.user.fullName || "Guest learner"}: learning, consent and rewards
        </Link>
      </header>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <Button variant="secondary" onClick={reload}>
            Reload latest case
          </Button>
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      <div className={styles.grid}>
        <Card>
          <h2>Case and assignment</h2>
          {data.intakeKey && (
            <>
              <p>
                {data.acknowledgedAt
                  ? `Staff acknowledgment recorded ${new Date(data.acknowledgedAt).toLocaleString()}. This is not proof of completed follow-up.`
                  : "No staff acknowledgment recorded. Opening this page does not acknowledge the request."}
              </p>
              {!data.acknowledgedAt && (
                <Button
                  disabled={busy}
                  disabledReason="Wait for the current case save."
                  onClick={() => open("acknowledge")}
                >
                  Record staff acknowledgment
                </Button>
              )}
            </>
          )}
          <p style={{ whiteSpace: "pre-wrap" }}>{data.message}</p>
          {data.location && <p>Reported location: {data.location}</p>}
          <p>
            Assigned to {data.assignedTo?.fullName || "no one"}. Follow-up:{" "}
            {data.followUpAt
              ? new Date(data.followUpAt).toLocaleString()
              : "not scheduled"}
            .
          </p>
          <p>Updated {new Date(data.updatedAt).toLocaleString()}.</p>
          <div className={styles.actions}>
            <Button
              disabled={busy}
              disabledReason="Wait for the current case save before starting another action."
              onClick={() => open("meta")}
            >
              Update case and follow-up
            </Button>
            <Button
              disabled={busy}
              disabledReason="Wait for the current case save before starting another action."
              variant="secondary"
              onClick={() => open("dispatch")}
            >
              Record staff dispatch
            </Button>
            <Button
              disabled={busy}
              disabledReason="Wait for the current case save before starting another action."
              variant="secondary"
              onClick={() => open("allocate")}
            >
              Record service allocation
            </Button>
          </div>
        </Card>
        <Card>
          <h2>Service activity</h2>
          {data.allocations.length ? (
            <ul>
              {data.allocations.map((a) => (
                <li key={a.id}>
                  {a.resourceType.replaceAll("_", " ")}: {a.quantity} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No service allocations recorded.</p>
          )}
          <p>
            These records describe staff activity. They do not establish that a
            service was received or caused an outcome.
          </p>
        </Card>
      </div>
      <Card>
        <h2>Authorized notes and activity</h2>
        <p>
          Latest 100 recorded case events, oldest first within this window.
          Share only information necessary for this program’s support work.
        </p>
        <ol className={styles.timeline}>
          {[...data.notes]
            .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
            .map((n) => (
              <li key={n.id}>
                <strong>
                  {n.type.replaceAll("_", " ")} · {n.admin.fullName}
                </strong>
                <br />
                <time dateTime={n.createdAt}>
                  {new Date(n.createdAt).toLocaleString()}
                </time>
                <p style={{ whiteSpace: "pre-wrap" }}>{n.text}</p>
              </li>
            ))}
        </ol>
        {data.notes.length === 0 && <p>No notes have been added.</p>}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void mutate("note");
          }}
        >
          <label>
            New case note
            <textarea
              required
              value={note}
              maxLength={5000}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
          </label>
          <Button type="submit" busy={busy}>
            Save authorized note
          </Button>
        </form>
      </Card>
      <Dialog
        open={!!modal}
        title={
          modal === "acknowledge"
            ? "Acknowledge this support request"
            : modal === "dispatch"
              ? "Confirm staff dispatch"
              : modal === "allocate"
                ? "Confirm service allocation"
                : "Confirm case changes"
        }
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (modal) void mutate(modal);
          }}
        >
          <p>
            Changes apply to <strong>{data.title}</strong>, version{" "}
            {data.version}. Another staff update will require a fresh review.
          </p>
          {modal === "meta" && (
            <>
              <label>
                Status
                <select
                  aria-label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["new", "open", "dispatched", "resolved", "closed"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Priority
                <select
                  aria-label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {["high", "medium", "low"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Follow-up in your device timezone
                <input
                  type="datetime-local"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </label>
              {["resolved", "closed"].includes(status) && (
                <p>
                  Resolving or closing removes the case from open queues and
                  clears its scheduled follow-up. History is retained.
                </p>
              )}
            </>
          )}
          {modal !== "allocate" && modal !== "acknowledge" && (
            <label>
              Assigned staff
              <select
                aria-label="Assigned staff"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required={modal === "dispatch"}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {modal === "allocate" && (
            <>
              <label>
                Service type
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                >
                  {[
                    "shelter",
                    "food",
                    "bus_pass",
                    "hygiene",
                    "clothing",
                    "mental_health",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            </>
          )}
          {modal !== "meta" && modal !== "acknowledge" && (
            <label>
              Optional staff note
              <textarea
                maxLength={2000}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </label>
          )}
          {modal === "acknowledge" && (
            <p>
              Confirm that you have read this request. This records your
              acknowledgment and timestamp; it does not notify the participant,
              promise follow-up or dispatch emergency services.
            </p>
          )}
          {modal === "dispatch" && (
            <p>
              This records an internal dispatch status. It sends no message and
              does not dispatch emergency services.
            </p>
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
