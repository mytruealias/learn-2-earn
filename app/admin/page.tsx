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
  "#00ff88": "colorGreen",
  "#00d4ff": "colorBlue",
  "#ffd700": "colorYellow",
  "#a855f7": "colorPurple",
  "#ff6b6b": "colorRed",
  "#8899a6": "colorMuted",
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
      <polygon points={areaPoints} fill={color} fillOpacity="0.08" />
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
      <div className={styles.pageHeader}>
        <div className={styles.pageTag}>SYSTEM_OVERVIEW</div>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Users</h2>
        <div className={styles.statGrid}>
          <StatCard label="Total Users" value={stats.users.total} color="#00ff88" />
          <StatCard label="Registered" value={stats.users.registered} sub={`${stats.users.guests} guests`} color="#00d4ff" />
          <StatCard label="Active (7d)" value={stats.users.activeWeek} color="#ffd700" />
          <StatCard label="Active (30d)" value={stats.users.activeMonth} color="#ffd700" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Learning</h2>
        <div className={styles.statGrid}>
          <StatCard label="Journeys" value={stats.learning.totalPaths} color="#00ff88" />
          <StatCard label="Total Lessons" value={stats.learning.totalLessons} color="#00d4ff" />
          <StatCard label="Lessons Completed" value={stats.learning.lessonsCompleted} color="#a855f7" />
          <StatCard label="XP Distributed" value={stats.learning.totalXpDistributed.toLocaleString()} color="#ffd700" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Payouts</h2>
        <div className={styles.statGrid}>
          <StatCard label="Pending Review" value={stats.payouts.pending} color={stats.payouts.pending > 0 ? "#ff6b6b" : "#8899a6"} />
          <StatCard label="Approved" value={stats.payouts.approved} color="#ffd700" />
          <StatCard label="Completed" value={stats.payouts.completed} color="#00ff88" />
          <StatCard label="Total Paid" value={`$${stats.payouts.totalDollars.toFixed(2)}`} color="#00ff88" />
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
              <SparkLine data={trends.userGrowth} color="#00ff88" valueKey="count" />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Payout Volume (USD) — Past 12 Weeks</div>
              <SparkLine data={trends.payoutVolume} color="#ffd700" valueKey="dollars" />
            </div>
          </div>
        ) : (
          <div className={styles.chartLoading}>No trend data available</div>
        )}
      </div>
    </div>
  );
}
