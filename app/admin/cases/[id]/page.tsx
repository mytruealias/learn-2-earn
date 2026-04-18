"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import styles from "../cases.module.css";

interface CaseNote {
  id: string;
  text: string;
  type: string;
  createdAt: string;
  admin: { id: string; fullName: string; role: string };
}

interface ResourceAllocation {
  id: string;
  resourceType: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  admin: { id: string; fullName: string };
}

interface CaseDetail {
  id: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    caseNumber: string | null;
  };
  assignedTo: { id: string; fullName: string; role: string } | null;
  notes: CaseNote[];
  allocations: ResourceAllocation[];
}

interface StaffMember {
  id: string;
  fullName: string;
  role: string;
}

const STATUS_CLASS: Record<string, string> = {
  new: "statusNew",
  open: "statusOpen",
  dispatched: "statusDispatched",
  resolved: "statusResolved",
  closed: "statusClosed",
};

const RESOURCE_LABELS: Record<string, string> = {
  shelter: "Shelter referral",
  food: "Food bank referral",
  bus_pass: "Bus pass",
  hygiene: "Hygiene kit",
  clothing: "Clothing voucher",
  mental_health: "Mental health referral",
};

const NOTE_TYPE_DOT: Record<string, string> = {
  note: "timelineDotNote",
  dispatch: "timelineDotDispatch",
  resource: "timelineDotResource",
  resource_allocation: "timelineDotResource",
  status_change: "timelineDotStatus",
};

const NOTE_TYPE_EMOJI: Record<string, string> = {
  note: "📝",
  dispatch: "🚀",
  resource: "📦",
  resource_allocation: "📦",
  status_change: "🔄",
};

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeElapsed(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [c, setC] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [modal, setModal] = useState<null | "dispatch" | "allocate" | "editMeta">(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dispatchStaffId, setDispatchStaffId] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [allocType, setAllocType] = useState("shelter");
  const [allocQty, setAllocQty] = useState("1");
  const [allocNotes, setAllocNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCase = useCallback(async () => {
    const res = await fetch(`/api/admin/cases/${id}`, { credentials: "include" });
    const data = await res.json();
    if (data.ok) setC(data.case);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  useEffect(() => {
    if (staff.length > 0) return;
    fetch("/api/admin/cases/staff", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.ok) setStaff(data.staff); });
  }, [staff.length]);

  const openEditMeta = () => {
    if (!c) return;
    setEditStatus(c.status);
    setEditPriority(c.priority);
    setEditAssigneeId(c.assignedTo?.id || "");
    setModal("editMeta");
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    const res = await fetch(`/api/admin/cases/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: noteText }),
    });
    const data = await res.json();
    if (data.ok) {
      setNoteText("");
      fetchCase();
    }
    setSubmittingNote(false);
  };

  const saveEditMeta = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        status: editStatus,
        priority: editPriority,
        assignedToId: editAssigneeId || null,
      }),
    });
    if (res.ok) {
      setModal(null);
      fetchCase();
    }
    setSaving(false);
  };

  const dispatchCase = async () => {
    if (!dispatchStaffId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/cases/${id}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ staffId: dispatchStaffId, notes: dispatchNotes }),
    });
    if (res.ok) {
      setModal(null);
      setDispatchStaffId("");
      setDispatchNotes("");
      fetchCase();
    }
    setSaving(false);
  };

  const allocateResource = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/cases/${id}/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ resourceType: allocType, quantity: Number(allocQty), notes: allocNotes }),
    });
    if (res.ok) {
      setModal(null);
      setAllocNotes("");
      fetchCase();
    }
    setSaving(false);
  };

  if (loading) return <div style={{ color: "#94a3b8", padding: "2rem", fontFamily: "Inter, sans-serif" }}>Loading...</div>;
  if (!c) return <div style={{ color: "#ef4444", padding: "2rem", fontFamily: "Inter, sans-serif" }}>Case not found.</div>;

  return (
    <div className={styles.detailPage}>
      <button className={styles.backLink} onClick={() => router.push("/admin/cases")}>
        ← Back to Cases
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{c.title}</h1>
        <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[c.status] || "statusNew"]}`}>
          {c.status}
        </span>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          padding: "0.2rem 0.6rem",
          borderRadius: "999px",
          background: c.priority === "high" ? "rgba(239,68,68,0.15)" : c.priority === "medium" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
          color: c.priority === "high" ? "#ef4444" : c.priority === "medium" ? "#f59e0b" : "#22c55e",
          border: `1px solid ${c.priority === "high" ? "rgba(239,68,68,0.3)" : c.priority === "medium" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
        }}>
          {c.priority} priority
        </span>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }} title={formatDate(c.createdAt)}>
          {timeElapsed(c.createdAt)}
        </span>
      </div>

      <div className={styles.detailGrid}>
        <div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Case message</div>
            <div className={styles.messageBox}>{c.message}</div>
            {c.location && (
              <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                📍 {c.location}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Activity timeline</div>
            {c.notes.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No activity yet.</div>
            ) : (
              <div className={styles.timeline}>
                {c.notes.map(n => (
                  <div key={n.id} className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${styles[NOTE_TYPE_DOT[n.type] || "timelineDotNote"]}`}>
                      {NOTE_TYPE_EMOJI[n.type] || "📝"}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineAuthor}>{n.admin.fullName}</div>
                      <div className={styles.timelineText}>{n.text}</div>
                      <div className={styles.timelineDate}>{formatDate(n.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.noteForm}>
              <textarea
                className={styles.noteTextarea}
                placeholder="Add a note to this case..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button
                className={styles.submitBtn}
                onClick={submitNote}
                disabled={submittingNote || !noteText.trim()}
              >
                {submittingNote ? "Saving..." : "Add Note"}
              </button>
            </div>
          </div>

          {c.allocations.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>Resources allocated</div>
              <table className={styles.allocTable}>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Qty</th>
                    <th>By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {c.allocations.map(a => (
                    <tr key={a.id}>
                      <td>{RESOURCE_LABELS[a.resourceType] || a.resourceType}</td>
                      <td>{a.quantity}</td>
                      <td>{a.admin.fullName}</td>
                      <td>{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Learner info</div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{c.user.fullName || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{c.user.email || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.detailValue}>
                {c.user.phone ? (
                  <CopyField value={c.user.phone} label="phone" />
                ) : "—"}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Location</span>
              <span className={styles.detailValue}>{[c.user.city, c.user.state].filter(Boolean).join(", ") || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Case #</span>
              <span className={styles.detailValue}>{c.user.caseNumber || "—"}</span>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <a
                href={`/admin/users/${c.user.id}`}
                style={{ color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
              >
                View full profile →
              </a>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Case info</div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Opened</span>
              <span className={styles.detailValue} title={formatDate(c.createdAt)}>{timeElapsed(c.createdAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Updated</span>
              <span className={styles.detailValue}>{formatDate(c.updatedAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Assigned to</span>
              <span className={styles.detailValue}>{c.assignedTo?.fullName || "Unassigned"}</span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Actions</div>
            <div className={styles.actionPanel}>
              <button className={styles.actionBtn} onClick={openEditMeta}>
                🔄 Edit Status, Priority & Assignee
              </button>
              <button className={styles.actionBtn} onClick={() => setModal("dispatch")}>
                🚀 Dispatch Staff
              </button>
              <button className={`${styles.actionBtn} ${styles.actionBtnSuccess}`} onClick={() => setModal("allocate")}>
                📦 Allocate Resource
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal === "editMeta" && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Edit Case</div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Status</label>
              <select
                className={styles.modalSelect}
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
              >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Priority</label>
              <select
                className={styles.modalSelect}
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Assign to</label>
              <select
                className={styles.modalSelect}
                value={editAssigneeId}
                onChange={e => setEditAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={saveEditMeta} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "dispatch" && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Dispatch Staff</div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Staff Member</label>
              <select
                className={styles.modalSelect}
                value={dispatchStaffId}
                onChange={e => setDispatchStaffId(e.target.value)}
              >
                <option value="">Select staff...</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
                ))}
              </select>
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Notes (optional)</label>
              <textarea
                className={styles.modalTextarea}
                placeholder="Dispatch instructions..."
                value={dispatchNotes}
                onChange={e => setDispatchNotes(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={dispatchCase} disabled={saving || !dispatchStaffId}>
                {saving ? "Dispatching..." : "Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "allocate" && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Allocate Resource</div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Resource Type</label>
              <select
                className={styles.modalSelect}
                value={allocType}
                onChange={e => setAllocType(e.target.value)}
              >
                <option value="shelter">Shelter referral</option>
                <option value="food">Food bank referral</option>
                <option value="bus_pass">Bus pass</option>
                <option value="hygiene">Hygiene kit</option>
                <option value="clothing">Clothing voucher</option>
                <option value="mental_health">Mental health referral</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Quantity</label>
              <input
                type="number"
                min="1"
                max="99"
                className={styles.modalInput}
                value={allocQty}
                onChange={e => setAllocQty(e.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Notes (optional)</label>
              <textarea
                className={styles.modalTextarea}
                placeholder="Additional notes..."
                value={allocNotes}
                onChange={e => setAllocNotes(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={allocateResource} disabled={saving}>
                {saving ? "Allocating..." : "Allocate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      {value}
      <button
        onClick={copy}
        title={`Copy ${label}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          borderRadius: "4px",
          fontSize: "0.7rem",
          color: copied ? "#22c55e" : "#64748b",
          fontFamily: "inherit",
          transition: "color 0.15s",
        }}
      >
        {copied ? "✓" : "⎘"}
      </button>
    </span>
  );
}
