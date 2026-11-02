"use client";
import { Button } from "@/app/components/ui";
import { useEffect, useState } from "react";
import { staffFetch, setStaffProgramHint } from "@/lib/staff-fetch";
import styles from "../login.module.css";
type Membership = {
  role: string;
  program: { id: string; name: string; organization: { name: string } };
};
export default function Page() {
  const [memberships, setMemberships] = useState<Membership[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setError("");
    try {
      const r = await staffFetch("/api/admin/programs");
      if (r.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!r.ok) throw new Error();
      setMemberships((await r.json()).memberships);
    } catch {
      setError(
        "Programs could not be loaded. Check your connection and retry.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function choose(id: string) {
    setBusy(true);
    setError("");
    try {
      const r = await staffFetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Program unavailable.");
      setStaffProgramHint(id);
      window.location.href = "/admin";
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Program selection was not confirmed. Retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.page} data-ui-shell="staff" data-design="staff">
      <main className={styles.card}>
        <h1>Choose your program</h1>
        <p>
          Each program has separate participants, cases, finances and reports.
          Only your active memberships are listed.
        </p>
        {error && (
          <p role="alert">
            {error}{" "}
            <button className={styles.textBtn} onClick={load}>
              Retry
            </button>
          </p>
        )}
        {!memberships && !error && (
          <p role="status">Loading your memberships…</p>
        )}
        {memberships?.length === 0 && (
          <p>
            No active program membership is assigned. Ask your verified operator
            to review your membership. No participant records are available.
          </p>
        )}
        {memberships?.map((m) => (
          <section key={m.program.id}>
            <h2>{m.program.name}</h2>
            <p>
              {m.program.organization.name} · {m.role.replaceAll("_", " ")}
            </p>
            <button
              className={styles.submitBtn}
              disabled={busy}
              onClick={() => choose(m.program.id)}
            >
              Open {m.program.name}
            </button>
          </section>
        ))}
        <Button variant="quiet" busy={busy} disabledReason="Waiting for the server response. Please wait." onClick={async () => {
          if (busy) return;
          setBusy(true); setError("");
          try {
            const response = await staffFetch("/api/admin/session", { method: "DELETE" });
            if (!response.ok) throw new Error();
            setStaffProgramHint(null); window.location.href = "/admin/login";
          } catch { setError("Sign out could not be confirmed. Retry before leaving this shared device."); }
          finally { setBusy(false); }
        }}>Sign out</Button>
      </main>
    </div>
  );
}
