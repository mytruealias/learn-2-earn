"use client";
import { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, Card, Dialog } from "@/app/components/ui";
export default function ProgramInvitations() {
  const [items, setItems] = useState<
      { id: string; expiresAt: string; isActive: boolean }[]
    >([]),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState<string | null>(null);
  async function load() {
    const r = await staffFetch("/api/admin/invitations"),
      d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Invitations unavailable.");
    setItems(d.invitations);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function act(id?: string) {
    setBusy(true);
    setError("");
    try {
      const r = await staffFetch("/api/admin/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            id ? { action: "revoke", id } : { action: "create" },
          ),
        }),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Invitation change not confirmed.");
      setCode(d.code || "");
      setConfirm(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Invitation change not confirmed. Reload to verify.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <h2>Private participant invitations</h2>
      <p>
        Share codes only through your verified program invitation process. A
        code enrolls an authenticated unassigned account into this program; it
        never moves an account from another program. New codes expire in seven
        days.
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      <Button busy={busy} onClick={() => setConfirm("create")}>
        Create a private invitation
      </Button>
      {code && (
        <>
          <p>
            Shown only now. Do not place this invitation in a public preview.
          </p>
          <code style={{ overflowWrap: "anywhere" }}>{code}</code>
          <Button variant="quiet" onClick={() => setCode("")}>
            Hide invitation code
          </Button>
        </>
      )}
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            Invitation {i.id} · expires {new Date(i.expiresAt).toLocaleString()}{" "}
            · {i.isActive ? "active" : "revoked"}{" "}
            {i.isActive && (
              <Button variant="quiet" onClick={() => setConfirm(i.id)}>
                Revoke invitation
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!items.length && <p>No private invitations recorded.</p>}
      <Dialog
        open={!!confirm}
        title={
          confirm === "create"
            ? "Create program invitation?"
            : "Revoke this invitation?"
        }
        onClose={() => {
          if (!busy) setConfirm(null);
        }}
      >
        <p>
          {confirm === "create"
            ? "Anyone holding this private code can enroll an otherwise unassigned authenticated account into your active program until the code expires or is revoked."
            : "The code will stop accepting new enrollments. Existing participant enrollments and history remain unchanged."}
        </p>
        <Button
          busy={busy}
          onClick={() => act(confirm === "create" ? undefined : confirm!)}
        >
          Confirm invitation change
        </Button>
      </Dialog>
    </Card>
  );
}
