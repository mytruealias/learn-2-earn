"use client";

import { useState, useEffect } from "react";

interface Stats {
  users: { total: number; registered: number; guests: number; activeMonth: number; activeWeek: number };
  learning: { totalPaths: number; totalLessons: number; lessonsCompleted: number; totalXpDistributed: number };
  payouts: { pending: number; approved: number; completed: number; totalDollars: number };
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      backgroundColor: "#15202b",
      border: "1px solid #253341",
      borderTop: `2px solid ${color}`,
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "0.65rem",
        color: "#8899a6",
        letterSpacing: "0.1em",
        marginBottom: "0.5rem",
        textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "2rem",
        fontWeight: "700",
        color,
        lineHeight: "1",
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#8899a6",
          marginTop: "0.5rem",
        }}>{sub}</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch("/api/admin/stats", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ color: "#8899a6", fontFamily: "'Share Tech Mono', monospace" }}>
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ color: "#ff6b6b", fontFamily: "'Share Tech Mono', monospace" }}>
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#00ff88",
          letterSpacing: "0.15em",
          marginBottom: "0.25rem",
        }}>SYSTEM_OVERVIEW</div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#e1e8ed",
        }}>Dashboard</h1>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.75rem",
          color: "#8899a6",
          letterSpacing: "0.1em",
          marginBottom: "1rem",
          textTransform: "uppercase",
        }}>Users</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <StatCard label="Total Users" value={stats.users.total} color="#00ff88" />
          <StatCard label="Registered" value={stats.users.registered} sub={`${stats.users.guests} guests`} color="#00d4ff" />
          <StatCard label="Active (7d)" value={stats.users.activeWeek} color="#ffd700" />
          <StatCard label="Active (30d)" value={stats.users.activeMonth} color="#ffd700" />
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.75rem",
          color: "#8899a6",
          letterSpacing: "0.1em",
          marginBottom: "1rem",
          textTransform: "uppercase",
        }}>Learning</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <StatCard label="Journeys" value={stats.learning.totalPaths} color="#00ff88" />
          <StatCard label="Total Lessons" value={stats.learning.totalLessons} color="#00d4ff" />
          <StatCard label="Lessons Completed" value={stats.learning.lessonsCompleted} color="#a855f7" />
          <StatCard label="XP Distributed" value={stats.learning.totalXpDistributed.toLocaleString()} color="#ffd700" />
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.75rem",
          color: "#8899a6",
          letterSpacing: "0.1em",
          marginBottom: "1rem",
          textTransform: "uppercase",
        }}>Payouts</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <StatCard label="Pending Review" value={stats.payouts.pending} color={stats.payouts.pending > 0 ? "#ff6b6b" : "#8899a6"} />
          <StatCard label="Approved" value={stats.payouts.approved} color="#ffd700" />
          <StatCard label="Completed" value={stats.payouts.completed} color="#00ff88" />
          <StatCard label="Total Paid" value={`$${stats.payouts.totalDollars.toFixed(2)}`} color="#00ff88" />
        </div>
      </div>
    </div>
  );
}
