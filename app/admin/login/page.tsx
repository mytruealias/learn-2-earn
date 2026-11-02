"use client";
import { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import styles from "../login.module.css";
export default function AdminLoginPage() {
  const [step, setStep] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [code, setCode] = useState(""),
    [setupKey, setSetupKey] = useState(""),
    [recoveryCodes, setRecoveryCodes] = useState<string[]>([]),
    [next, setNext] = useState("ready"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const finish = (destination: string) => {
    window.location.href =
      destination === "ready" ? "/admin" : "/admin/programs";
  };
  useEffect(() => {
    staffFetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) finish("ready");
        else if (d.nextStep) {
          if (d.nextStep === "program") finish("program");
          else setStep(d.nextStep);
        }
      })
      .catch(() =>
        setError(
          "Sign-in status could not be checked. You can try signing in again.",
        ),
      );
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const body =
        step === "login"
          ? { email, password }
          : step === "password"
            ? { action: "password", currentPassword: password, newPassword }
            : { action: step, code };
      const r = await staffFetch(
        step === "login" ? "/api/admin/login" : "/api/admin/mfa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Sign-in could not be confirmed.");
      setPassword("");
      setNewPassword("");
      setCode("");
      if (d.recoveryCodes) {
        setRecoveryCodes(d.recoveryCodes);
        setNext(d.nextStep);
        setSetupKey("");
        setStep("codes");
      } else if (["ready", "program"].includes(d.nextStep)) finish(d.nextStep);
      else setStep(d.nextStep);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Check your connection and retry.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function setup() {
    setLoading(true);
    setError("");
    try {
      const r = await staffFetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Setup unavailable.");
      setSetupKey(d.setupKey);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Setup could not be loaded. Retry.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={styles.page} data-ui-shell="staff" data-design="staff">
      <main className={styles.card}>
        <div className={styles.brandWordmark}>
          Learn<span>2</span>Earn
        </div>
        <p>Private staff portal</p>
        <h1 className={styles.title}>
          {step === "login"
            ? "Staff sign in"
            : step === "password"
              ? "Choose your own password"
              : step === "enroll"
                ? "Set up your authenticator"
                : step === "codes"
                  ? "Save your recovery codes"
                  : step === "recover"
                    ? "Use a recovery code"
                    : "Verify your sign-in"}
        </h1>
        {error && (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        )}
        {step === "codes" ? (
          <>
            <p>
              Store these ten single-use codes somewhere private, separate from
              your phone. They are shown only now. Do not send them to staff or
              put them in a case record.
            </p>
            <ul className={styles.codes}>
              {recoveryCodes.map((c) => (
                <li key={c}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
            <button className={styles.submitBtn} onClick={() => finish(next)}>
              I saved my recovery codes
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            {step === "login" && (
              <div className={styles.field}>
                <label htmlFor="staff-email">Email</label>
                <input
                  className={styles.input}
                  id="staff-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            {["login", "password"].includes(step) && (
              <div className={styles.field}>
                <label htmlFor="staff-password">
                  {step === "password"
                    ? "Current temporary password"
                    : "Password"}
                </label>
                <input
                  className={styles.input}
                  id="staff-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {step === "password" && (
              <div className={styles.field}>
                <p>
                  Your temporary password must be replaced before program
                  access. Use at least 16 characters.
                </p>
                <label htmlFor="new-password">New password</label>
                <input
                  className={styles.input}
                  id="new-password"
                  type="password"
                  minLength={16}
                  maxLength={200}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {step === "enroll" && (
              <>
                <p>
                  In your authenticator app, add an account using a setup key.
                  Choose time-based codes, SHA-1, 6 digits, every 30 seconds. No
                  phone number or messaging provider is needed.
                </p>
                {setupKey ? (
                  <div className={styles.field}>
                    <label htmlFor="setup-key">
                      Private authenticator setup key
                    </label>
                    <input
                      className={styles.input}
                      id="setup-key"
                      readOnly
                      value={setupKey}
                      autoComplete="off"
                    />
                    <p>
                      Keep this key private. Enter the current code below to
                      finish.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.submitBtn}
                    disabled={loading}
                    onClick={setup}
                  >
                    Show my setup key
                  </button>
                )}
              </>
            )}
            {["verify", "recover", "enroll"].includes(step) &&
              (step !== "enroll" || setupKey) && (
                <div className={styles.field}>
                  <label htmlFor="staff-code">
                    {step === "recover"
                      ? "Unused recovery code"
                      : "Authenticator code"}
                  </label>
                  <input
                    id="staff-code"
                    className={styles.input}
                    inputMode={step === "recover" ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={step === "recover" ? 100 : 6}
                  />
                </div>
              )}
            {(step !== "enroll" || setupKey) && (
              <button className={styles.submitBtn} disabled={loading}>
                {loading
                  ? "Checking…"
                  : step === "login"
                    ? "Continue"
                    : step === "password"
                      ? "Save password"
                      : "Verify and continue"}
              </button>
            )}
          </form>
        )}
        {step === "verify" && (
          <button
            className={styles.textBtn}
            onClick={() => {
              setCode("");
              setStep("recover");
            }}
          >
            Use a recovery code instead
          </button>
        )}
        {step === "recover" && (
          <button
            className={styles.textBtn}
            onClick={() => {
              setCode("");
              setStep("verify");
            }}
          >
            Use my authenticator instead
          </button>
        )}
        {step !== "codes" && (
          <p className={styles.support}>
            Lost access or password? Contact your organization’s verified
            program administrator. If both factors are unavailable, a verified
            platform operator must complete the documented recovery process.
            This page sends no reset email. <a href="/lifeline">Public help</a>{" "}
            remains available.
          </p>
        )}
      </main>
    </div>
  );
}
