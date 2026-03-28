"use client";

import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";

interface Stats {
  users: { total: number; registered: number; guests: number; activeMonth: number; activeWeek: number };
  learning: { totalPaths: number; totalLessons: number; lessonsCompleted: number; totalXpDistributed: number };
  payouts: { pending: number; approved: number; completed: number; totalDollars: number };
}

interface TrendsData {
  userGrowth: { date: string; count: number }[];
  payoutVolume: { week: string; dollars: number }[];
}

const COLOR_TO_CLASS: Record<string, string> = {
  green:  "colorGreen",
  blue:   "colorBlue",
  yellow: "colorYellow",
  purple: "colorPurple",
  red:    "colorRed",
  muted:  "colorMuted",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colorClass = COLOR_TO_CLASS[color] ?? "colorMuted";
  return (
    <div className={`${styles.statCard} ${styles[colorClass]}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function SparkLine({
  data,
  color,
  valueKey,
}: {
  data: Record<string, number | string>[];
  color: string;
  valueKey: string;
}) {
  if (!data.length) return null;
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 500;
  const h = 100;
  const pad = 4;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  const areaPoints = [
    `${pad},${h - pad}`,
    ...points,
    `${w - pad},${h - pad}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.chartArea} preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => {
        const [px, py] = points[i].split(",").map(Number);
        return (
          <circle key={i} cx={px} cy={py} r="3" fill={color} />
        );
      })}
    </svg>
  );
}

function AlertBanner({ pendingCount }: { pendingCount: number }) {
  return (
    <div className={styles.alertBanner}>
      <svg className={styles.alertIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span className={styles.alertText}>
        {pendingCount} payout {pendingCount === 1 ? "request" : "requests"} pending review
      </span>
      <a href="/admin/payouts" className={styles.alertLink}>Review payouts</a>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
      })
      .finally(() => setLoading(false));

    fetch("/api/admin/stats/trends", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTrends(data.trends);
      })
      .finally(() => setTrendsLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className={styles.error}>Failed to load dashboard data</div>;
  }

  return (
    <div className={styles.page}>
      {stats.payouts.pending > 0 && (
        <AlertBanner pendingCount={stats.payouts.pending} />
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Users</h2>
        <div className={styles.statGrid}>
          <StatCard label="Total Users" value={stats.users.total} color="green" />
          <StatCard label="Registered" value={stats.users.registered} sub={`${stats.users.guests} guests`} color="blue" />
          <StatCard label="Active (7 days)" value={stats.users.activeWeek} color="yellow" />
          <StatCard label="Active (30 days)" value={stats.users.activeMonth} color="yellow" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Learning</h2>
        <div className={styles.statGrid}>
          <StatCard label="Journeys" value={stats.learning.totalPaths} color="green" />
          <StatCard label="Total Lessons" value={stats.learning.totalLessons} color="blue" />
          <StatCard label="Lessons Completed" value={stats.learning.lessonsCompleted} color="purple" />
          <StatCard label="XP Distributed" value={stats.learning.totalXpDistributed.toLocaleString()} color="yellow" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Payouts</h2>
        <div className={styles.statGrid}>
          <StatCard label="Pending Review" value={stats.payouts.pending} color={stats.payouts.pending > 0 ? "red" : "muted"} />
          <StatCard label="Approved" value={stats.payouts.approved} color="yellow" />
          <StatCard label="Completed" value={stats.payouts.completed} color="green" />
          <StatCard label="Total Paid" value={`$${stats.payouts.totalDollars.toFixed(2)}`} color="green" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Trends</h2>
        {trendsLoading ? (
          <div className={styles.chartLoading}>Loading trends...</div>
        ) : trends ? (
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>New Registrations — Past 30 Days</div>
              <SparkLine data={trends.userGrowth} color="#22c55e" valueKey="count" />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Payout Volume (USD) — Past 12 Weeks</div>
              <SparkLine data={trends.payoutVolume} color="#f59e0b" valueKey="dollars" />
            </div>
          </div>
        ) : (
          <div className={styles.chartLoading}>No trend data available</div>
        )}
      </div>
    </div>
  );
}
