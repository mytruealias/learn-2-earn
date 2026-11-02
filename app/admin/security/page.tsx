"use client";
import SupportIntakeSettings from "../components/SupportIntakeSettings";
import ProgramInvitations from "../components/ProgramInvitations";
import { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import styles from "../components/staff.module.css";
import { useAdmin } from "../AdminContext";
import { Card, Button } from "@/app/components/ui";
export default function Page() {
  const { admin } = useAdmin();
  const [data, setData] = useState<{
      recoveryCodesRemaining: number;
      otherSessions: number;
    } | null>(null),
    [code, setCode] = useState(""),
    [codes, setCodes] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false);
  async function load() {
    setFailed(false);
    const r = await staffFetch("/api/admin/security");
    if (r.ok) setData(await r.json());
    else { setFailed(true); setMessage("Security status could not be checked. Retry when connected, or sign in again if your session ended."); }
  }
  useEffect(() => {
    load().catch(() => { setFailed(true); setMessage("Security status could not be loaded. Retry this page."); });
  }, []);
  async function act(regenerate: boolean) {
    setBusy(true);
    setFailed(false);
    setMessage("");
    try {
      const r = await staffFetch(
        regenerate ? "/api/admin/mfa" : "/api/admin/security",
        regenerate
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "regenerate", code }),
            }
          : { method: "DELETE" },
      );
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "This change could not be confirmed.",
        );
      if (regenerate) {
        setCodes(d.recoveryCodes);
        setCode("");
      }
      setMessage(
        regenerate
          ? "Previous recovery codes are invalid. Save the new codes privately; they appear only now."
          : "Other staff sessions were revoked.",
      );
      await load();
    } catch (e) {
      setFailed(true);
      setMessage(
        e instanceof Error
          ? e.message
          : "Connection failed. Reload to check status.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section data-ui-shell="staff" data-design="staff" className={styles.page}>
      <h1>Staff security</h1>
      <Card>
        <h2>Authenticator and recovery</h2>
        <p>
          Staff access expires after 8 hours or 30 minutes without activity.
          Membership and account status are checked on the server for every
          request.
        </p>
        {data ? (
          <p>
            {data.recoveryCodesRemaining} unused recovery codes.{" "}
            {data.otherSessions} other unexpired sessions.
          </p>
        ) : !message ? (
          <p role="status">Loading security status…</p>
        ) : null}
        {message && <p role={failed ? "alert" : "status"}>{message}</p>}
        <Button disabled={busy || !data} onClick={() => act(false)}>
          Sign out other staff sessions
        </Button>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void act(true);
          }}
        >
          <h3>Replace recovery codes</h3>
          <p>
            Use a fresh authenticator code. Replacing codes invalidates all
            previous recovery codes.
          </p>
          <label htmlFor="fresh-code">Current authenticator code</label>
          <input
            id="fresh-code"
            className="ds-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button disabled={busy || !data} type="submit">
            Replace recovery codes
          </Button>
        </form>
        {codes.length > 0 && (
          <ul>
            {codes.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
        )}
        <p>
          If your authenticator and recovery codes are both lost, use your
          organization’s verified operator recovery process. No reset email or
          SSO provider is configured.
        </p>
      </Card>
      {admin?.role === "admin" && (
        <>
          <SupportIntakeSettings />
          <ProgramInvitations />
        </>
      )}
    </section>
  );
}
