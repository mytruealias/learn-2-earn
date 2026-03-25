"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { fullName: string; email: string; role: string } | null;
}

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: "#00ff88",
  LOGIN_FAILED: "#ff6b6b",
  VIEW_USERS: "#00d4ff",
  VIEW_USER_DETAIL: "#00d4ff",
  PAYOUT_REVIEW: "#ffd700",
  PAYOUT_APPROVE: "#00ff88",
  PAYOUT_REJECT: "#ff6b6b",
  PAYOUT_COMPLETE: "#00ff88",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (entityFilter) params.set("entity", entityFilter);
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`/api/admin/audit?${params}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setLogs(data.logs);
          setTotalPages(data.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter]);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#00ff88",
          letterSpacing: "0.15em",
          marginBottom: "0.25rem",
        }}>SECURITY_LOG</div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#e1e8ed",
        }}>Audit Trail</h1>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["", "AdminUser", "User", "PayoutRequest"].map((e) => (
          <button
            key={e}
            onClick={() => { setEntityFilter(e); setPage(1); }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: entityFilter === e ? "#00ff88" : "#15202b",
              color: entityFilter === e ? "#0f1419" : "#8899a6",
              border: "1px solid #253341",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >{e || "ALL"}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#8899a6", fontFamily: "'Share Tech Mono', monospace" }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{
          color: "#8899a6",
          fontFamily: "'Share Tech Mono', monospace",
          textAlign: "center",
          padding: "3rem",
          backgroundColor: "#15202b",
          border: "1px solid #253341",
        }}>
          No audit entries found
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {logs.map((log) => {
            const color = actionColors[log.action] || "#8899a6";
            return (
              <div key={log.id} style={{
                backgroundColor: "#15202b",
                border: "1px solid #253341",
                padding: "0.85rem 1rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.6rem",
                  color: "#8899a6",
                  minWidth: "130px",
                  flexShrink: 0,
                }}>{formatDateTime(log.createdAt)}</div>

                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.65rem",
                  color,
                  minWidth: "140px",
                  flexShrink: 0,
                  letterSpacing: "0.05em",
                }}>{log.action}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", color: "#e1e8ed" }}>
                    <span style={{ color: "#8899a6" }}>{log.entity}</span>
                    {log.entityId && (
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "0.65rem",
                        color: "#8899a6",
                        marginLeft: "0.5rem",
                      }}>
                        [{log.entityId.slice(0, 8)}...]
                      </span>
                    )}
                  </div>
                  {log.admin && (
                    <div style={{
                      fontSize: "0.7rem",
                      color: "#8899a6",
                      marginTop: "0.15rem",
                    }}>
                      by {log.admin.fullName} ({log.admin.role})
                    </div>
                  )}
                  {log.details && (
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "0.6rem",
                      color: "#657786",
                      marginTop: "0.25rem",
                      wordBreak: "break-all",
                    }}>
                      {log.details.length > 200 ? log.details.slice(0, 200) + "..." : log.details}
                    </div>
                  )}
                </div>

                {log.ipAddress && (
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "0.55rem",
                    color: "#657786",
                    flexShrink: 0,
                  }}>{log.ipAddress}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: page <= 1 ? "#253341" : "#15202b",
              border: "1px solid #253341",
              color: page <= 1 ? "#8899a6" : "#e1e8ed",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.75rem",
              cursor: page <= 1 ? "default" : "pointer",
            }}
          >PREV</button>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.75rem",
            color: "#8899a6",
            alignSelf: "center",
          }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: page >= totalPages ? "#253341" : "#15202b",
              border: "1px solid #253341",
              color: page >= totalPages ? "#8899a6" : "#e1e8ed",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.75rem",
              cursor: page >= totalPages ? "default" : "pointer",
            }}
          >NEXT</button>
        </div>
      )}
    </div>
  );
}
