"use client";
import { useEffect, useRef, useState } from "react";
import { useAdmin } from "../AdminContext";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Dialog,
  ErrorState,
  Skeleton,
} from "@/app/components/ui";
import { usd, methodDefinitions } from "@/lib/rewards/money";
import type { payoutDto } from "@/lib/rewards/accounting";
import styles from "../../profile/rewards.module.css";
type Payout = ReturnType<typeof payoutDto> & {
  user: { fullName: string | null };
};
const labels: Record<string, string> = {
  pending: "Awaiting review",
  reviewed: "Reviewed; awaiting approval",
  approved: "Approved; not recorded paid",
  completed: "Payment recorded",
  rejected: "Rejected; reservation released",
  cancelled: "Cancelled; reservation released",
};
export default function Page() {
  const { admin } = useAdmin();
  const [items, setItems] = useState<Payout[]>([]),
    [status, setStatus] = useState("pending"),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{
      id: string;
      action: string;
      key: string;
    } | null>(null),
    [note, setNote] = useState(""),
    [reference, setReference] = useState(""),
    [paidAt, setPaidAt] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [details, setDetails] = useState<{
      id: string;
      handle: string | null;
    } | null>(null);
  const loadGeneration = useRef(0);
  const filter = useRef({ page, status });
  filter.current = { page, status };
  const lock = useRef(false),
    retry = useRef<object | null>(null);
  const canFinance = !!admin && ["admin", "finance"].includes(admin.role),
    canReview = !!admin && ["admin", "caseworker"].includes(admin.role);
  async function load(p = filter.current.page, s = filter.current.status) {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/payouts?status=${s}&page=${p}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (
        generation !== loadGeneration.current ||
        s !== filter.current.status ||
        p !== filter.current.page
      )
        return;
      if (!r.ok)
        throw new Error(d.error?.message || "Requests could not load.");
      setItems(d.payouts);
      setPages(d.pagination.totalPages);
    } catch (e) {
      if (generation === loadGeneration.current)
        setError(e instanceof Error ? e.message : "Requests could not load.");
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load(page, status);
    setDetails(null);
  }, [page, status]);
  function open(p: Payout, verb: string) {
    setAction({ id: p.id, action: verb, key: crypto.randomUUID() });
    setNote("");
    setReference("");
    setPaidAt("");
    setConfirmed(false);
    retry.current = null;
    setError("");
  }
  async function decide() {
    if (!action || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const body = retry.current || {
        payoutId: action.id,
        action: action.action,
        requestKey: action.key,
        decisionNote: note,
        ...(action.action === "complete"
          ? {
              paymentReference: reference,
              paidAt: new Date(paidAt).toISOString(),
            }
          : {}),
      };
      retry.current = body;
      const r = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Decision could not be confirmed.");
      setMessage(
        `Saved: ${labels[d.payout.status] || d.payout.status}. No external transfer was initiated.`,
      );
      setAction(null);
      retry.current = null;
      setDetails(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error && !(e instanceof TypeError)
          ? e.message
          : "Decision could not be confirmed. Retry unchanged details; do not send a payment again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reveal(p: Payout) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/payouts/${p.id}/payment-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Details unavailable.");
      setDetails({ id: p.id, handle: d.paymentHandle });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Details unavailable.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function exportMasked() {
    const rows = [
      [
        "Request ID",
        "Amount cents",
        "Status",
        "Method",
        "Masked contact",
        "Paid timestamp",
      ],
      ...items.map((p) => [
        p.id,
        String(p.amountCents ?? "unreconciled"),
        p.status,
        p.paymentMethod || "",
        p.paymentHandle,
        p.paidAt ? new Date(p.paidAt).toISOString() : "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (v) =>
              `"${String(v)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "masked-reward-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      aria-label="Reward request operations"
      data-design="admin"
      className={styles.page}
    >
      <h1>Reward requests</h1>
      <p>
        Review, approval and manual payment are different steps. Payment
        contacts are masked until an authorized payer opens an approved request.
      </p>
      <label className={styles.form}>
        Status
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {[
            "pending",
            "reviewed",
            "approved",
            "completed",
            "rejected",
            "cancelled",
            "all",
          ].map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All records" : labels[s]}
            </option>
          ))}
        </select>
      </label>
      {message && <p role="status">{message}</p>}
      {error && !action && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <Skeleton label="Loading reward requests" />
      ) : error && !items.length ? (
        <ErrorState onRetry={() => void load()}>
          Requests could not load.
        </ErrorState>
      ) : !items.length ? (
        <Card>
          <h2>No requests in this view</h2>
          <p>Choose another status or return later.</p>
        </Card>
      ) : (
        <ul className={styles.list}>
          {items.map((p) => (
            <li key={p.id}>
              <Card>
                <h2>
                  {p.amountCents === null
                    ? "Needs reconciliation"
                    : usd(p.amountCents)}{" "}
                  · {p.xpAmount} XP
                </h2>
                <p>
                  {p.user.fullName || "Learner"} · Record {p.userId}
                </p>
                <p>
                  {labels[p.status] || "Unknown status; needs reconciliation"}
                </p>
                <p>
                  {p.paymentMethod
                    ? methodDefinitions[p.paymentMethod].label
                    : "Method unavailable"}{" "}
                  · {p.paymentHandle}
                </p>
                <p>
                  Request {p.id} · {new Date(p.createdAt).toLocaleString()}
                </p>
                <p>
                  {p.rulesSnapshot?.source === "legacy-record"
                    ? "Historical amount preserved; original rule terms unknown."
                    : p.rulesSnapshot
                      ? `Accepted rate: USD ${p.rulesSnapshot.rate} / XP; independent approver ${p.rulesSnapshot.separateApprover ? "required" : "not required by this version"}.`
                      : "Reconcile this record before changing it."}
                </p>
                <ol>
                  {p.events.map((e, n) => (
                    <li key={n}>
                      {e.action === "legacy-import"
                        ? "Imported historical status (not original payment date)"
                        : labels[e.status || ""] || e.action}{" "}
                      · {new Date(e.at).toLocaleString()}
                    </li>
                  ))}
                </ol>
                {p.paidAt && (
                  <p>
                    External payment timestamp:{" "}
                    {new Date(p.paidAt).toLocaleString()} · Reference:{" "}
                    {p.paymentReference}
                  </p>
                )}
                {p.status === "completed" && !p.paidAt && (
                  <p>
                    Legacy completed record; original payment timestamp
                    unavailable.
                  </p>
                )}
                <div className={styles.actions}>
                  {p.status === "pending" && canReview && (
                    <Button busy={busy} onClick={() => open(p, "review")}>
                      Record review
                    </Button>
                  )}
                  {p.status === "reviewed" && canFinance && (
                    <Button busy={busy} onClick={() => open(p, "approve")}>
                      Approve request
                    </Button>
                  )}
                  {["pending", "reviewed"].includes(p.status) && (
                    <Button
                      variant="secondary"
                      busy={busy}
                      onClick={() => open(p, "reject")}
                    >
                      Reject and release XP
                    </Button>
                  )}
                  {p.status === "approved" && canFinance && (
                    <>
                      <Button
                        variant="secondary"
                        busy={busy}
                        onClick={() => void reveal(p)}
                      >
                        Open private payment details
                      </Button>
                      <Button busy={busy} onClick={() => open(p, "complete")}>
                        Record manual payment
                      </Button>
                    </>
                  )}
                </div>
                {details?.id === p.id && (
                  <Alert tone="warning">
                    <p>
                      Private payment contact:{" "}
                      {details.handle || "Not recorded"}. Opening these details
                      was audited. Verify the recipient and send through your
                      approved external process. This page sends nothing.
                    </p>
                    <Button variant="quiet" onClick={() => setDetails(null)}>
                      Hide payment contact
                    </Button>
                  </Alert>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={page <= 1}
          disabledReason="This is the first page."
          onClick={() => setPage((n) => n - 1)}
        >
          Previous page
        </Button>
        <p>
          Page {page} of {Math.max(1, pages)}
        </p>
        <Button
          variant="secondary"
          disabled={page >= pages}
          disabledReason="There are no more records."
          onClick={() => setPage((n) => n + 1)}
        >
          Next page
        </Button>
        <Button
          variant="quiet"
          onClick={exportMasked}
          disabled={!items.length}
          disabledReason="No records to export."
        >
          Export masked records
        </Button>
      </div>
      <ButtonLink href="/admin/finance" variant="secondary">
        Finance and program terms
      </ButtonLink>
      <Dialog
        open={!!action}
        title={
          action?.action === "complete"
            ? "Record an external payment"
            : "Confirm staff decision"
        }
        onClose={() => {
          if (!busy) setAction(null);
        }}
        closeDisabledReason={busy ? "Wait for the decision result." : undefined}
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void decide();
          }}
        >
          <p>
            {action?.action === "complete"
              ? "Only record a payment already made and verified in your external bank, wallet or check workflow. Never send again because this save times out."
              : "This records a staff decision and its audit event. Approval does not send money."}
          </p>
          <label>
            Decision reason
            <textarea
              required
              maxLength={500}
              value={note}
              disabled={busy || !!retry.current}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {action?.action === "complete" && (
            <>
              <label>
                External payment reference
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  value={reference}
                  disabled={busy || !!retry.current}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <label>
                Actual payment date and time
                <input
                  type="datetime-local"
                  step="1"
                  required
                  value={paidAt}
                  disabled={busy || !!retry.current}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  disabled={busy}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I verified this external payment. Learn2Earn will only record
                it.
              </label>
            </>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" busy={busy}>
            {retry.current
              ? "Retry unchanged decision"
              : action?.action === "complete"
                ? "Save payment record"
                : "Save decision"}
          </Button>
          {!!retry.current && (
            <Button
              variant="quiet"
              onClick={() => {
                setAction(null);
                void load();
              }}
            >
              Check current status before another action
            </Button>
          )}
        </form>
      </Dialog>
    </section>
  );
}
