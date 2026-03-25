"use client";

import { useState, useEffect } from "react";
import { useToast } from "../AdminToastContext";
import styles from "../users.module.css";

interface UserSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  caseNumber: string | null;
  totalXp: number;
  streak: number;
  createdAt: string;
  lastActiveAt: string;
  consentGiven: boolean;
  _count: { progress: number; payoutRequests: number };
}

interface UserDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  caseNumber: string | null;
  totalXp: number;
  hearts: number;
  streak: number;
  createdAt: string;
  lastActiveAt: string;
  isActive: boolean;
  consentGiven: boolean;
  progress: Array<{
    id: string;
    xpEarned: number;
    completedAt: string;
    lesson: { title: string; module: { title: string; path: { title: string } } };
  }>;
  payoutRequests: Array<{
    id: string;
    xpAmount: number;
    dollarAmount: number;
    status: string;
    createdAt: string;
  }>;
}

interface EditForm {
  caseNumber: string;
  xpAdjustment: string;
  xpReason: string;
  isActive: boolean;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ caseNumber: "", xpAdjustment: "", xpReason: "", isActive: true });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUsers(data.users);
          setTotalPages(data.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const viewUser = (userId: string) => {
    setDetailLoading(true);
    fetch(`/api/admin/users/${userId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSelectedUser(data.user);
      })
      .finally(() => setDetailLoading(false));
  };

  const openEdit = () => {
    if (!selectedUser) return;
    setEditForm({
      caseNumber: selectedUser.caseNumber || "",
      xpAdjustment: "",
      xpReason: "",
      isActive: selectedUser.isActive,
    });
    setEditError("");
    setShowEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError("");
    setEditSaving(true);

    const xpAdj = editForm.xpAdjustment ? parseInt(editForm.xpAdjustment) : 0;
    if (xpAdj !== 0 && !editForm.xpReason.trim()) {
      setEditError("A reason is required for XP adjustments");
      setEditSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseNumber: editForm.caseNumber,
          xpAdjustment: xpAdj || undefined,
          xpReason: editForm.xpReason || undefined,
          isActive: editForm.isActive,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedUser((prev) =>
          prev ? {
            ...prev,
            caseNumber: data.user.caseNumber,
            totalXp: data.user.totalXp,
            isActive: data.user.isActive ?? prev.isActive,
            consentGiven: data.user.consentGiven,
          } : prev
        );
        setShowEdit(false);
        showToast("User updated successfully", "success");
      } else {
        setEditError(data.error || "Failed to update user");
      }
    } catch {
      setEditError("Connection error");
    } finally {
      setEditSaving(false);
    }
  };

  if (detailLoading) {
    return <div className={styles.loading}>Loading user...</div>;
  }

  if (selectedUser) {
    const totalPayoutXp = selectedUser.payoutRequests
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.xpAmount, 0);
    const availableXp = selectedUser.totalXp - totalPayoutXp;

    return (
      <div>
        <button onClick={() => setSelectedUser(null)} className={styles.backBtn}>
          {"<"} back_to_users
        </button>

        {showEdit && (
          <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Edit User</h2>
              {editError && <div className={styles.modalError}>{editError}</div>}
              <form onSubmit={handleSaveEdit}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Case Number</label>
                  <input
                    className={styles.modalInput}
                    value={editForm.caseNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, caseNumber: e.target.value }))}
                    placeholder="e.g. CASE-12345"
                  />
                </div>
                <div className={styles.modalRow}>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>XP Adjustment</label>
                    <input
                      type="number"
                      className={styles.modalInput}
                      value={editForm.xpAdjustment}
                      onChange={(e) => setEditForm((f) => ({ ...f, xpAdjustment: e.target.value }))}
                      placeholder="e.g. +50 or -20"
                    />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>Reason (required for XP)</label>
                    <input
                      className={styles.modalInput}
                      value={editForm.xpReason}
                      onChange={(e) => setEditForm((f) => ({ ...f, xpReason: e.target.value }))}
                      placeholder="Why?"
                    />
                  </div>
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Account Status</label>
                  <select
                    className={styles.modalSelect}
                    value={editForm.isActive ? "active" : "inactive"}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Deactivated</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" disabled={editSaving} className={styles.modalSaveBtn}>
                    {editSaving ? "SAVING..." : "SAVE"}
                  </button>
                  <button type="button" className={styles.modalCancelBtn} onClick={() => setShowEdit(false)}>
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h1 className={styles.detailName}>{selectedUser.fullName || "Guest User"}</h1>
              <div className={styles.detailEmail}>
                {selectedUser.email || "No email"} {selectedUser.caseNumber && `• Case: ${selectedUser.caseNumber}`}
              </div>
              <div className={styles.detailLocation}>
                {selectedUser.city && `${selectedUser.city}, `}{selectedUser.state} {selectedUser.zipCode}
              </div>
            </div>
            <div className={styles.detailHeaderActions}>
              <span className={`${styles.consentBadge} ${selectedUser.consentGiven ? styles.consentYes : styles.consentNo}`}>
                {selectedUser.consentGiven ? "CONSENT_GIVEN" : "NO_CONSENT"}
              </span>
              <button className={styles.editBtn} onClick={openEdit}>EDIT</button>
            </div>
          </div>

          <div className={styles.detailStats}>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>TOTAL_XP</span>
              <span className={`${styles.statItemValue} ${styles.xpColor}`}>{selectedUser.totalXp}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>AVAILABLE_XP</span>
              <span className={`${styles.statItemValue} ${styles.availColor}`}>{availableXp}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>LESSONS</span>
              <span className={`${styles.statItemValue} ${styles.lessonsColor}`}>{selectedUser.progress.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>STREAK</span>
              <span className={`${styles.statItemValue} ${styles.streakColor}`}>{selectedUser.streak}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statItemLabel}>JOINED</span>
              <span className={`${styles.statItemValue} ${styles.joinedValue}`}>{formatDate(selectedUser.createdAt)}</span>
            </div>
          </div>
        </div>

        {selectedUser.progress.length > 0 && (
          <div className={styles.historyCard}>
            <h2 className={styles.historyTitle}>LESSON_HISTORY</h2>
            <div className={styles.historyList}>
              {selectedUser.progress.slice(0, 20).map((p) => (
                <div key={p.id} className={styles.historyItem}>
                  <div>
                    <span className={styles.lessonName}>{p.lesson.title}</span>
                    <span className={styles.lessonPath}>
                      {p.lesson.module.path.title} › {p.lesson.module.title}
                    </span>
                  </div>
                  <div className={styles.historyMeta}>
                    <span className={styles.xpTag}>+{p.xpEarned}xp</span>
                    <span className={styles.dateTag}>{formatDateTime(p.completedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUser.payoutRequests.length > 0 && (
          <div className={styles.historyCard}>
            <h2 className={styles.historyTitle}>PAYOUT_HISTORY</h2>
            <div className={styles.historyList}>
              {selectedUser.payoutRequests.map((p) => {
                const statusCls = ({ pending: "statusYellow", reviewed: "statusBlue", approved: "statusGreen", completed: "statusGreen", rejected: "statusRed" } as Record<string, string>)[p.status] || "statusDefault";
                return (
                  <div key={p.id} className={styles.historyItem}>
                    <span className={styles.payoutHistoryAmount}>{p.xpAmount} XP → ${p.dollarAmount.toFixed(2)}</span>
                    <div className={styles.historyMeta}>
                      <span className={`${styles.statusBadge} ${styles[statusCls]}`}>{p.status}</span>
                      <span className={styles.dateTag}>{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTag}>USER_MANAGEMENT</div>
        <h1 className={styles.pageTitle}>Users</h1>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or case number..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchBtn}>SEARCH</button>
      </form>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          <div className={styles.userList}>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => viewUser(user.id)}
                className={styles.userRow}
              >
                <div>
                  <div className={styles.userName}>{user.fullName || "Guest User"}</div>
                  <div className={styles.userMeta}>
                    {user.email || "No email"} {user.caseNumber && `• Case: ${user.caseNumber}`}
                  </div>
                </div>
                <div className={styles.userStats}>
                  <div className={styles.xpDisplay}>
                    <div className={styles.xpAmount}>{user.totalXp} XP</div>
                    <div className={styles.lessonCount}>{user._count.progress} lessons</div>
                  </div>
                  <div className={styles.lastActive}>{formatDate(user.lastActiveAt)}</div>
                  <span className={styles.chevron}>{">"}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={styles.pageBtn}
              >PREV</button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={styles.pageBtn}
              >NEXT</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
