"use client";
import { useEffect, useRef, useState } from "react";
import { Alert, Button } from "../ui";
import type { InquiryReceipt } from "@/lib/marketing/inquiries";
import styles from "./marketing.module.css";
type Configuration = {
  configured: boolean;
  team: string | null;
  monitoring: string | null;
};
export default function PartnerInquiryForm() {
  const [config, setConfig] = useState<Configuration | null>(null),
    [error, setError] = useState(""),
    [fields, setFields] = useState<Record<string, string[]>>({}),
    [form, setForm] = useState({
      fullName: "",
      organization: "",
      email: "",
      interest: "pilot",
      region: "",
      message: "",
    }),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<InquiryReceipt | null>(null),
    [pending, setPending] = useState(false),
    intent = useRef<object | null>(null),
    key = useRef<string | null>(null),
    lock = useRef(false);
  useEffect(() => {
    const c = new AbortController();
    try {
      key.current = sessionStorage.getItem("l2e-partner-inquiry-key");
      if (key.current && !/^[0-9a-f-]{36}$/i.test(key.current))
        key.current = null;
      setPending(!!key.current);
    } catch {
      /* Optional pointer only; no contact/message storage. */
    }
    const city = new URLSearchParams(location.search).get("city");
    if (city && /^[a-z-]{1,50}$/.test(city))
      setForm((f) => ({ ...f, region: city }));
    fetch("/api/partner-inquiries", { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setConfig(await r.json());
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            "The intake configuration could not be checked. Reload to try again; no inquiry has been confirmed.",
          );
      });
    return () => c.abort();
  }, []);
  async function submit() {
    if (lock.current || !config?.configured || !consent) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setFields({});
    const requestKey = key.current || crypto.randomUUID();
    key.current = requestKey;
    try {
      sessionStorage.setItem("l2e-partner-inquiry-key", requestKey);
    } catch {
      /* Never store fields. */
    }
    setPending(true);
    const body = intent.current || { ...form, requestKey, consent: true };
    intent.current = body;
    try {
      const r = await fetch("/api/partner-inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        }),
        d = await r.json();
      if (!r.ok) {
        if (r.status === 400 || r.status === 409) intent.current = null;
        if (d.error?.fields) setFields(d.error.fields);
        throw new Error(d.error?.message || "Saving could not be confirmed.");
      }
      if (
        !d.receipt?.reference ||
        d.receipt?.state !== "saved" ||
        d.receipt?.notificationSent !== false ||
        d.receipt?.bookingCreated !== false
      )
        throw new Error(
          "No valid server receipt was returned. Retry unchanged details.",
        );
      setReceipt(d.receipt);
      intent.current = null;
      setForm({
        fullName: "",
        organization: "",
        email: "",
        interest: "pilot",
        region: "",
        message: "",
      });
      try {
        sessionStorage.removeItem("l2e-partner-inquiry-key");
      } catch {
        /* Optional storage. */
      }
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "The connection timed out. We do not know whether storage completed. Retry the same details; do not assume an email or booking was sent.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div className={styles.receipt} role="status">
        <h3>Inquiry saved to the intake queue</h3>
        <p>Reference: {receipt.reference}</p>
        <p>
          Saved {new Date(receipt.savedAt).toLocaleString()}. Keep this reference
          for your agreed follow-up process.
        </p>
        <p>
          This confirms storage only. No email was sent, no meeting was booked,
          and no staff response or response time is confirmed.
        </p>
      </div>
    );
  return (
    <div>
      {error && <Alert tone="error">{error}</Alert>}
      {!config ? (
        <p role="status">
          {error
            ? "Intake status is unavailable. Reload this page to retry."
            : "Checking the inquiry queue…"}
        </p>
      ) : !config.configured ? (
        <div className={styles.notice}>
          <h3>Online intake is not enabled yet</h3>
          <p>
            A responsible team and reviewed program queue must be configured
            before this form can save. No message or booking has been sent. This
            is not a monitored support channel.
          </p>
        </div>
      ) : (
        <p className={styles.notice}>
          <strong>Recipient:</strong> {config.team}, through authorized
          administrators of the configured intake program.{" "}
          <strong>Monitoring:</strong> {config.monitoring}. Storage does not
          send an email or calendar invitation.
        </p>
      )}
      {pending && (
        <p className={styles.small}>
          An inquiry key is retained in this tab for retry protection. No form
          fields are stored. If you reloaded after an interrupted save, re-enter
          the same details to recover the existing receipt.
        </p>
      )}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {(
          [
            ["fullName", "Your name", 100],
            ["organization", "Organization", 160],
            ["email", "Work email", 254],
            ["region", "Region or city (optional)", 100],
          ] as const
        ).map(([name, label, max]) => (
          <div key={name} className={styles.field}>
            <label htmlFor={`inquiry-${name}`}>{label}</label>
            <input
              id={`inquiry-${name}`}
              name={name}
              type={name === "email" ? "email" : "text"}
              autoComplete={
                name === "fullName"
                  ? "name"
                  : name === "email"
                    ? "email"
                    : name === "organization"
                      ? "organization"
                      : "off"
              }
              maxLength={max}
              required={name !== "region"}
              aria-invalid={!!fields[name] || undefined}
              aria-describedby={
                fields[name] ? `inquiry-error-${name}` : undefined
              }
              disabled={busy || !!intent.current}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            />
            {fields[name] && (
              <p id={`inquiry-error-${name}`} className={styles.small}>
                {fields[name][0]}
              </p>
            )}
          </div>
        ))}
        <label>
          What would you like to explore?
          <select
            value={form.interest}
            disabled={busy || !!intent.current}
            onChange={(e) => setForm({ ...form, interest: e.target.value })}
          >
            <option value="pilot">A program pilot</option>
            <option value="demo">A product demonstration</option>
            <option value="funding">Funding a proposed program</option>
            <option value="general">Another partnership question</option>
          </select>
        </label>
        <label>
          Anything useful to know? (optional)
          <textarea
            value={form.message}
            maxLength={1000}
            disabled={busy || !!intent.current}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        <p className={styles.small}>
          No participant or sensitive personal information, please. Inquiry
          details are stored for the authorized intake team; retention and
          follow-up must follow its reviewed operating policy.{" "}
          <a className={styles.textLink} href="/privacy">
            Privacy summary
          </a>
        </p>
        <label className={styles.check}>
          <input
            type="checkbox"
            required
            checked={consent}
            disabled={busy}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I agree to share these contact details with the stated intake team so
          they can review and respond to this inquiry.
        </label>
        <Button
          type="submit"
          busy={busy}
          disabled={!config?.configured || !consent}
          disabledReason={
            !config?.configured
              ? "The reviewed intake queue must be configured before submission."
              : "Confirm consent to share your contact details."
          }
        >
          {intent.current ? "Retry unchanged inquiry" : "Save partner inquiry"}
        </Button>
        <p className={styles.small}>
          A saved receipt is not an email, booking, contract or response
          guarantee.
        </p>
      </form>
    </div>
  );
}
