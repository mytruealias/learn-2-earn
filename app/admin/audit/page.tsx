"use client";

import { useState, useEffect } from "react";
import styles from "../audit.module.css";

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

const actionColorClass: Record<string, string> = {
  LOGIN_SUCCESS: "colorGreen",
  LOGIN_FAILED: "colorRed",
  VIEW_USERS: "colorBlue",
  VIEW_USER_DETAIL: "colorBlue",
  PAYOUT_REVIEW: "colorYellow",
  PAYOUT_APPROVE: "colorGreen",
  PAYOUT_REJECT: "colorRed",
  PAYOUT_COMPLETE: "colorGreen",
  USER_EDIT: "colorPurple",
  STAFF_CREATE: "colorGreen",
  STAFF_DEACTIVATE: "colorRed",
  STAFF_REACTIVATE: "colorGreen",
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
    fetch(`/api/admin/audit?${params}`, { credentials: "include" })
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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTag}>SECURITY_LOG</div>
        <h1 className={styles.pageTitle}>Audit Trail</h1>
      </div>

      <div className={styles.filterRow}>
        {["", "AdminUser", "User", "PayoutRequest"].map((e) => (
          <button
            key={e}
            onClick={() => { setEntityFilter(e); setPage(1); }}
            className={`${styles.filterBtn} ${entityFilter === e ? styles.filterBtnActive : ""}`}
          >
            {e || "ALL"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>No audit entries found</div>
      ) : (
        <div className={styles.logList}>
          {logs.map((log) => {
            const colorClass = actionColorClass[log.action] || "colorDefault";
            return (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logTime}>{formatDateTime(log.createdAt)}</div>
                <div className={`${styles.logAction} ${styles[colorClass]}`}>{log.action}</div>
                <div className={styles.logBody}>
                  <div className={styles.logEntity}>
                    <span>{log.entity}</span>
                    {log.entityId && (
                      <span className={styles.logEntityId}>[{log.entityId.slice(0, 8)}...]</span>
                    )}
                  </div>
                  {log.admin && (
                    <div className={styles.logAdmin}>
                      by {log.admin.fullName} ({log.admin.role})
                    </div>
                  )}
                  {log.details && (
                    <div className={styles.logDetails}>
                      {log.details.length > 200 ? log.details.slice(0, 200) + "..." : log.details}
                    </div>
                  )}
                </div>
                {log.ipAddress && (
                  <div className={styles.logIp}>{log.ipAddress}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
