"use client";
import { useRef, useState } from "react";
import { Alert, Button, Card, ButtonLink } from "@/app/components/ui";
import {
  usd,
  methodDefinitions,
  legacyMethods,
  type RewardMethod,
} from "@/lib/rewards/money";
import type { financeData } from "@/lib/rewards/finance";
import styles from "../../profile/rewards.module.css";
export type FinanceData = Awaited<ReturnType<typeof financeData>>;
export default function FinanceClient({
  initialData,
}: {
  initialData: FinanceData;
}) {
  const [data, setData] = useState(initialData),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | null>(null),
    lock = useRef(false);
  const [amount, setAmount] = useState(""),
    [reason, setReason] = useState("");
  const [editing, setEditing] = useState<string | null>(null),
    [name, setName] = useState(""),
    [slug, setSlug] = useState(""),
    [rate, setRate] = useState(""),
    [min, setMin] = useState(""),
    [cap, setCap] = useState(""),
    [methods, setMethods] = useState<RewardMethod[]>(legacyMethods),
    [separate, setSeparate] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [active, setActive] = useState(true);
  const [assignmentUser, setAssignmentUser] = useState(""),
    [assignmentProgram, setAssignmentProgram] = useState(""),
    [assignmentReason, setAssignmentReason] = useState("");
  async function run(path: string, method: string, body: object) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Operation could not be confirmed.",
        );
      setMessage("Saved and audited. No external transfer was performed.");
      const fresh = await fetch("/api/admin/finance", { cache: "no-store" });
      if (!fresh.ok)
        throw new Error("Saved; refresh the page to verify the latest totals.");
      setData(await fresh.json());
      setKey(null);
      setConfirmed(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "This operation could not be confirmed. Retry unchanged details with the same key.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function edit(c: FinanceData["configs"][number]) {
    setEditing(c.id);
    setName(c.programName);
    setSlug(c.programSlug);
    setRate(c.rateExact || String(c.xpToDollar));
    setMin(String(c.minimumXp));
    setCap(String(c.weeklyXpCap));
    setMethods(c.paymentMethods ? JSON.parse(c.paymentMethods) : legacyMethods);
    setSeparate(c.separateApprover);
    setActive(c.isActive);
    setConfirmed(false);
  }
  return (
    <section
      aria-label="Reward finance operations"
      data-design="admin"
      className={styles.page}
    >
      <h1>Reward finance</h1>
      <p>
        Approvals authorize a manual payment. Only a recorded external payment
        is counted as paid. Learn2Earn does not send these payments.
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <p role="status">{message}</p>}
      <div className={styles.grid}>
        {data.windows.map((w) => (
          <Card key={w.days}>
            <h2>Paid in {w.days} days</h2>
            <p className={styles.amount}>
              {w.cents === null ? "Needs reconciliation" : usd(w.cents)}
            </p>
            <p>{w.count} recorded payments with actual timestamps</p>
          </Card>
        ))}
        <Card>
          <h2>Awaiting payment</h2>
          <p className={styles.amount}>
            {data.pending.cents === null
              ? "Needs reconciliation"
              : usd(data.pending.cents)}
          </p>
          <p>
            {data.pending.count} reserved requests, including{" "}
            {data.pending.approved} approved. These amounts are not paid.
          </p>
        </Card>
      </div>
      <Card>
        <h2>Historical payment dates</h2>
        <p>
          {data.legacyPaid.count} completed legacy records lack an actual
          payment timestamp. Recorded value:{" "}
          {data.legacyPaid.cents === null
            ? "needs reconciliation"
            : usd(data.legacyPaid.cents)}
          . They remain in all-time paid totals but are excluded from dated
          windows.
        </p>
      </Card>
      <Card>
        <h2>Reconciliation</h2>
        <p>
          {data.reconciliation.uninitialized} accounts await initialization;{" "}
          {data.reconciliation.legacyRequests} requests await exact
          amounts/snapshots. {data.reconciliation.adjustmentAccounts} legacy XP
          differences need explicit review.
        </p>
        <p>
          {data.reconciliation.issues.length
            ? `Blocked: ${data.reconciliation.issues.join(", ")}`
            : "No blocking reconciliation issues detected in this read-only report."}
        </p>
        <p>
          Review hash: <code>{data.reconciliation.hash}</code>
        </p>
        <p>
          An operator must run the documented dry-run/backfill command against a
          verified target. This page does not repair history.
        </p>
      </Card>
      <Card>
        <h2>Manual bookkeeping pool</h2>
        <p className={styles.amount}>{usd(data.pool.balanceCents)}</p>
        <p>
          This is a bookkeeping budget, not a bank balance. New payment records
          debit it once. Historical imports do not debit it again; verify the
          opening balance before release.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const k = key || crypto.randomUUID();
            setKey(k);
            void run("/api/admin/finance/pool", "POST", {
              requestKey: k,
              amountCents: Number(amount),
              reason,
            });
          }}
          className={styles.form}
        >
          <label>
            Adjustment in integer cents
            <input
              type="number"
              required
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              required
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button type="submit" busy={busy}>
            Record pool adjustment
          </Button>
        </form>
        <ul>
          {data.adjustments.map((a) => (
            <li key={a.id}>
              {usd(a.amountCents)} · {a.reason} ·{" "}
              {new Date(a.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2>Stripe balance connection</h2>
        <p>
          {!data.stripe.configured
            ? "Not configured. Manual methods do not require Stripe."
            : data.stripe.error ||
              `Read-only balance: ${data.stripe.availableCents === null ? "unavailable" : usd(data.stripe.availableCents)} available; ${data.stripe.pendingCents === null ? "unavailable" : usd(data.stripe.pendingCents)} pending.`}
        </p>
        <p>
          This connection neither sends program payouts nor proves a Zelle,
          check or wallet transfer occurred.
        </p>
      </Card>
      <Card>
        <h2>Versioned program terms</h2>
        <p>
          Current default contract: USD {data.defaultRules.rate} per XP; minimum{" "}
          {data.defaultRules.minXp} XP; rolling seven-day cap{" "}
          {data.defaultRules.weeklyXpCap} XP. Enabled methods:{" "}
          {data.defaultRules.methods
            .map((m) => methodDefinitions[m].label)
            .join(", ") || "none"}
          .
        </p>
        <p>
          Fallback terms remain the established contract when no active
          program/default configuration exists. Changes affect new quotes, never
          existing request snapshots.
        </p>
        <ul>
          {data.configs.map((c) => (
            <li key={c.id}>
              <Button variant="secondary" onClick={() => edit(c)}>
                {c.programName} · version {c.version}
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="quiet"
          onClick={() => {
            setEditing(null);
            setName("");
            setSlug("");
            setRate("");
            setMin("");
            setCap("");
            setConfirmed(false);
          }}
        >
          New program
        </Button>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            const common = {
              programName: name,
              xpToDollar: rate,
              minimumXp: Number(min),
              weeklyXpCap: Number(cap),
              methods,
              separateApprover: separate,
              manualWorkflowConfirmed: confirmed,
            };
            const c = data.configs.find((c) => c.id === editing);
            void run(
              "/api/admin/finance/payout-config",
              c ? "PUT" : "POST",
              c
                ? { ...common, id: c.id, version: c.version, isActive: active }
                : { ...common, programSlug: slug },
            );
          }}
        >
          <label>
            Program name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Program slug
            <input
              required
              disabled={!!editing}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <span>
              {editing
                ? "Existing program identity stays unchanged."
                : "Lowercase letters, numbers and hyphens."}
            </span>
          </label>
          <label>
            USD per XP (exact decimal)
            <input
              required
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </label>
          <label>
            Minimum XP
            <input
              required
              type="number"
              min="1"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </label>
          <label>
            Rolling seven-day XP cap
            <input
              required
              type="number"
              min="1"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </label>
          <fieldset>
            <legend>Supported manual payment methods</legend>
            {Object.entries(methodDefinitions).map(([m, d]) => (
              <label className={styles.check} key={m}>
                <input
                  type="checkbox"
                  checked={methods.includes(m as RewardMethod)}
                  onChange={(e) =>
                    setMethods(
                      e.target.checked
                        ? [...methods, m as RewardMethod]
                        : methods.filter((x) => x !== m),
                    )
                  }
                />
                {d.label}
              </label>
            ))}
          </fieldset>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={separate}
              onChange={(e) => setSeparate(e.target.checked)}
            />
            Require different reviewer and approver
          </label>
          {editing && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active configuration
            </label>
          )}
          <label className={styles.check}>
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I confirm staff can manually deliver every selected method and have
            verified these program terms.
          </label>
          <Button
            busy={busy}
            type="submit"
            disabled={!confirmed}
            disabledReason="Confirm verified terms and manual delivery before saving."
          >
            Save program version
          </Button>
        </form>
      </Card>
      <Card>
        <h2>Verified financial program assignment</h2>
        <p>
          Editing a learner’s contact city does not change their reward program.
          Confirm eligibility through your program’s trusted process before
          changing this assignment; existing requests keep their snapshots.
        </p>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            const k = key || crypto.randomUUID();
            setKey(k);
            void run("/api/admin/rewards/program", "POST", {
              userId: assignmentUser,
              programSlug: assignmentProgram || null,
              reason: assignmentReason,
              requestKey: k,
            });
          }}
        >
          <label>
            Learner record ID
            <input
              required
              value={assignmentUser}
              onChange={(e) => setAssignmentUser(e.target.value)}
            />
          </label>
          <label>
            Configured program slug (blank for default)
            <input
              value={assignmentProgram}
              onChange={(e) => setAssignmentProgram(e.target.value)}
            />
          </label>
          <label>
            Eligibility verification reason
            <input
              required
              value={assignmentReason}
              onChange={(e) => setAssignmentReason(e.target.value)}
            />
          </label>
          <Button busy={busy} type="submit">
            Record verified assignment
          </Button>
        </form>
      </Card>
      <ButtonLink href="/admin/payouts">Review payment requests</ButtonLink>
    </section>
  );
}
