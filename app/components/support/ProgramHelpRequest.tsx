"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, ButtonLink, Card } from "../ui";
import styles from "./support.module.css";
type Metadata = {
  accountId: string | null;
  intake: {
    enabled: boolean;
    programName: string;
    teamName: string | null;
    monitoring: string | null;
    region: string | null;
  } | null;
};
type Receipt = {
  caseId: string;
  requestKey: string;
  createdAt: string;
  status: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  recipient: {
    programName?: string;
    teamName?: string;
    monitoring?: string;
  } | null;
};
export default function ProgramHelpRequest() {
  const [metadata, setMetadata] = useState<Metadata | null>(null),
    [message, setMessage] = useState(""),
    [share, setShare] = useState(false),
    [location, setLocation] = useState(""),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pendingKey, setPendingKey] = useState<string | null>(null),
    [confirmed, setConfirmed] = useState(false),
    key = useRef<string | null>(null),
    intent = useRef<object | null>(null),
    lock = useRef(false),
    mounted = useRef(true),
    generation = useRef(0);
  const remember = useCallback((id: string, k: string) => {
    key.current = k;
    setPendingKey(k);
    try {
      sessionStorage.setItem(`l2e-help-intent:${id}`, k);
    } catch {
      /* Pointer is optional; no request text/location is stored. */
    }
  }, []);
  const status = useCallback(
    async (k: string, accountId: string) => {
      const current = ++generation.current;
      setBusy(true);
      try {
        const r = await fetch(
            `/api/stress-signal?requestKey=${encodeURIComponent(k)}`,
            { credentials: "include", cache: "no-store" },
          ),
          d = await r.json();
        if (!mounted.current || current !== generation.current) return;
        if (!r.ok)
          throw new Error(d.error?.message || "Status is not confirmed yet.");
        if (d.receipt?.requestKey !== k || !d.receipt?.caseId)
          throw new Error("No saved receipt was confirmed.");
        setReceipt(d.receipt);
        setError("");
        remember(accountId, k);
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof Error
              ? e.message
              : "Status could not be checked. Human help remains available.",
          );
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [remember],
  );
  useEffect(() => {
    mounted.current = true;
    const c = new AbortController(),
      lifecycle = generation;
    fetch("/api/support", {
      credentials: "include",
      cache: "no-store",
      signal: c.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw new Error(
            d.error?.message || "Program support status unavailable.",
          );
        if (!mounted.current) return;
        setMetadata(d);
        if (d.accountId) {
          let k: string | null = null;
          try {
            k = sessionStorage.getItem(`l2e-help-intent:${d.accountId}`);
          } catch {
            /* Storage is optional. */
          }
          if (k && /^[0-9a-f-]{36}$/i.test(k)) {
            remember(d.accountId, k);
            void status(k, d.accountId);
          }
        }
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Program support status could not be checked.",
          );
      });
    return () => {
      mounted.current = false;
      c.abort();
      lifecycle.current++;
    };
  }, [remember, status]);
  async function send() {
    if (
      lock.current ||
      !metadata?.accountId ||
      !metadata.intake?.enabled ||
      !confirmed
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    const k = key.current || crypto.randomUUID();
    remember(metadata.accountId, k);
    const body = intent.current || {
      requestKey: k,
      expectedAccountId: metadata.accountId,
      message: message.trim(),
      shareLocation: share,
      location: share ? location.trim() || null : null,
    };
    intent.current = body;
    try {
      const r = await fetch("/api/stress-signal", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        }),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "The save could not be confirmed.");
      if (d.receipt?.requestKey !== k || !d.receipt?.caseId)
        throw new Error("The save did not return a confirmed receipt.");
      if (mounted.current) {
        setReceipt(d.receipt);
        setMessage("");
        setLocation("");
        setShare(false);
        intent.current = null;
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error && e.name !== "TimeoutError"
            ? e.message
            : "The connection was interrupted. We do not know whether the request saved. Check its status or retry unchanged details with the same key.",
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function newRequest() {
    if (!metadata?.accountId) return;
    try {
      sessionStorage.removeItem(`l2e-help-intent:${metadata.accountId}`);
    } catch {
      /* Optional storage. */
    }
    key.current = null;
    intent.current = null;
    setPendingKey(null);
    setReceipt(null);
    setConfirmed(false);
    setError("");
  }
  return (
    <Card>
      <h2>Request help from your program</h2>
      <p>
        This is a non-emergency program queue. Saving a request does not call,
        text, email or dispatch anyone. Public human-help numbers remain
        available above.
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      {!metadata ? (
        error ? (
          <>
            <p>
              Program support status is unavailable. Human resources above
              remain available.
            </p>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload program status
            </Button>
          </>
        ) : (
          <p role="status">Checking your program’s help options…</p>
        )
      ) : !metadata.accountId ? (
        <>
          <p>
            Sign in to see whether your program has a configured support team.
            Public help does not require an account.
          </p>
          <ButtonLink href="/login">Sign in for program requests</ButtonLink>
        </>
      ) : receipt ? (
        <div className={styles.status} role="status">
          <h3>Request saved to the program queue</h3>
          <p>
            {receipt.recipient?.teamName || "Authorized program support staff"}{" "}
            · {receipt.recipient?.programName || "your program"}
          </p>
          <p>
            Saved {new Date(receipt.createdAt).toLocaleString()}.{" "}
            {receipt.acknowledgedAt
              ? `A staff acknowledgment was recorded ${new Date(receipt.acknowledgedAt).toLocaleString()}. This is not confirmation of completed follow-up.`
              : "No staff acknowledgment is recorded. Saving is not a notification or proof that anyone has read it."}
          </p>
          <p>
            Monitoring stated when saved:{" "}
            {receipt.recipient?.monitoring || "not recorded"}. No response time
            is guaranteed.
          </p>
          <div className={styles.actions}>
            <Button
              busy={busy}
              variant="secondary"
              onClick={() => status(receipt.requestKey, metadata.accountId!)}
            >
              Check recorded status
            </Button>
            <Button
              variant="quiet"
              disabled={busy}
              disabledReason="Wait for the status check."
              onClick={newRequest}
            >
              Start a separate request
            </Button>
          </div>
        </div>
      ) : !metadata.intake?.enabled ? (
        <p>
          A monitored program request queue is not configured for this account.
          Use public human-help resources or your program’s verified direct
          contact. Hubert cannot contact a team for you.
        </p>
      ) : (
        <>
          <p>
            <strong>Recipient:</strong> authorized caseworkers and program
            administrators for {metadata.intake.programName}, listed as{" "}
            {metadata.intake.teamName}.
          </p>
          <p>
            <strong>Monitoring:</strong> {metadata.intake.monitoring}. Requests
            may be saved outside those hours; they are not continuously
            monitored and no response time is guaranteed.
          </p>
          {pendingKey && (
            <div className={styles.status}>
              <p>
                A request key is pending confirmation. Only its opaque key is
                kept in this browser tab; message and location are not saved in
                browser storage. After a reload, check status before starting
                another request.
              </p>
              <Button
                busy={busy}
                variant="secondary"
                onClick={() => status(pendingKey, metadata.accountId!)}
              >
                Check saved request status
              </Button>
            </div>
          )}
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label>
              What help are you asking your program for?
              <textarea
                maxLength={2000}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={busy || !!intent.current}
              />
            </label>
            <p>
              Your submitted request is stored as a private program case. Share
              only what staff needs to help; this is separate from AI chat.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={share}
                onChange={(e) => {
                  setShare(e.target.checked);
                  if (!e.target.checked) setLocation("");
                }}
                disabled={busy || !!intent.current}
              />
              I choose to share an optional location with my program staff.
            </label>
            {share && (
              <label>
                Location you choose to share (optional)
                <input
                  value={location}
                  maxLength={300}
                  autoComplete="off"
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={busy || !!intent.current}
                />
              </label>
            )}
            <p>
              No device location is collected. You can send this request without
              a location.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={busy}
              />
              I understand who can read this request, the monitoring notice and
              that it is not an emergency service.
            </label>
            <Button
              type="submit"
              busy={busy}
              disabled={!confirmed || !message.trim()}
              disabledReason="Add your request and confirm the recipient and monitoring notice."
            >
              {intent.current
                ? "Retry the same request"
                : "Save request to program queue"}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
