"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { useToast } from "../AdminToastContext";
import styles from "../staff.module.css";

interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  loginFailures: number;
  lockedUntil: string | null;
}

function formatDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function AdminStaffPage() {
  const { admin } = useAdmin();
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [form, setForm] = useState({ email: "", fullName: "", role: "caseworker" });
  const isAdmin = admin?.role === "admin";

  const fetchStaff = () => {
    if (!isAdmin) return;
    setLoading(true);
    fetch("/api/admin/staff", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStaff(data.staff);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          Access denied. Admin role required.
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setTempPassword(data.tempPassword);
        setStaff((prev) => [data.staff, ...prev]);
        setForm({ email: "", fullName: "", role: "caseworker" });
        showToast("Staff member created successfully", "success");
      } else {
        setCreateError(data.error?.message || "Failed to create staff member");
      }
    } catch {
      setCreateError("Connection error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setStaff((prev) => prev.map((s) => (s.id === member.id ? data.staff : s)));
        showToast(
          `${member.fullName} has been ${!member.isActive ? "reactivated" : "deactivated"}`,
          !member.isActive ? "success" : "info"
        );
      } else {
        showToast(data.error?.message || "Action failed", "error");
      }
    } catch {
      showToast("Connection error", "error");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Staff</h1>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.createBtn}
          onClick={() => { setShowCreate(true); setTempPassword(""); setCreateError(""); }}
        >
          + New account
        </button>
      </div>

      {showCreate && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Create Admin Account</h2>

            {createError && <div className={styles.modalError}>{createError}</div>}

            {tempPassword && (
              <div className={styles.tempPassword}>
                <div className={styles.tempPasswordLabel}>Temporary password (shown once)</div>
                <div className={styles.tempPasswordValue}>{tempPassword}</div>
                <div className={styles.tempPasswordNote}>
                  Share this securely. The user should change it on first login.
                </div>
              </div>
            )}

            {!tempPassword && (
              <form onSubmit={handleCreate}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="staff-full-name">Full Name</label>
                  <input
                    id="staff-full-name"
                    className={styles.modalInput}
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="staff-email">Email</label>
                  <input
                    id="staff-email"
                    type="email"
                    className={styles.modalInput}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="staff-role">Role</label>
                  <select
                    id="staff-role"
                    className={styles.modalSelect}
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="caseworker">Caseworker</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" disabled={creating} className={styles.modalSaveBtn}>
                    {creating ? "Creating..." : "Create account"}
                  </button>
                  <button type="button" className={styles.modalCancelBtn} onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {tempPassword && (
              <div className={styles.modalActions}>
                <button className={styles.modalSaveBtn} onClick={() => setShowCreate(false)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.staffList}>
          {staff.map((member) => (
            <div key={member.id} className={styles.staffRow}>
              <div className={styles.staffRowLeft}>
                <div className={styles.staffAvatar}>
                  {getInitials(member.fullName)}
                </div>
                <div className={styles.staffInfo}>
                  <div className={styles.staffName}>{member.fullName}</div>
                  <div className={styles.staffEmail}>{member.email}</div>
                </div>
              </div>
              <div className={styles.staffMeta}>
                <span className={styles.staffRole}>{member.role}</span>
                <span className={styles.staffLastLogin}>Last login: {formatDate(member.lastLoginAt)}</span>
                <span className={`${styles.statusBadge} ${member.isActive ? styles.statusActive : styles.statusInactive}`}>
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                {member.lockedUntil && new Date(member.lockedUntil) > new Date() && (
                  <span className={`${styles.statusBadge} ${styles.statusLocked}`}>
                    Locked
                  </span>
                )}
              </div>
              <div className={styles.staffActions}>
                {member.id !== admin?.id && (
                  member.isActive ? (
                    <button className={styles.deactivateBtn} onClick={() => toggleActive(member)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className={styles.reactivateBtn} onClick={() => toggleActive(member)}>
                      Reactivate
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
