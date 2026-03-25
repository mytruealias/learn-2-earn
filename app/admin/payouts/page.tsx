"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";

interface Payout {
  id: string;
  xpAmount: number;
  dollarAmount: number;
  status: string;
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  user: { id: string; fullName: string | null; email: string | null; totalXp: number; caseNumber: string | null };
  reviewedBy: { fullName: string } | null;
  approvedBy: { fullName: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "#ffd700",
  reviewed: "#00d4ff",
  approved: "#00ff88",
  completed: "#00ff88",
  rejected: "#ff6b6b",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPayoutsPage() {
  const { admin } = useAdmin();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState("");
  const [activeAction, setActiveAction] = useState<{ payoutId: string; action: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = () => {
    setLoading(true);
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`/api/admin/payouts?status=${statusFilter}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPayouts(data.payouts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const handleAction = async () => {
    if (!activeAction) return;
    setProcessing(true);

    try {
      const token = localStorage.getItem("l2e_admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          payoutId: activeAction.payoutId,
          action: activeAction.action,
          note: actionNote || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setActiveAction(null);
        setActionNote("");
        fetchPayouts();
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Connection error");
    } finally {
      setProcessing(false);
    }
  };

  const canReview = admin && ["admin", "caseworker"].includes(admin.role);
  const canApprove = admin && ["admin", "finance"].includes(admin.role);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#00ff88",
          letterSpacing: "0.15em",
          marginBottom: "0.25rem",
        }}>PAYOUT_MANAGEMENT</div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#e1e8ed",
        }}>Payouts</h1>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["pending", "reviewed", "approved", "completed", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: statusFilter === s ? (statusColors[s] || "#00ff88") : "#15202b",
              color: statusFilter === s ? "#0f1419" : "#8899a6",
              border: `1px solid ${statusColors[s] || "#253341"}`,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >{s}</button>
        ))}
      </div>

      {activeAction && (
        <div style={{
          backgroundColor: "#15202b",
          border: "1px solid #253341",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.7rem",
            color: "#ffd700",
            letterSpacing: "0.1em",
            marginBottom: "0.75rem",
            textTransform: "uppercase",
          }}>
            Confirm: {activeAction.action}
          </div>
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder="Add a note (optional)..."
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#0f1419",
              border: "1px solid #253341",
              color: "#e1e8ed",
              fontSize: "0.85rem",
              fontFamily: "'Share Tech Mono', monospace",
              outline: "none",
              resize: "vertical",
              minHeight: "60px",
              marginBottom: "0.75rem",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleAction}
              disabled={processing}
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: activeAction.action === "reject" ? "#ff6b6b" : "#00ff88",
                color: "#0f1419",
                border: "none",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: processing ? "default" : "pointer",
                letterSpacing: "0.1em",
              }}
            >{processing ? "PROCESSING..." : "CONFIRM"}</button>
            <button
              onClick={() => { setActiveAction(null); setActionNote(""); }}
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: "transparent",
                color: "#8899a6",
                border: "1px solid #253341",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >CANCEL</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: "#8899a6", fontFamily: "'Share Tech Mono', monospace" }}>Loading...</div>
      ) : payouts.length === 0 ? (
        <div style={{
          color: "#8899a6",
          fontFamily: "'Share Tech Mono', monospace",
          textAlign: "center",
          padding: "3rem",
          backgroundColor: "#15202b",
          border: "1px solid #253341",
        }}>
          No {statusFilter} payouts found
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {payouts.map((p) => {
            const color = statusColors[p.status] || "#8899a6";
            return (
              <div key={p.id} style={{
                backgroundColor: "#15202b",
                border: "1px solid #253341",
                borderLeft: `3px solid ${color}`,
                padding: "1.25rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ color: "#e1e8ed", fontWeight: "600", fontSize: "0.9rem" }}>
                      {p.user.fullName || "Unknown"}
                    </div>
                    <div style={{ color: "#8899a6", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      {p.user.email} {p.user.caseNumber && `• Case: ${p.user.caseNumber}`}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "0.65rem",
                    color,
                    border: `1px solid ${color}`,
                    padding: "0.2rem 0.6rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>{p.status}</div>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid #253341",
                }}>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6" }}>XP</div>
                      <div style={{ fontSize: "1rem", fontWeight: "700", color: "#ffd700" }}>{p.xpAmount}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6" }}>AMOUNT</div>
                      <div style={{ fontSize: "1rem", fontWeight: "700", color: "#00ff88" }}>${p.dollarAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6" }}>DATE</div>
                      <div style={{ fontSize: "0.8rem", color: "#e1e8ed" }}>{formatDate(p.createdAt)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {p.status === "pending" && canReview && (
                      <>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "review" })}
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: "#00d4ff",
                            color: "#0f1419",
                            border: "none",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            letterSpacing: "0.1em",
                          }}
                        >REVIEW</button>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "reject" })}
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: "transparent",
                            color: "#ff6b6b",
                            border: "1px solid rgba(255,107,107,0.3)",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "0.65rem",
                            cursor: "pointer",
                            letterSpacing: "0.1em",
                          }}
                        >REJECT</button>
                      </>
                    )}
                    {p.status === "reviewed" && canApprove && (
                      <>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "approve" })}
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: "#00ff88",
                            color: "#0f1419",
                            border: "none",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            letterSpacing: "0.1em",
                          }}
                        >APPROVE</button>
                        <button
                          onClick={() => setActiveAction({ payoutId: p.id, action: "reject" })}
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: "transparent",
                            color: "#ff6b6b",
                            border: "1px solid rgba(255,107,107,0.3)",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "0.65rem",
                            cursor: "pointer",
                            letterSpacing: "0.1em",
                          }}
                        >REJECT</button>
                      </>
                    )}
                    {p.status === "approved" && canApprove && (
                      <button
                        onClick={() => setActiveAction({ payoutId: p.id, action: "complete" })}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: "#00ff88",
                          color: "#0f1419",
                          border: "none",
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >MARK_PAID</button>
                    )}
                  </div>
                </div>

                {(p.reviewedBy || p.approvedBy) && (
                  <div style={{
                    marginTop: "0.75rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid #253341",
                    fontSize: "0.7rem",
                    color: "#8899a6",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    {p.reviewedBy && <span>Reviewed by {p.reviewedBy.fullName} </span>}
                    {p.approvedBy && <span>• Approved by {p.approvedBy.fullName}</span>}
                    {p.reviewNote && <div style={{ marginTop: "0.25rem", color: "#e1e8ed" }}>Note: {p.reviewNote}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
