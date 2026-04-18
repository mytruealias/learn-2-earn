"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./cases.module.css";

interface CaseSummary {
  id: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { id: string; fullName: string | null; email: string | null; caseNumber: string | null };
  assignedTo: { id: string; fullName: string } | null;
  _count: { notes: number; allocations: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const STATUS_CLASS: Record<string, string> = {
  new: "statusNew",
  open: "statusOpen",
  dispatched: "statusDispatched",
  resolved: "statusResolved",
  closed: "statusClosed",
};

function timeElapsed(dt: string): string {
  const now = Date.now();
  const diff = now - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminCasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "all") params.set("status", status);
    if (priority !== "all") params.set("priority", priority);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/admin/cases?${params}`, { credentials: "include" });
    const data = await res.json();
    if (data.ok) {
      setCases(data.cases);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, status, priority, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const newCount = pagination?.total ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 className={styles.pageTitle}>Cases</h1>
          {status === "new" && newCount > 0 && (
            <span className={styles.headerBadge}>{newCount} new</span>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.filterInput}
          placeholder="Search by name, message..."
          aria-label="Search cases"
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className={styles.filterSelect}
          aria-label="Filter by status"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="dispatched">Dispatched</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className={styles.filterSelect}
          aria-label="Filter by priority"
          value={priority}
          onChange={e => { setPriority(e.target.value); setPage(1); }}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className={styles.empty}>No cases found.</div>
      ) : (
        <div className={styles.caseList}>
          {cases.map(c => (
            <Link key={c.id} href={`/admin/cases/${c.id}`} className={styles.caseRow}>
              <div
                className={styles.priorityDot}
                style={{ backgroundColor: PRIORITY_COLORS[c.priority] || "#64748b" }}
                title={c.priority + " priority"}
              />
              <div className={styles.caseMain}>
                <div className={styles.caseTitle}>{c.title}</div>
                <div className={styles.caseMeta}>
                  <span>{c.user.fullName || c.user.email || "Unknown"}</span>
                  {c.user.caseNumber && <span>#{c.user.caseNumber}</span>}
                  {c.assignedTo && <span>→ {c.assignedTo.fullName}</span>}
                  <span>{c._count.notes} note{c._count.notes !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className={styles.caseRight}>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[c.status] || "statusNew"]}`}>
                  {c.status}
                </span>
                <span className={styles.caseDate} title={new Date(c.createdAt).toLocaleString()}>
                  {timeElapsed(c.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >← Prev</button>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
