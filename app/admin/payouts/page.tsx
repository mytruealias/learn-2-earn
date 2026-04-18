"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { useToast } from "../AdminToastContext";
import styles from "../payouts.module.css";

interface Payout {
  id: string;
  xpAmount: number;
  dollarAmount: number;
  status: string;
  note: string | null;
  paymentMethod: string | null;
  paymentHandle: string | null;
  reviewNote: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  user: { id: string; fullName: string | null; email: string | null; totalXp: number; caseNumber: string | null };
  reviewedBy: { fullName: string } | null;
  approvedBy: { fullName: string } | null;
}

const statusColorClass: Record<string, string> = {
  pending: "statusYellow",
  reviewed: "statusBlue",
  approved: "statusGreen",
  completed: "statusGreen",
  rejected: "statusRed",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildPayLink(method: string, handle: string, amount: number): string | null {
  const clean = handle.trim();
  const amt = amount.toFixed(2);
  switch (method.toLowerCase()) {
    case "zelle":
      return null;
    case "paypal":
      return `https://paypal.me/${clean.replace(/^@+/, "")}/${amt}`;
    case "venmo":
      return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(clean.replace(/^@+/, ""))}&amount=${amt}&note=Learn2Earn%20Payout`;
    case "cashapp":
      return `https://cash.app/${clean.startsWith("$") ? clean : "$" + clean}/${amt}`;
    default:
      return null;
  }
}

function exportCSV(selected: Payout[]) {
  const headers = ["User Name", "Case Number", "Amount", "Payment Method", "Payment Handle", "Completed Date", "Decision Note"];
  const rows = selected.map((p) => [
    p.user.fullName || "Unknown",
    p.user.caseNumber || "",
    p.dollarAmount.toFixed(2),
    p.paymentMethod || "",
    p.paymentHandle || "",
    formatDate(p.updatedAt),
    p.decisionNote || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payouts_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayoutsPage() {
  const { admin } = useAdmin();
  const { showToast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [decisionNote, setDecisionNote] = useState("");
  const [activeAction, setActiveAction] = useState<{ payoutId: string; action: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPayouts = (p = page) => {
    setLoading(true);
    fetch(`/api/admin/payouts?status=${statusFilter}&page=${p}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setPayouts(data.payouts);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setSelectedIds(new Set());
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchPayouts(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchPayouts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleAction = async () => {
    if (!activeAction) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: activeAction.payoutId,
          action: activeAction.action,
          decisionNote: decisionNote || undefined,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) {
        const actionLabels: Record<string, string> = {
          review: "Payout marked as reviewed",
          approve: "Payout approved",
          reject: "Payout rejected",
          complete: "Payout marked as paid",
        };
        showToast(actionLabels[activeAction.action] || "Action completed", "success");
        setActiveAction(null);
        setDecisionNote("");
        fetchPayouts();
      } else {
        showToast(data.error || "Action failed", "error");
      }
    } catch {
      showToast("Connection error", "error");
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const selected = payouts.filter((p) => selectedIds.has(p.id));
    if (!selected.length) return;
    exportCSV(selected);
    showToast(`Exported ${selected.length} payout(s) to CSV`, "success");
  };

  const canReview = admin && ["admin", "caseworker"].includes(admin.role);
  const canApprove = admin && ["admin", "finance"].includes(admin.role);
  const isCompletedFilter = statusFilter === "completed";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Payouts</h1>
      </div>

      <div className={styles.filterRow}>
        {["pending", "reviewed", "approved", "completed", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`${styles.filterBtn} ${styles[`filter_${s}`] || ""} ${statusFilter === s ? styles.filterBtnActive : ""}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {activeAction && (
        <div className={styles.actionPanel}>
          <div className={styles.actionTitle}>
            Confirm: {activeAction.action}
          </div>
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value.slice(0, 500))}
            placeholder="Decision note (optional, max 500 chars)..."
            className={styles.actionNote}
          />
          <div className={styles.actionNoteCount}>{decisionNote.length}/500</div>
          <div className={styles.actionBtns}>
            <button
              onClick={handleAction}
              disabled={processing}
              className={`${styles.confirmBtn} ${activeAction.action === "reject" ? styles.confirmBtnReject : styles.confirmBtnApprove}`}
            >
              {processing ? "Processing..." : "Confirm"}
            </button>
            <button
              onClick={() => { setActiveAction(null); setDecisionNote(""); }}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isCompletedFilter && selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkInfo}>{selectedIds.size} payout(s) selected</span>
          <button className={styles.exportBtn} onClick={handleExport}>Export CSV</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : payouts.length === 0 ? (
        <div className={styles.emptyState}>No {statusFilter} payouts found</div>
      ) : (
        <div className={styles.payoutList}>
          {payouts.map((p) => {
            const colorClass = statusColorClass[p.status] || "statusDefault";
            return (
              <div key={p.id} className={`${styles.payoutCard} ${styles[colorClass]}`}>
                <div className={styles.payoutCardHeader}>
                  <div className={styles.payoutCardLeft}>
                    {isCompletedFilter && (
                      <div className={styles.selectCell} onClick={() => toggleSelect(p.id)}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </div>
                    )}
                    <div>
                      <div className={styles.payoutUser}>{p.user.fullName || "Unknown"}</div>
                      <div className={styles.payoutUserMeta}>
                        {p.user.email} {p.user.caseNumber && `• Case: ${p.user.caseNumber}`}
                      </div>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[colorClass]}`}>{p.status}</span>
                </div>

                <div className={styles.payoutBody}>
                  <div className={styles.payoutFields}>
                    <div className={styles.payoutField}>
                      <span className={styles.payoutFieldLabel}>XP</span>
                      <span className={`${styles.payoutFieldValue} ${styles.xpValue}`}>{p.xpAmount}</span>
                    </div>
                    <div className={styles.payoutField}>
                      <span className={styles.payoutFieldLabel}>Amount</span>
                      <span className={`${styles.payoutFieldValue} ${styles.amountValue}`}>${p.dollarAmount.toFixed(2)}</span>
                    </div>
                    <div className={styles.payoutField}>
                      <span className={styles.payoutFieldLabel}>Date</span>
                      <span className={styles.payoutFieldValueSm}>{formatDate(p.createdAt)}</span>
                    </div>
                    {p.paymentMethod && (
                      <div className={styles.payoutField}>
                        <span className={styles.payoutFieldLabel}>Pay via</span>
                        <span className={`${styles.payoutFieldValueSm} ${styles.payMethodValue}`}>{p.paymentMethod}</span>
                      </div>
                    )}
                    {p.paymentHandle && (
                      <div className={styles.payoutField}>
                        <span className={styles.payoutFieldLabel}>Handle</span>
                        <span className={styles.payoutFieldValueSm}>{p.paymentHandle}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.payoutActions}>
                    {p.status === "pending" && canReview && (
                      <>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "review" })}
                          className={`${styles.actionBtn} ${styles.actionBtnReview}`}
                        >Review</button>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "reject" })}
                          className={styles.actionBtnDanger}
                        >Reject</button>
                      </>
                    )}
                    {p.status === "reviewed" && canApprove && (
                      <>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "approve" })}
                          className={`${styles.actionBtn} ${styles.actionBtnApprove}`}
                        >Approve</button>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "reject" })}
                          className={styles.actionBtnDanger}
                        >Reject</button>
                      </>
                    )}
                    {p.status === "approved" && canApprove && (
                      <button
                        onClick={() => setActiveAction({ payoutId: p.id, action: "complete" })}
                        className={`${styles.actionBtn} ${styles.actionBtnApprove}`}
                      >Mark paid</button>
                    )}
                  </div>
                </div>

                {p.status === "approved" && p.paymentMethod && p.paymentHandle && (() => {
                  const payLink = buildPayLink(p.paymentMethod, p.paymentHandle, p.dollarAmount);
                  const isCheck = p.paymentMethod.toLowerCase() === "check";
                  const isZelle = p.paymentMethod.toLowerCase() === "zelle";
                  const isVenmo = p.paymentMethod.toLowerCase() === "venmo";
                  const isCopied = copiedId === p.id;
                  return (
                    <div className={styles.payLink}>
                      {isZelle ? (
                        <div className={styles.payLinkInner}>
                          <span className={styles.payLinkMailLabel}>Send via Zelle</span>
                          <span className={styles.payLinkAddress}>{p.paymentHandle}</span>
                          <span className={styles.payLinkHint}>Amount: ${p.dollarAmount.toFixed(2)} · Memo: Learn2Earn Payout</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.paymentHandle!);
                              setCopiedId(p.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className={`${styles.copyBtn} ${isCopied ? styles.copyBtnCopied : ""}`}
                          >{isCopied ? "Copied!" : "Copy Zelle contact"}</button>
                        </div>
                      ) : isCheck ? (
                        <div className={styles.payLinkInner}>
                          <span className={styles.payLinkMailLabel}>Mail check to</span>
                          <span className={styles.payLinkAddress}>{p.paymentHandle}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.paymentHandle!);
                              setCopiedId(p.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className={`${styles.copyBtn} ${isCopied ? styles.copyBtnCopied : ""}`}
                          >{isCopied ? "Copied!" : "Copy address"}</button>
                        </div>
                      ) : payLink ? (
                        <div className={styles.payLinkInner}>
                          <a href={payLink} target="_blank" rel="noopener noreferrer" className={styles.payLinkBtn}>
                            Pay ${p.dollarAmount.toFixed(2)} via {p.paymentMethod} →
                          </a>
                          {isVenmo && (
                            <span className={styles.payLinkHint}>Opens Venmo app on mobile</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                {(p.reviewedBy || p.approvedBy || p.decisionNote) && (
                  <div className={styles.payoutReviewer}>
                    {p.reviewedBy && <span>Reviewed by {p.reviewedBy.fullName} </span>}
                    {p.approvedBy && <span>• Approved by {p.approvedBy.fullName}</span>}
                    {p.reviewNote && <div className={styles.reviewNote}>Note: {p.reviewNote}</div>}
                    {p.decisionNote && (
                      <div className={styles.decisionNote}>Decision note: {p.decisionNote}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {total} total · page {page} of {totalPages}
          </div>
          <div className={styles.paginationBtns}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={styles.paginationBtn}
            >← Prev</button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={styles.paginationBtn}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
