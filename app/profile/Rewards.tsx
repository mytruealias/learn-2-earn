"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Dialog,
  ErrorState,
  Skeleton,
} from "../components/ui";
import type { rewardSummary } from "@/lib/rewards/accounting";
import {
  centsForXp,
  exactCents,
  methodDefinitions,
  usd,
} from "@/lib/rewards/money";
import styles from "./rewards.module.css";
type Summary = Awaited<ReturnType<typeof rewardSummary>>;
export default function Rewards() {
  const [data, setData] = useState<Summary | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [xp, setXp] = useState(""),
    [method, setMethod] = useState(""),
    [handle, setHandle] = useState(""),
    [confirm, setConfirm] = useState(false),
    [cancel, setCancel] = useState<string | null>(null),
    [confirmed, setConfirmed] = useState(false);
  const lock = useRef(false),
    intent = useRef<{ key: string; body: object } | null>(null),
    cancelIntent = useRef<string | null>(null),
    [uncertain, setUncertain] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/rewards", {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Rewards could not load.");
      try {
        const stored = sessionStorage.getItem(
          `l2e_reward_intent:${d.accountId}`,
        );
        if (
          stored &&
          d.payouts.some(
            (p: { requestKey: string | null }) => p.requestKey === stored,
          )
        )
          sessionStorage.removeItem(`l2e_reward_intent:${d.accountId}`);
      } catch {}
      setData(d);
      setXp((current) => current || String(d.rules.minXp));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Rewards could not load. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit() {
    if (lock.current || !data) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!intent.current) {
        let key = crypto.randomUUID();
        try {
          const storage = `l2e_reward_intent:${data.accountId}`;
          const previous = sessionStorage.getItem(storage);
          if (previous && /^[0-9a-f-]{36}$/i.test(previous))
            key =
              previous as `${string}-${string}-${string}-${string}-${string}`;
          sessionStorage.setItem(storage, key);
        } catch {}
        intent.current = {
          key,
          body: {
            xpAmount: Number(xp),
            paymentMethod: method,
            paymentHandle: handle.trim(),
            ruleVersion: data.rules.version,
          },
        };
      }
      const r = await fetch("/api/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...intent.current.body,
          requestKey: intent.current.key,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error?.code === "rules_changed") {
          intent.current = null;
          setConfirm(false);
          setConfirmed(false);
          await load();
        }
        throw new Error(d.error?.message || "Your request was not accepted.");
      }
      try {
        sessionStorage.removeItem(`l2e_reward_intent:${data.accountId}`);
      } catch {}
      intent.current = null;
      setUncertain(false);
      setConfirm(false);
      setHandle("");
      setConfirmed(false);
      setMessage(
        "Request saved. XP is reserved while staff reviews it. This is not a payment; check the timeline here for updates.",
      );
      await load();
    } catch (e) {
      setUncertain(!!intent.current);
      setError(
        e instanceof Error && !(e instanceof TypeError)
          ? e.message
          : "Your request could not be confirmed. Keep these details unchanged and retry, or reload and check history before making another request.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function cancelRequest() {
    if (lock.current || !cancel) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      cancelIntent.current ||= crypto.randomUUID();
      const r = await fetch("/api/payout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: cancel,
          requestKey: cancelIntent.current,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Cancellation could not be confirmed.",
        );
      setCancel(null);
      cancelIntent.current = null;
      setMessage("Cancellation saved. Reserved XP is available again.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Cancellation could not be confirmed. Retry the same cancellation.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  let preview: number | null = null;
  try {
    if (data && Number(xp) > 0)
      preview = centsForXp(Number(xp), data.rules.rate);
  } catch {}
  const canRequest =
    data?.reconciled &&
    data.profileReady &&
    data.availableXp >= data.rules.minXp &&
    data.weeklyRemaining >= data.rules.minXp &&
    data.rules.methods.length > 0;
  const labels: Record<string, string> = {
    pending: "Awaiting staff review",
    reviewed: "Reviewed; awaiting approval",
    approved: "Approved; payment not recorded",
    completed: "Payment recorded by staff",
    rejected: "Not approved; XP released",
    cancelled: "Cancelled; XP released",
  };
  return (
    <section id="payout-request" data-design="rewards" className={styles.page}>
      <header>
        <p className={styles.label}>Your learning and rewards</p>
        <h1>Rewards</h1>
        <p>
          XP records learning. Available reward value is an estimate at your
          current program rate. Requests reserve XP; approval and payment are
          separate steps.
        </p>
      </header>
      {message && <p role="status">{message}</p>}
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <Skeleton label="Loading reward balances" />
      ) : !data ? (
        <ErrorState onRetry={() => void load()}>
          Your rewards could not load.
        </ErrorState>
      ) : (
        <>
          <div className={styles.grid}>
            <Card>
              <h2>Lifetime XP record</h2>
              <p className={styles.amount}>{data.lifetimeXp} XP</p>
              <p>Learning history stays when you request or receive rewards.</p>
            </Card>
            <Card>
              <h2>Available to request</h2>
              <p className={styles.amount}>
                {data.reconciled
                  ? usd(exactCents(data.availableXp, data.rules.rate))
                  : "Needs reconciliation"}
              </p>
              <p>
                {data.availableXp} unreserved reward XP · estimated value, not
                money sent
              </p>
            </Card>
            <Card>
              <h2>Pending decisions or payment</h2>
              <p className={styles.amount}>
                {data.pendingCents === null
                  ? "Needs reconciliation"
                  : usd(data.pendingCents)}
              </p>
              <p>
                {data.reservedXp} XP reserved. Includes approved requests
                without a recorded payment.
              </p>
            </Card>
            <Card>
              <h2>Payments recorded</h2>
              <p className={styles.amount}>
                {data.paidCents === null
                  ? "Needs reconciliation"
                  : usd(data.paidCents)}
              </p>
              <p>
                Recorded paid amounts only. Approval does not count as payment.
              </p>
            </Card>
          </div>
          <Card>
            <h2>Current program terms</h2>
            <p>
              {data.rules.programName || "Established program fallback"} · USD{" "}
              {data.rules.rate} per XP
            </p>
            <p>
              Minimum: {data.rules.minXp} XP (
              {usd(exactCents(data.rules.minXp, data.rules.rate))}). Rolling
              seven-day cap: {data.rules.weeklyXpCap} XP. Remaining in this
              window: {data.weeklyRemaining} XP.
            </p>
            <p>
              Each request keeps these terms when accepted. Later rate changes
              do not reprice it. Ask trusted staff if your program assignment
              needs correcting.
            </p>
            <p>
              Supported methods:{" "}
              {data.rules.methods
                .map((m) => methodDefinitions[m].label)
                .join(", ") || "None enabled; ask staff"}
              . All are delivered manually by authorized staff outside
              Learn2Earn.
            </p>
          </Card>
          {!data.reconciled && (
            <Alert tone="warning">
              Your historical reward records need staff reconciliation before a
              new request. Your learning and earned balances have not been
              erased. Ask your program’s trusted staff for help.
            </Alert>
          )}
          {!data.profileReady && (
            <Alert tone="info">
              Add your name and email in Profile before requesting a reward.
              Other sensitive profile fields are optional.
            </Alert>
          )}
          <Card>
            <h2>Request a reward</h2>
            <p>
              Review your amount and payment contact before confirming. Staff
              must review and approve, then separately record a manual payment.
              Check the request timeline here for updates.
            </p>
            {data.reservedXp > 0 && (
              <p>
                You already have reward XP reserved. Check existing requests
                below before making another.
              </p>
            )}
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                setConfirm(true);
                setConfirmed(false);
              }}
            >
              <label>
                XP to request
                <input
                  required
                  type="number"
                  step="1"
                  min={data.rules.minXp}
                  max={Math.min(
                    data.availableXp,
                    data.weeklyRemaining,
                    1000000,
                  )}
                  value={xp}
                  disabled={busy || uncertain || !canRequest}
                  onChange={(e) => setXp(e.target.value)}
                />
              </label>
              <label>
                Payment method
                <select
                  aria-label="Payment method"
                  required
                  disabled={busy || uncertain || !canRequest}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="">Choose a supported method</option>
                  {data.rules.methods.map((m) => (
                    <option key={m} value={m}>
                      {methodDefinitions[m].label}
                    </option>
                  ))}
                </select>
              </label>
              {method && (
                <p id="method-help">
                  {
                    methodDefinitions[method as keyof typeof methodDefinitions]
                      .instruction
                  }
                </p>
              )}
              <label>
                Payment contact or mailing address
                <input
                  required
                  autoComplete="off"
                  maxLength={255}
                  value={handle}
                  disabled={busy || uncertain || !canRequest}
                  aria-describedby={method ? "method-help" : undefined}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </label>
              <p>
                Quoted request:{" "}
                {preview === null ? "enter a valid amount" : usd(preview)}. Your
                handle is private and masked in history.
              </p>
              <Button
                type="submit"
                busy={busy}
                disabled={
                  !canRequest ||
                  preview === null ||
                  !method ||
                  !handle.trim() ||
                  uncertain
                }
                disabledReason={
                  !canRequest
                    ? "Available balance, program methods, profile and reconciliation must meet the terms above."
                    : uncertain
                      ? "Retry the unchanged request or check history before starting another."
                      : "Enter an amount, supported method and payment contact."
                }
              >
                Review request
              </Button>
              {uncertain && (
                <Button onClick={() => void submit()} busy={busy}>
                  Retry unchanged request
                </Button>
              )}
              <Button
                type="button"
                variant="quiet"
                onClick={() => {
                  setUncertain(false);
                  intent.current = null;
                  setConfirm(false);
                  void load();
                }}
              >
                Reload balances and check history
              </Button>
            </form>
          </Card>
          <section aria-label="Reward request history">
            <h2>Request history</h2>
            {!data.payouts.length ? (
              <Card>
                <p>
                  No reward requests yet. Learning stays available whether you
                  request a reward or not.
                </p>
              </Card>
            ) : (
              <ul className={styles.list}>
                {data.payouts.map((p) => (
                  <li key={p.id}>
                    <Card>
                      <h3>
                        {p.amountCents === null
                          ? "Legacy amount awaiting reconciliation"
                          : usd(p.amountCents)}{" "}
                        · {p.xpAmount} XP
                      </h3>
                      <p>
                        {labels[p.status] ||
                          "Status needs staff reconciliation"}
                      </p>
                      <p>
                        {p.paymentMethod
                          ? methodDefinitions[p.paymentMethod].label
                          : "Method not recorded"}{" "}
                        · {p.paymentHandle}
                      </p>
                      <p>Requested {new Date(p.createdAt).toLocaleString()}</p>
                      <p>
                        {p.rulesSnapshot?.source === "legacy-record"
                          ? "Historical terms were not recorded. The original recorded amount is preserved."
                          : p.rulesSnapshot
                            ? `Accepted rate: USD ${p.rulesSnapshot.rate} per XP. Request terms are saved.`
                            : "Historical terms await reconciliation."}
                      </p>
                      <ol>
                        {p.events.map((event, n) => (
                          <li key={n}>
                            {event.action === "legacy-import"
                              ? "Historical status imported; this is not its original payment date"
                              : labels[event.status || ""] || event.action}{" "}
                            · {new Date(event.at).toLocaleString()}
                          </li>
                        ))}
                      </ol>
                      {p.paidAt && (
                        <p>
                          External payment time recorded by staff:{" "}
                          {new Date(p.paidAt).toLocaleString()}
                        </p>
                      )}
                      {p.status === "completed" && !p.paidAt && (
                        <p>
                          Legacy record: actual payment date was not captured.
                        </p>
                      )}
                      {p.status === "pending" && p.amountCents !== null && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setCancel(p.id);
                            cancelIntent.current = null;
                          }}
                        >
                          Cancel this request
                        </Button>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <Dialog
        open={confirm}
        title="Confirm reward request"
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        closeDisabledReason={busy ? "Wait for the request result." : undefined}
      >
        <p>
          {xp} XP for {preview === null ? "an unavailable quote" : usd(preview)}{" "}
          via{" "}
          {method
            ? methodDefinitions[method as keyof typeof methodDefinitions].label
            : "your selected method"}
          . This reserves XP and sends no money.
        </p>
        <p>
          Contact: {handle}. Check it carefully; it is masked after submission.
        </p>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={busy}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I checked the amount, program terms and payment contact.
        </label>
        {error && <Alert tone="error">{error}</Alert>}
        <Button
          onClick={() => void submit()}
          busy={busy}
          disabled={!confirmed}
          disabledReason="Confirm you checked the details before submitting."
        >
          {uncertain ? "Retry unchanged request" : "Confirm request"}
        </Button>
      </Dialog>
      <Dialog
        open={!!cancel}
        title="Cancel this pending request?"
        onClose={() => {
          if (!busy) setCancel(null);
        }}
        closeDisabledReason={
          busy ? "Wait for cancellation confirmation." : undefined
        }
      >
        <p>
          Only an unreviewed request can be cancelled here. Its reserved XP
          becomes available once. No payment is sent or reversed.
        </p>
        <Button busy={busy} onClick={() => void cancelRequest()}>
          Confirm cancellation
        </Button>
      </Dialog>
      <ButtonLink href="/lifeline" variant="quiet">
        Get help
      </ButtonLink>
    </section>
  );
}
