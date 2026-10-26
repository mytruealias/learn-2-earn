"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Button,
  IconButton,
  Field,
  Card,
  Dialog,
  Toast,
  StatusBadge,
  Skeleton,
  EmptyState,
  ErrorState,
  Alert,
} from "@/app/components/ui";
import {
  ClipboardIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PenIcon,
  ShelterIcon,
  CoffeeIcon,
  MedicalIcon,
  ShieldIcon,
  HeartCareIcon,
  WalletIcon,
  LifeRingIcon,
} from "@/app/components/icons";
import styles from "./directory.module.css";
interface ServiceEntry {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  notes: string | null;
  website: string | null;
}
const CATEGORIES = [
  "Shelter",
  "Food",
  "Healthcare",
  "Legal",
  "Recovery",
  "Employment",
  "Crisis Line",
];
const categoryIcons: Record<string, typeof ShelterIcon> = {
  Shelter: ShelterIcon,
  Food: CoffeeIcon,
  Healthcare: MedicalIcon,
  Legal: ShieldIcon,
  Recovery: HeartCareIcon,
  Employment: WalletIcon,
  "Crisis Line": LifeRingIcon,
};
function CategoryIcon({ category }: { category: string }) {
  const Icon = categoryIcons[category] || ShelterIcon;
  return <Icon color="var(--l2e-primary)" />;
}
const EMPTY_FORM = {
  name: "",
  category: "Shelter",
  address: "",
  phone: "",
  hours: "",
  notes: "",
  website: "",
};
export default function AdminDirectoryPage() {
  const [entries, setEntries] = useState<ServiceEntry[]>([]),
    [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [searchDraft, setSearchDraft] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | null>(null),
    [edit, setEdit] = useState<ServiceEntry | null>(null),
    [remove, setRemove] = useState<ServiceEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [unknownSave, setUnknownSave] = useState(false);
  const [notice, setNotice] = useState(""),
    [noticeError, setNoticeError] = useState(false);
  useEffect(() => {
    let active = true;
    setState("loading");
    const params = new URLSearchParams({ search, category });
    fetch(`/api/admin/directory?${params}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok || !Array.isArray(data.entries))
          throw new Error();
        return data.entries;
      })
      .then((data) => {
        if (active) {
          setEntries(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [search, category, refresh]);
  const close = useCallback(() => {
    if (!saving) {
      setModal(null);
      setRemove(null);
      setError("");
      setUnknownSave(false);
    }
  }, [saving]);
  const open = (entry?: ServiceEntry) => {
    setEdit(entry || null);
    setError("");
    setUnknownSave(false);
    setForm(
      entry
        ? {
            name: entry.name,
            category: entry.category,
            address: entry.address || "",
            phone: entry.phone || "",
            hours: entry.hours || "",
            notes: entry.notes || "",
            website: entry.website || "",
          }
        : EMPTY_FORM,
    );
    setModal(entry ? "edit" : "add");
  };
  const announce = (message: string, isError = false) => {
    setNoticeError(isError);
    setNotice(message);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || unknownSave || !form.name.trim()) return;
    setSaving(true);
    setError("");
    const body = {
      ...form,
      name: form.name.trim(),
      ...Object.fromEntries(
        ["address", "phone", "hours", "notes", "website"].map((key) => [
          key,
          form[key as keyof typeof form].trim() || null,
        ]),
      ),
    };
    try {
      const response = await fetch(
        modal === "edit" && edit
          ? `/api/admin/directory/${edit.id}`
          : "/api/admin/directory",
        {
          method: modal === "edit" ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        setError(
          "This service could not be saved. Check the fields and try again.",
        );
        return;
      }
      setModal(null);
      setRefresh((n) => n + 1);
      announce(
        modal === "edit"
          ? "Service updated."
          : "Service added to the directory.",
      );
    } catch {
      setUnknownSave(true);
      setError(
        "We couldn’t confirm the save. Check the directory before trying again to avoid adding the service twice.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteEntry = async () => {
    if (!remove || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/directory/${remove.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        setError("The service could not be removed. Please try again.");
        return;
      }
      setRemove(null);
      setRefresh((n) => n + 1);
      announce("Service removed from the active directory.");
    } catch {
      setError(
        "We couldn’t confirm removal. Close this dialog and refresh the directory before trying again.",
      );
    } finally {
      setSaving(false);
    }
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      announce("Copied to clipboard.");
    } catch {
      announce(
        "Copy is unavailable. You can select and copy the text instead.",
        true,
      );
    }
  };
  const categories = Array.from(
    new Set([
      ...CATEGORIES,
      ...entries.map((entry) => entry.category),
      form.category,
    ]),
  );
  return (
    <div data-design="staff-directory" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Staff workspace / Community resources
          </p>
          <h1>Austin services directory</h1>
          <p className={styles.description}>
            Find the right support, then keep the details up to date for your
            team.
          </p>
        </div>
        <Button onClick={() => open()}>+ Add service</Button>
      </header>
      <form
        role="search"
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchDraft.trim());
        }}
      >
        <Field id="directory-search" label="Search services">
          <input
            type="search"
            maxLength={200}
            placeholder="Name, address or notes"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </Field>
        <Field id="directory-category" label="Category">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </Field>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <p className={styles.count} role="status">
        {state === "ready"
          ? `${entries.length} ${entries.length === 1 ? "service" : "services"} shown`
          : state === "loading"
            ? "Loading services…"
            : "Service list unavailable"}
      </p>
      {state === "loading" ? (
        <Card>
          <Skeleton label="Loading services" />
        </Card>
      ) : state === "error" ? (
        <Card>
          <ErrorState onRetry={() => setRefresh((n) => n + 1)}>
            The directory could not load. Your filters are still here. Please
            try again.
          </ErrorState>
        </Card>
      ) : !entries.length ? (
        <Card>
          <EmptyState
            title={
              search || category !== "all"
                ? "No matching services"
                : "A place for helpful connections"
            }
            action={
              search || category !== "all" ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setSearchDraft("");
                    setCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          >
            {search || category !== "all"
              ? "Try a different name or category, or clear your filters."
              : "Add your first service using the button above. Only add details your team has verified."}
          </EmptyState>
        </Card>
      ) : (
        categories
          .filter((cat) => entries.some((entry) => entry.category === cat))
          .map((cat) => (
            <section
              key={cat}
              className={styles.category}
              aria-labelledby={`category-${cat.replaceAll(" ", "-")}`}
            >
              <div className={styles.categoryHeading}>
                <CategoryIcon category={cat} />
                <h2 id={`category-${cat.replaceAll(" ", "-")}`}>{cat}</h2>
                <StatusBadge>
                  {entries.filter((entry) => entry.category === cat).length}
                </StatusBadge>
              </div>
              <div className={styles.entries}>
                {entries
                  .filter((entry) => entry.category === cat)
                  .map((entry) => (
                    <article key={entry.id}>
                      <Card className={styles.entry}>
                        <div className={styles.details}>
                          <h3>{entry.name}</h3>
                          <div className={styles.meta}>
                            {entry.phone && (
                              <div className={styles.metaRow}>
                                <PhoneIcon />
                                <span>{entry.phone}</span>
                                <IconButton
                                  label={`Copy phone number for ${entry.name}`}
                                  onClick={() => copy(entry.phone!)}
                                >
                                  <ClipboardIcon />
                                </IconButton>
                              </div>
                            )}
                            {entry.address && (
                              <div className={styles.metaRow}>
                                <MapPinIcon />
                                <span>{entry.address}</span>
                                <IconButton
                                  label={`Copy address for ${entry.name}`}
                                  onClick={() => copy(entry.address!)}
                                >
                                  <ClipboardIcon />
                                </IconButton>
                              </div>
                            )}
                            {entry.hours && (
                              <div className={styles.metaRow}>
                                <ClockIcon />
                                <span>{entry.hours}</span>
                              </div>
                            )}
                            {entry.website &&
                              /^https?:\/\//i.test(entry.website) && (
                                <a
                                  className={styles.link}
                                  href={entry.website}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Visit website{" "}
                                  <span className="sr-only">
                                    for {entry.name} (opens a new tab)
                                  </span>
                                  <span aria-hidden="true">↗</span>
                                </a>
                              )}
                            {entry.website &&
                              !/^https?:\/\//i.test(entry.website) && (
                                <p>Website link needs updating.</p>
                              )}
                          </div>
                          {entry.notes && (
                            <p className={styles.notes}>{entry.notes}</p>
                          )}
                        </div>
                        <div className={styles.actions}>
                          <Button
                            variant="secondary"
                            aria-label={`Edit ${entry.name}`}
                            onClick={() => open(entry)}
                          >
                            <PenIcon size={18} /> Edit
                          </Button>
                          <Button
                            variant="quiet"
                            aria-label={`Remove ${entry.name}`}
                            onClick={() => {
                              setError("");
                              setRemove(entry);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    </article>
                  ))}
              </div>
            </section>
          ))
      )}
      <Dialog
        open={!!modal}
        title={modal === "edit" ? "Edit service" : "Add a service"}
        onClose={close}
        closeDisabledReason={
          saving ? "Please wait for the save to finish." : undefined
        }
      >
        <p>
          Keep information clear and practical. Fields marked “required” must be
          filled in.
        </p>
        <form className={styles.form} onSubmit={save} aria-busy={saving}>
          <fieldset disabled={saving} className={styles.formFields}>
            <Field id="dir-org-name" label="Organization name (required)">
              <input
                required
                maxLength={200}
                value={form.name}
                onChange={(event) =>
                  setForm((f) => ({ ...f, name: event.target.value }))
                }
              />
            </Field>
            <div className={styles.formGrid}>
              <Field id="dir-category" label="Category (required)">
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, category: event.target.value }))
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </Field>
              <Field id="dir-phone" label="Phone">
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={60}
                  value={form.phone}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, phone: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field id="dir-address" label="Address">
              <input
                autoComplete="street-address"
                maxLength={500}
                value={form.address}
                onChange={(event) =>
                  setForm((f) => ({ ...f, address: event.target.value }))
                }
              />
            </Field>
            <div className={styles.formGrid}>
              <Field id="dir-hours" label="Hours">
                <input
                  maxLength={200}
                  value={form.hours}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, hours: event.target.value }))
                  }
                />
              </Field>
              <Field
                id="dir-website"
                label="Website"
                hint="Include https:// for a working link."
              >
                <input
                  type="url"
                  pattern="https?://.+"
                  autoComplete="url"
                  maxLength={500}
                  value={form.website}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, website: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field
              id="dir-notes"
              label="Notes"
              hint="Use service details only. Do not add private learner information."
            >
              <textarea
                maxLength={2000}
                value={form.notes}
                onChange={(event) =>
                  setForm((f) => ({ ...f, notes: event.target.value }))
                }
              />
            </Field>
          </fieldset>
          {error && <Alert tone="error">{error}</Alert>}
          <div className={styles.formActions}>
            <Button
              variant="secondary"
              onClick={close}
              disabled={saving}
              disabledReason="Please wait for the save to finish."
            >
              Cancel
            </Button>
            {unknownSave ? (
              <Button
                onClick={() => {
                  close();
                  setRefresh((n) => n + 1);
                }}
              >
                Check directory
              </Button>
            ) : (
              <Button
                type="submit"
                busy={saving}
                disabled={!form.name.trim()}
                disabledReason={
                  saving
                    ? "Please wait for the save to finish."
                    : "Enter an organization name to save this service."
                }
              >
                {saving ? "Saving…" : "Save service"}
              </Button>
            )}
          </div>
        </form>
      </Dialog>
      <Dialog
        open={!!remove}
        title="Remove this service?"
        onClose={close}
        closeDisabledReason={
          saving ? "Please wait for removal to finish." : undefined
        }
      >
        <p>
          <strong>{remove?.name}</strong> will no longer appear in the active
          directory. Existing records are kept.
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        <div className={styles.formActions}>
          <Button
            variant="secondary"
            onClick={close}
            disabled={saving}
            disabledReason="Please wait for removal to finish."
          >
            Keep service
          </Button>
          <Button variant="danger" busy={saving} onClick={deleteEntry}>
            {saving ? "Removing…" : "Remove service"}
          </Button>
        </div>
      </Dialog>
      <Toast
        message={notice}
        tone={noticeError ? "error" : "success"}
        onDismiss={() => setNotice("")}
      />
    </div>
  );
}
