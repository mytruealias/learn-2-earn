"use client";
import { useRef, useState } from "react";
import { StaffCollection, type StaffRow } from "../components/StaffTable";
import { useAdmin } from "../AdminContext";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, Dialog } from "@/app/components/ui";
import styles from "../components/staff.module.css";
const blank = {
  name: "",
  category: "Shelter",
  address: "",
  phone: "",
  hours: "",
  notes: "",
  website: "",
};
export default function Page() {
  const { admin } = useAdmin(),
    [refresh, setRefresh] = useState(0),
    [target, setTarget] = useState<StaffRow | null>(null),
    [modal, setModal] = useState<"add" | "edit" | "remove" | null>(null),
    [form, setForm] = useState(blank),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(""),
    lock = useRef(false),
    retry = useRef<object | null>(null),
    canEdit = admin?.role !== "finance";
  function open(action: "add" | "edit" | "remove", row?: StaffRow) {
    setTarget(row || null);
    setModal(action);
    setError("");
    setKey(crypto.randomUUID());
    retry.current = null;
    setForm(
      row
        ? (Object.fromEntries(
            Object.keys(blank).map((k) => [k, String(row[k] ?? "")]),
          ) as typeof blank)
        : blank,
    );
  }
  async function save() {
    if (!modal || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const body = retry.current || {
        requestKey: key,
        ...(target ? { expectedVersion: target.version } : {}),
        ...(modal !== "remove"
          ? Object.fromEntries(
              Object.entries(form).map(([k, v]) => [
                k,
                ["name", "category"].includes(k) ? v.trim() : v.trim() || null,
              ]),
            )
          : {}),
      };
      retry.current = body;
      const r = await staffFetch(
          target ? `/api/admin/directory/${target.id}` : "/api/admin/directory",
          {
            method:
              modal === "remove"
                ? "DELETE"
                : modal === "edit"
                  ? "PATCH"
                  : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        ),
        d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Service change could not be confirmed.",
        );
      setModal(null);
      setMessage(
        modal === "remove"
          ? "Service removed from the active directory. Historical records remain."
          : "Service saved and audited.",
      );
      setRefresh((v) => v + 1);
      retry.current = null;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry unchanged details, or reload the directory to verify.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <StaffCollection
        endpoint="/api/admin/directory"
        title="Service directory"
        categories={[
          { value: "all", label: "All categories" },
          ...[
            "Shelter",
            "Food",
            "Healthcare",
            "Legal",
            "Recovery",
            "Employment",
            "Crisis Line",
          ].map((value) => ({ value, label: value })),
        ]}
        description="Program-specific service contacts. Verify contact information before a referral; a listing is not a guarantee of service availability."
        refresh={refresh}
        columns={[
          { key: "name", label: "Service", sort: "name" },
          { key: "category", label: "Category" },
          {
            key: "phone",
            label: "Phone",
            render: (r) =>
              r.phone ? (
                <a href={`tel:${r.phone}`}>{String(r.phone)}</a>
              ) : (
                "Not recorded"
              ),
          },
          {
            key: "contact",
            label: "Contact details",
            render: (r) => (
              <details>
                <summary style={{ minHeight: 44, cursor: "pointer" }}>
                  View contact details
                </summary>
                <p>{String(r.address || "No address recorded")}</p>
                <p>{String(r.notes || "No additional service notes")}</p>
                {!!r.website && (
                  <a
                    href={String(r.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Service website
                  </a>
                )}
              </details>
            ),
          },
          { key: "hours", label: "Hours" },
          {
            key: "actions",
            label: "Actions",
            render: (r) =>
              canEdit ? (
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    onClick={() => open("edit", r)}
                    aria-label={`Edit ${r.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => open("remove", r)}
                    aria-label={`Remove ${r.name}`}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                "Read only"
              ),
          },
        ]}
      >
        {message && <p role="status">{message}</p>}
        {canEdit && <Button onClick={() => open("add")}>Add service</Button>}
      </StaffCollection>
      <Dialog
        open={!!modal}
        title={
          modal === "remove"
            ? "Remove this service?"
            : modal === "edit"
              ? "Edit service"
              : "Add service"
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
          {modal === "remove" ? (
            <p>
              Remove <strong>{String(target?.name)}</strong> from the active
              directory in <strong>{admin?.programName}</strong>. Historical
              service allocations and audit records remain.
            </p>
          ) : (
            Object.keys(blank).map((k) => (
              <label key={k}>
                {k === "name"
                  ? "Service name"
                  : k[0].toUpperCase() + k.slice(1)}
                {k === "category" ? (
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {[
                      "Shelter",
                      "Food",
                      "Healthcare",
                      "Legal",
                      "Recovery",
                      "Employment",
                      "Crisis Line",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                ) : k === "notes" ? (
                  <textarea
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                ) : (
                  <input
                    required={k === "name"}
                    type={k === "website" ? "url" : "text"}
                    value={form[k as keyof typeof blank]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    maxLength={
                      k === "phone" ? 60 : k === "website" ? 500 : 2000
                    }
                  />
                )}
              </label>
            ))
          )}
          {error && (
            <Alert tone="error">
              {error}{" "}
              <Button
                variant="quiet"
                onClick={() => {
                  setModal(null);
                  setRefresh((v) => v + 1);
                }}
              >
                Reload directory before another change
              </Button>
            </Alert>
          )}
          <Button
            type="submit"
            variant={modal === "remove" ? "danger" : "primary"}
            busy={busy}
            disabled={modal !== "remove" && !form.name.trim()}
            disabledReason="Enter a service name to save this service."
          >
            {modal === "remove" ? "Confirm removal" : "Save service"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
