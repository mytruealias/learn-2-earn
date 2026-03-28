"use client";

import { useState, useEffect, useCallback } from "react";
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

const CATEGORIES = ["Shelter", "Food", "Healthcare", "Legal", "Recovery", "Employment", "Crisis"];

const CATEGORY_EMOJI: Record<string, string> = {
  Shelter: "🏠",
  Food: "🍽️",
  Healthcare: "🏥",
  Legal: "⚖️",
  Recovery: "💚",
  Employment: "💼",
  Crisis: "🚨",
};

const EMPTY_FORM = {
  name: "", category: "Shelter", address: "", phone: "", hours: "", notes: "", website: "",
};

export default function AdminDirectoryPage() {
  const [entries, setEntries] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editTarget, setEditTarget] = useState<ServiceEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/admin/directory?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.ok) setEntries(data.entries);
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (entry: ServiceEntry) => {
    setEditTarget(entry);
    setForm({
      name: entry.name,
      category: entry.category,
      address: entry.address || "",
      phone: entry.phone || "",
      hours: entry.hours || "",
      notes: entry.notes || "",
      website: entry.website || "",
    });
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      category: form.category,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      hours: form.hours.trim() || null,
      notes: form.notes.trim() || null,
      website: form.website.trim() || null,
    };
    const res = modal === "edit" && editTarget
      ? await fetch(`/api/admin/directory/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
      : await fetch("/api/admin/directory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
    if (res.ok) {
      setModal(null);
      fetchEntries();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the directory?`)) return;
    await fetch(`/api/admin/directory/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchEntries();
  };

  const grouped = CATEGORIES.reduce<Record<string, ServiceEntry[]>>((acc, cat) => {
    acc[cat] = entries.filter(e => e.category === cat);
    return acc;
  }, {});

  const visibleCategories = categoryFilter === "all"
    ? CATEGORIES.filter(cat => grouped[cat].length > 0)
    : CATEGORIES.filter(cat => cat === categoryFilter);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Austin Services Directory</h1>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Service</button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.filterInput}
          placeholder="Search services..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading directory...</div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          No services found.
          {entries.length === 0 && search === "" && categoryFilter === "all" && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              The directory is empty. Add services above or seed the database.
            </div>
          )}
        </div>
      ) : (
        visibleCategories.map(cat => (
          grouped[cat].length === 0 ? null : (
            <div key={cat} className={styles.categorySection}>
              <div className={styles.categoryHeading}>
                {CATEGORY_EMOJI[cat]} {cat}
              </div>
              <div className={styles.entryList}>
                {grouped[cat].map(entry => (
                  <div key={entry.id} className={styles.entryCard}>
                    <div className={styles.entryMain}>
                      <div className={styles.entryName}>{entry.name}</div>
                      <div className={styles.entryMeta}>
                        {entry.phone && <span>📞 {entry.phone}</span>}
                        {entry.address && <span>📍 {entry.address}</span>}
                        {entry.hours && <span>🕐 {entry.hours}</span>}
                        {entry.website && (
                          <a
                            href={entry.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#3b82f6" }}
                            onClick={e => e.stopPropagation()}
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                      {entry.notes && (
                        <div className={styles.entryNotes}>{entry.notes}</div>
                      )}
                    </div>
                    <div className={styles.entryActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(entry)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(entry.id, entry.name)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {modal === "add" ? "Add Service" : "Edit Service"}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.formLabel}>Organization Name *</label>
                <input
                  className={styles.formInput}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Austin Resource Center for the Homeless"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Category *</label>
                <select
                  className={styles.formSelect}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Phone</label>
                <input
                  className={styles.formInput}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(512) 555-0000"
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Address</label>
              <input
                className={styles.formInput}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Main St, Austin, TX 78701"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Hours</label>
                <input
                  className={styles.formInput}
                  value={form.hours}
                  onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="Mon–Fri 8am–5pm"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Website</label>
                <input
                  className={styles.formInput}
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://example.org"
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Notes</label>
              <textarea
                className={styles.formTextarea}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Walk-in welcome, ID required, etc."
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? "Saving..." : modal === "add" ? "Add Service" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
