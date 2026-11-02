"use client";
import { useState } from "react";
import {
  StaffCollection,
  type StaffRow,
  shortDate,
} from "../components/StaffTable";
import { useAdmin } from "../AdminContext";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, Dialog } from "@/app/components/ui";
import styles from "../components/staff.module.css";
export default function Page() {
  const { admin } = useAdmin(),
    [modal, setModal] = useState<"create" | "membership" | null>(null),
    [target, setTarget] = useState<StaffRow | null>(null),
    [form, setForm] = useState({ fullName: "", email: "", role: "caseworker" }),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0),
    [key, setKey] = useState("");
  function open(type: "create" | "membership", row?: StaffRow) {
    setModal(type);
    setTarget(row || null);
    setError("");
    setPassword("");
    setKey(crypto.randomUUID());
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await staffFetch(
          modal === "create"
            ? "/api/admin/staff"
            : `/api/admin/staff/${target?.id}`,
          {
            method: modal === "create" ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              modal === "create"
                ? { ...form, requestKey: key }
                : {
                    isActive: !target?.isActive,
                    expectedVersion: target?.version,
                    requestKey: key,
                  },
            ),
          },
        ),
        d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Staff change could not be confirmed.",
        );
      if (modal === "create") {
        setPassword(d.tempPassword || "");
        setMessage(
          d.tempPassword
            ? "Staff account created. Verify the recipient and deliver the temporary password privately; sign-in requires a password change and authenticator enrollment."
            : "Staff account already created. The temporary password cannot be displayed again; use verified operator recovery.",
        );
      } else {
        setModal(null);
        setMessage("Program membership updated and audited.");
      }
      setRefresh((v) => v + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry the same action or verify the staff list.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StaffCollection
        endpoint="/api/admin/staff"
        title="Program staff"
        description="Roles and access apply only to this program. Disabling a membership revokes its active program sessions and does not deactivate an identity in another organization."
        allowedRoles={["admin"]}
        refresh={refresh}
        statuses={[
          { value: "all", label: "All memberships" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        columns={[
          { key: "fullName", label: "Staff member", sort: "name" },
          { key: "email", label: "Email" },
          {
            key: "role",
            label: "Program role",
            render: (r) =>
              r.role === "admin" ? "Program administrator" : String(r.role),
          },
          {
            key: "isActive",
            label: "Membership",
            render: (r) => (r.isActive ? "Active" : "Inactive"),
          },
          {
            key: "createdAt",
            label: "Created",
            sort: "createdAt",
            render: (r) => shortDate(r.createdAt),
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) =>
              r.id === admin?.id ? (
                "Your membership"
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => open("membership", r)}
                >
                  {r.isActive ? "Disable membership" : "Reactivate membership"}
                </Button>
              ),
          },
        ]}
      >
        {message && <p role="status">{message}</p>}
        <Button onClick={() => open("create")}>
          Create program staff account
        </Button>
      </StaffCollection>
      <Dialog
        open={!!modal}
        title={
          modal === "create"
            ? "Create program staff account"
            : "Confirm membership change"
        }
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {modal === "create" ? (
            password ? (
              <>
                <p>
                  Temporary password, shown only now. Send it only through your
                  verified private handoff.
                </p>
                <code style={{ overflowWrap: "anywhere" }}>{password}</code>
                <p>
                  The recipient must replace it and confirm authenticator MFA
                  before seeing program records.
                </p>
              </>
            ) : (
              <>
                <label>
                  Full name
                  <input
                    required
                    maxLength={120}
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Program role
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="caseworker">Caseworker</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Program administrator</option>
                  </select>
                </label>
                <p>
                  This grants access to <strong>{admin?.programName}</strong>.
                  Existing identities cannot be overwritten or attached through
                  this form; ask a verified operator to review those
                  memberships.
                </p>
              </>
            )
          ) : (
            <p>
              {target?.isActive ? "Disable" : "Reactivate"}{" "}
              <strong>{String(target?.fullName)}</strong> in{" "}
              <strong>{admin?.programName}</strong>? Disabling revokes this
              program’s sessions. Other program memberships and audit history
              remain.
            </p>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          {password ? (
            <Button onClick={() => setModal(null)}>
              I completed the private handoff
            </Button>
          ) : (
            <Button
              type="submit"
              variant={
                modal === "membership" && target?.isActive
                  ? "danger"
                  : "primary"
              }
              busy={busy}
            >
              Confirm and save
            </Button>
          )}
        </form>
      </Dialog>
    </>
  );
}
