"use client";
import { useRef, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Alert, Button, ButtonLink, Card, Dialog, Field } from "../ui";
import { HubertIcon } from "../icons";
import { registrationSchema, loginSchema } from "@/lib/learner-auth-schema";
import {
  LEARNING_GOALS,
  safeLearnerDestination,
} from "@/lib/learner-navigation";
import styles from "./journey.module.css";

type Mode = "access" | "login" | "signup" | "onboarding";
export default function Journey({
  mode,
  next: rawNext,
  unlocked = false,
  reason = "",
  guest = false,
}: {
  mode: Mode;
  next: string;
  unlocked?: boolean;
  reason?: string;
  guest?: boolean;
}) {
  const next = safeLearnerDestination(rawNext);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const [allowed, setAllowed] = useState(unlocked);
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [slow, setSlow] = useState(false);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    if (!busy) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [busy]);
  useEffect(() => {
    if (mode === "onboarding" && step === 2)
      document.getElementById("privacy")?.focus();
  }, [mode, step]);
  function failValidation(errors: Record<string, string>) {
    setFields(errors);
    setError(
      "Check the highlighted fields. Your information has not been submitted.",
    );
    const first = ["code", "fullName", "email", "password", "goal"].find(
      (key) => errors[key],
    );
    document.getElementById(`journey-${first}`)?.focus();
  }
  async function send(
    path: string,
    body: object,
    method: "POST" | "DELETE" = "POST",
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      const response = await fetch(path, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(
          data.error?.message ||
            "This could not be confirmed. Try again when your connection is ready.",
        );
        if (data.error?.fields)
          setFields(
            Object.fromEntries(
              Object.entries(data.error.fields as Record<string, string[]>).map(
                ([key, values]) => [key, values[0]],
              ),
            ),
          );
        return;
      }
      if (path === "/api/access") {
        setAllowed(true);
        return;
      }
      if (method === "DELETE") {
        window.location.assign(`/access?next=${encodeURIComponent(next)}`);
        return;
      }
      // Full navigation drops cached private views and reads the confirmed server cookie.
      window.location.assign(
        data.onboardingRequired || mode === "signup"
          ? `/onboarding?next=${encodeURIComponent(next)}`
          : next,
      );
    } catch {
      setError(
        method === "DELETE"
          ? "Clearing this device’s sign-in could not be confirmed. Please try again before leaving a shared device."
          : mode === "signup"
            ? "We could not confirm whether your account was created. Try signing in with the same email and password before creating another account."
            : mode === "onboarding"
              ? "We could not confirm the save. Your account is already created. Keep this page open and try saving again, or reload to resume."
              : "The connection was interrupted. Your saved work has not been deleted. Try again when you are connected.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "access") {
      if (!code.trim())
        return failValidation({
          code: "Enter the code from your program invitation.",
        });
      void send("/api/access", { code: code.trim() });
      return;
    }
    if (mode === "onboarding") {
      if (step === 1) {
        setStep(2);
        return;
      }
      void send("/api/user/onboarding", { goal: goal || null });
      return;
    }
    const parsed =
      mode === "signup"
        ? registrationSchema.safeParse(form)
        : loginSchema.safeParse({ email: form.email, password: form.password });
    if (!parsed.success)
      return failValidation(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, values]) => [key, values![0]],
          ),
        ),
      );
    void send(
      `/api/auth/${mode === "signup" ? "register" : "login"}`,
      parsed.data,
    );
  }
  const titles = {
    access: allowed ? "You’re ready to begin" : "Welcome to Learn2Earn",
    login: "Welcome back",
    signup: "Create your account",
    onboarding:
      step === 1 ? "Small steps, at your pace" : "Your privacy and your pace",
  };
  const url = (path: string) => `${path}?next=${encodeURIComponent(next)}`;
  return (
    <>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          {mode === "onboarding"
            ? `Welcome · Step ${step} of 2`
            : "Learning that fits your life"}
        </p>
        <h1>{titles[mode]}</h1>
        <p>
          {mode === "access"
            ? "Use the invitation code from your program. You can take your time here."
            : mode === "login"
              ? "Sign in to pick up your saved learning."
              : mode === "signup"
                ? "Save your progress so you can return on another device. Start with just three details."
                : "Your account is ready. You can reload and return to these welcome steps."}
        </p>
      </div>
      {reason === "expired" && (
        <Alert>
          Your session ended. Sign in again to resume your saved work. This does
          not delete your account.
        </Alert>
      )}
      {reason === "signed-out" && (
        <Alert tone="success">
          You’re signed out on this device. Sign in when you’re ready to return.
        </Alert>
      )}
      {guest && mode === "signup" && (
        <Alert>
          Your guest learning will stay with this account. Keep using this
          browser until account creation is confirmed.
        </Alert>
      )}
      {guest && mode === "login" && (
        <Alert>
          Signing in opens that account and ends access to this guest session.
          To keep your guest progress in a new account, choose Create an account
          instead.
        </Alert>
      )}
      <Card>
        {mode === "access" && allowed ? (
          <div className={styles.choices}>
            <p>Your program code was accepted. Choose how to continue.</p>
            <ButtonLink href={url("/signup")}>Create an account</ButtonLink>
            <ButtonLink href={url("/login")} variant="secondary">
              Sign in
            </ButtonLink>
            {error && <Alert tone="error">{error}</Alert>}
            <Button
              busy={busy}
              disabled={!ready}
              disabledReason={
                !ready
                  ? "Getting these choices ready. Please wait."
                  : "Opening a guest session. Please wait for confirmation."
              }
              variant="quiet"
              onClick={() => void send("/api/user/ensure", {})}
            >
              Explore as a guest
            </Button>
            <p className={styles.footer}>
              Guest progress stays in this browser session. Create an account
              here to keep it when switching devices. Shared-device users should
              sign out when finished.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className={styles.form}
            aria-label={
              mode === "onboarding"
                ? "Welcome steps"
                : mode === "access"
                  ? "Program access"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"
            }
          >
            {error && <Alert tone="error">{error}</Alert>}
            {mode === "access" && (
              <Field
                id="journey-code"
                label="Program access code"
                hint="Ask the person who invited you if you need a code."
                error={fields.code}
              >
                <input
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={200}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={busy || !ready}
                />
              </Field>
            )}
            {mode === "signup" && (
              <Field
                id="journey-fullName"
                label="Name you use"
                error={fields.fullName}
                hint="You can add other program details later, if needed."
              >
                <input
                  autoComplete="name"
                  maxLength={120}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                  disabled={busy || !ready}
                />
              </Field>
            )}
            {(mode === "signup" || mode === "login") && (
              <>
                <Field id="journey-email" label="Email" error={fields.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    inputMode="email"
                    maxLength={255}
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    disabled={busy || !ready}
                  />
                </Field>
                <Field
                  id="journey-password"
                  label="Password"
                  hint={
                    mode === "signup"
                      ? "Use at least 6 characters. A longer password is safer. You can use a password manager."
                      : undefined
                  }
                  error={fields.password}
                >
                  <input
                    type="password"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    minLength={mode === "signup" ? 6 : 1}
                    maxLength={200}
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    disabled={busy || !ready}
                  />
                </Field>
              </>
            )}
            {mode === "onboarding" &&
              (step === 1 ? (
                <>
                  <div className={styles.note}>
                    <HubertIcon size={36} />
                    <p>
                      One short lesson is a good place to begin. Hubert and Help
                      are here when you need support.
                    </p>
                  </div>
                  <ul className={styles.list}>
                    <li>
                      Choose a learning path and return whenever it works for
                      you.
                    </li>
                    <li>
                      Completed lessons record progress and XP. Practice by
                      revisiting a lesson.
                    </li>
                    <li>
                      Cash incentives depend on your program’s eligibility,
                      rules and staff approval. XP is not a promise of payment.
                      Requesting or approving a payout does not mean it has been
                      sent.
                    </li>
                  </ul>
                  <p>
                    Ask your program staff about incentive eligibility. You do
                    not need payment details to start learning.
                  </p>
                </>
              ) : (
                <>
                  <h2 id="privacy" tabIndex={-1}>
                    Choose what to share
                  </h2>
                  <p>
                    Your account stores your name, email and learning progress.
                    Authorized program staff can see learner records to support
                    participation and review incentives.
                  </p>
                  <p>
                    Phone, birth date, case details and emergency contacts are
                    optional here and can wait. Do not add sensitive details
                    unless you understand why your program needs them.
                  </p>
                  <Field
                    id="journey-goal"
                    label="Learning goal (optional)"
                    hint="This is a reminder, not a deadline or a condition for rewards."
                  >
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      disabled={busy || !ready}
                    >
                      <option value="">No goal for now</option>
                      {Object.entries(LEARNING_GOALS).map(([key, text]) => (
                        <option key={key} value={key}>
                          {text}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <p>
                    On a shared device, sign out when you finish. Help is
                    available even without an account.
                  </p>
                </>
              ))}
            {mode === "signup" && (
              <p className={styles.footer}>
                By creating an account you agree to the{" "}
                <Link href="/terms">Terms of Service</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>. No birth date,
                address or payment details are requested now.
              </p>
            )}
            <div className={styles.actions}>
              {mode === "onboarding" && step === 2 && (
                <Button
                  variant="secondary"
                  disabled={busy || !ready}
                  disabledReason="Wait for the save to finish before going back."
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                busy={busy}
                disabled={!ready}
                disabledReason={
                  !ready
                    ? "Getting this form ready. Please wait."
                    : mode === "signup"
                      ? "Creating your account. Wait for confirmation before trying again."
                      : "Please wait for the server to confirm this step."
                }
              >
                {mode === "access"
                  ? "Continue"
                  : mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : step === 1
                        ? "Next: privacy and pace"
                        : "Start learning"}
              </Button>
            </div>
          </form>
        )}
        {slow && (
          <p role="status" className={styles.muted}>
            This is taking longer than usual. Keep this page open while we
            check. Do not submit again.
          </p>
        )}
      </Card>
      <div className={styles.actions}>
        {mode !== "onboarding" && (
          <Link href={url(mode === "login" ? "/signup" : "/login")}>
            {mode === "login"
              ? "Create an account"
              : "Already have an account? Sign in"}
          </Link>
        )}
        {mode === "login" && <Link href="/recover">Help signing in</Link>}
        {mode === "signup" && error && (
          <Link href={url("/login")}>Check whether my account was created</Link>
        )}
        {mode === "onboarding" && (
          <>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </>
        )}
      </div>
      {mode === "login" && reason === "expired" && (
        <>
          <p className={styles.footer}>
            Sharing this device? You can clear its old sign-in to begin a
            separate session. This does not recover a lost guest session.
          </p>
          <Button
            variant="quiet"
            disabled={!ready}
            disabledReason="Getting this action ready. Please wait."
            onClick={() => {
              setError("");
              setResetOpen(true);
            }}
          >
            Use a different account
          </Button>
          <Dialog
            open={resetOpen}
            title="Clear this device’s sign-in?"
            onClose={() => {
              if (!busy) setResetOpen(false);
            }}
            closeDisabledReason={
              busy ? "Wait while this device’s sign-in is cleared." : undefined
            }
          >
            <p>
              Saved accounts, progress and balances are not deleted. If you need
              help keeping old guest work, ask your program staff before
              continuing. Clear this sign-in only when you mean to start a
              separate session.
            </p>
            {error && <Alert tone="error">{error}</Alert>}
            <Button
              variant="secondary"
              busy={busy}
              disabledReason="Clearing this device’s old sign-in. Please wait for confirmation."
              onClick={() => void send("/api/auth/session", {}, "DELETE")}
            >
              Clear sign-in on this device
            </Button>
          </Dialog>
        </>
      )}
    </>
  );
}
