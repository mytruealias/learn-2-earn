"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

interface Stats {
  users: {
    total: number;
    registered: number;
    guests: number;
    activeMonth: number;
    activeWeek: number;
  };
  learning: {
    totalPaths: number;
    totalLessons: number;
    lessonsCompleted: number;
    totalXpDistributed: number;
    engagementRate: number;
    avgLessonsPerActiveUser: number;
  };
  payouts: {
    pending: number;
    approved: number;
    completed: number;
    totalDollars: number;
  };
  cases: {
    openTotal: number;
    high: number;
    medium: number;
    low: number;
    newThisWeek: number;
  };
  pool: {
    balanceCents: number;
    pendingLiabilityCents: number;
    pendingCount: number;
  };
}

interface TrendsData {
  userGrowth: { date: string; count: number }[];
  payoutVolume: { week: string; dollars: number }[];
}

interface ActivityEvent {
  id: string;
  type: "user" | "payout" | "case" | "stress" | "lesson";
  label: string;
  timestamp: string;
  link?: string;
}

const COLOR_TO_CLASS: Record<string, string> = {
  green:  "colorGreen",
  blue:   "colorBlue",
  yellow: "colorYellow",
  purple: "colorPurple",
  red:    "colorRed",
  orange: "colorOrange",
  muted:  "colorMuted",
};

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
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
  const areaPoints = [`${pad},${h - pad}`, ...points, `${w - pad},${h - pad}`].join(" ");

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
        return <circle key={i} cx={px} cy={py} r="3" fill={color} />;
      })}
    </svg>
  );
}

const ACTIVITY_ICON: Record<string, string> = {
  user:   "👤",
  payout: "💸",
  case:   "📋",
  stress: "🚨",
  lesson: "📖",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setStats(data.stats); })
      .finally(() => setLoading(false));

    fetch("/api/admin/stats/trends", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setTrends(data.trends); })
      .finally(() => setTrendsLoading(false));

    fetch("/api/admin/stats/activity", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setActivity(data.activity); })
      .finally(() => setActivityLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }
  if (!stats) {
    return <div className={styles.error}>Failed to load dashboard data</div>;
  }

  const poolAtRisk =
    stats.pool.balanceCents > 0 &&
    stats.pool.pendingLiabilityCents >= stats.pool.balanceCents * 0.8;

  const quickActions: { label: string; href: string; variant: string }[] = [];
  if (stats.payouts.pending > 0) {
    quickActions.push({
      label: `Review ${stats.payouts.pending} payout${stats.payouts.pending !== 1 ? "s" : ""}`,
      href: "/admin/payouts",
      variant: "danger",
    });
  }
  if (stats.cases.high > 0) {
    quickActions.push({
      label: `${stats.cases.high} high-priority case${stats.cases.high !== 1 ? "s" : ""} open`,
      href: "/admin/cases",
      variant: "warning",
    });
  }
  if (poolAtRisk) {
    quickActions.push({
      label: "Pool balance low — top up",
      href: "/admin/finance",
      variant: "warning",
    });
  }
  if (stats.cases.openTotal > 0 && stats.cases.high === 0) {
    quickActions.push({
      label: `${stats.cases.openTotal} open case${stats.cases.openTotal !== 1 ? "s" : ""}`,
      href: "/admin/cases",
      variant: "neutral",
    });
  }

  return (
    <div className={styles.page}>
      {/* Quick action bar */}
      {quickActions.length > 0 && (
        <div className={styles.quickBar}>
          {quickActions.map((a) => (
            <a
              key={a.href + a.label}
              href={a.href}
              className={`${styles.quickAction} ${styles[`quickAction_${a.variant}`]}`}
            >
              {a.variant === "danger" && (
                <span className={styles.quickDot} style={{ background: "#ef4444" }} />
              )}
              {a.variant === "warning" && (
                <span className={styles.quickDot} style={{ background: "#f59e0b" }} />
              )}
              {a.label}
              <span className={styles.quickArrow}>→</span>
            </a>
          ))}
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Users */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Users</h2>
        <div className={styles.statGrid}>
          <StatCard label="Total Users" value={stats.users.total} color="green" />
          <StatCard
            label="Registered"
            value={stats.users.registered}
            sub={`${stats.users.guests} guests`}
            color="blue"
          />
          <StatCard label="Active (7 days)" value={stats.users.activeWeek} color="yellow" />
          <StatCard label="Active (30 days)" value={stats.users.activeMonth} color="yellow" />
        </div>
      </div>

      {/* Learning */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Learning</h2>
        <div className={styles.statGrid}>
          <StatCard label="Journeys" value={stats.learning.totalPaths} color="green" />
          <StatCard label="Total Lessons" value={stats.learning.totalLessons} color="blue" />
          <StatCard
            label="Lessons Completed"
            value={stats.learning.lessonsCompleted}
            color="purple"
          />
          <StatCard
            label="XP Distributed"
            value={stats.learning.totalXpDistributed.toLocaleString()}
            color="yellow"
          />
          <StatCard
            label="Engagement Rate"
            value={`${stats.learning.engagementRate}%`}
            sub="active users with ≥1 lesson"
            color={stats.learning.engagementRate >= 50 ? "green" : stats.learning.engagementRate >= 25 ? "yellow" : "red"}
          />
          <StatCard
            label="Avg Lessons / Active User"
            value={stats.learning.avgLessonsPerActiveUser}
            sub="past 30 days"
            color="blue"
          />
        </div>
      </div>

      {/* Cases */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Cases</h2>
        <div className={styles.casesRow}>
          <div className={styles.casesMain}>
            <div className={styles.statGrid}>
              <StatCard
                label="Open Cases"
                value={stats.cases.openTotal}
                sub={`${stats.cases.newThisWeek} new this week`}
                color={stats.cases.openTotal > 0 ? "blue" : "muted"}
              />
              <StatCard
                label="High Priority"
                value={stats.cases.high}
                color={stats.cases.high > 0 ? "red" : "muted"}
              />
              <StatCard
                label="Medium Priority"
                value={stats.cases.medium}
                color={stats.cases.medium > 0 ? "orange" : "muted"}
              />
              <StatCard label="Low Priority" value={stats.cases.low} color="muted" />
            </div>
          </div>
          <Link href="/admin/cases" className={styles.casesLink}>
            View all cases →
          </Link>
        </div>
      </div>

      {/* Payouts + Pool Health */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Payouts &amp; Pool Health</h2>
        <div className={styles.statGrid}>
          <StatCard
            label="Pending Review"
            value={stats.payouts.pending}
            color={stats.payouts.pending > 0 ? "red" : "muted"}
          />
          <StatCard label="Approved" value={stats.payouts.approved} color="yellow" />
          <StatCard label="Completed" value={stats.payouts.completed} color="green" />
          <StatCard
            label="Total Paid Out"
            value={`$${stats.payouts.totalDollars.toFixed(2)}`}
            color="green"
          />
          <div
            className={`${styles.statCard} ${styles[poolAtRisk ? "colorRed" : "colorGreen"]}`}
          >
            <div className={styles.statLabel}>Pool Balance</div>
            <div className={styles.statValue}>{formatCents(stats.pool.balanceCents)}</div>
            {stats.pool.pendingLiabilityCents > 0 && (
              <div className={`${styles.statSub} ${poolAtRisk ? styles.poolWarning : ""}`}>
                {poolAtRisk ? "⚠ " : ""}
                {formatCents(stats.pool.pendingLiabilityCents)} pending liability
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trends + Activity */}
      <div className={styles.bottomRow}>
        <div className={styles.trendsCol}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Trends</h2>
            {trendsLoading ? (
              <div className={styles.chartLoading}>Loading trends...</div>
            ) : trends ? (
              <div className={styles.chartsStack}>
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

        <div className={styles.activityCol}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            {activityLoading ? (
              <div className={styles.chartLoading}>Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className={styles.chartLoading}>No recent activity</div>
            ) : (
              <div className={styles.activityFeed}>
                {activity.map((ev) => (
                  <div key={ev.id} className={styles.activityItem}>
                    <span className={styles.activityIcon}>{ACTIVITY_ICON[ev.type]}</span>
                    <div className={styles.activityBody}>
                      {ev.link ? (
                        <a href={ev.link} className={styles.activityLabel}>
                          {ev.label}
                        </a>
                      ) : (
                        <span className={styles.activityLabel}>{ev.label}</span>
                      )}
                      <span className={styles.activityTime}>{timeAgo(ev.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
