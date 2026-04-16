"use client";

import { useState, useEffect, Fragment } from "react";
import styles from "./reports.module.css";

interface EngagementPoint {
  date: string;
  count: number;
}

interface ModuleDropoff {
  title: string;
  totalLessons: number;
  uniqueStarters: number;
  uniqueCompleters: number;
  completionRate: number;
}

interface PathDropoff {
  pathTitle: string;
  modules: ModuleDropoff[];
  totalLessons: number;
  uniqueStarters: number;
  uniqueCompleters: number;
  completionRate: number;
}

interface ReportsData {
  engagement: EngagementPoint[];
  dropoff: PathDropoff[];
  milestones: {
    pathCompletions: number;
    moduleCompletions: number;
    lessonsCompleted: number;
  };
  summary: {
    totalUsers: number;
    registeredUsers: number;
    guestUsers: number;
    activeWeek: number;
    activeMonth: number;
    totalXpDistributed: number;
    totalLessonsCompleted: number;
    totalPayoutRequests: number;
    totalPayoutDollars: number;
    completedPayouts: number;
    completedPayoutDollars: number;
    pathCompletions: number;
    moduleCompletions: number;
  };
}

type Range = "30" | "60" | "90";

function EngagementChart({ data, range }: { data: EngagementPoint[]; range: Range }) {
  const days = parseInt(range);
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const filtered = data.filter((d) => new Date(d.date) >= cutoff);

  if (filtered.length === 0) {
    return <div className={styles.noData}>No engagement data for this period</div>;
  }

  const values = filtered.map((d) => d.count);
  const max = Math.max(...values, 1);
  const min = 0;
  const range_ = max - min || 1;
  const w = 600;
  const h = 120;
  const pad = 6;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range_) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPoints = [`${pad},${h - pad}`, ...points, `${w - pad},${h - pad}`].join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.chartArea} preserveAspectRatio="none">
      <polygon points={areaPoints} fill="#22c55e" fillOpacity="0.1" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => {
        const [px, py] = points[i].split(",").map(Number);
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="3" fill="#22c55e" />
            <title>{filtered[i].date}: {v} lessons</title>
          </g>
        );
      })}
    </svg>
  );
}

function RateBar({ rate }: { rate: number }) {
  const colorClass = rate >= 60 ? styles.rateGreen : rate >= 30 ? styles.rateYellow : styles.rateRed;
  const textColor = rate >= 60 ? "#4ade80" : rate >= 30 ? "#fcd34d" : "#fca5a5";

  return (
    <div className={styles.rateBar}>
      <div className={styles.rateTrack}>
        <div
          className={`${styles.rateFill} ${colorClass}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className={styles.rateText} style={{ color: textColor }}>{rate}%</span>
    </div>
  );
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")) {
    return `"${escaped}"`;
  }
  return escaped;
}

function exportReportCSV(data: ReportsData) {
  const s = data.summary;
  const lines: string[] = [];

  lines.push("Learn2Earn Engagement & Outcomes Report");
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  lines.push("ENROLLMENT");
  lines.push(`Total Users,${s.totalUsers}`);
  lines.push(`Registered Users,${s.registeredUsers}`);
  lines.push(`Guest Users,${s.guestUsers}`);
  lines.push(`Active (7 days),${s.activeWeek}`);
  lines.push(`Active (30 days),${s.activeMonth}`);
  lines.push("");

  lines.push("LEARNING OUTCOMES");
  lines.push(`Total Lessons Completed,${s.totalLessonsCompleted}`);
  lines.push(`Total XP Distributed,${s.totalXpDistributed}`);
  lines.push(`Path Completions (milestones),${s.pathCompletions}`);
  lines.push(`Module Completions (milestones),${s.moduleCompletions}`);
  lines.push("");

  lines.push("PAYOUTS");
  lines.push(`Total Payout Requests,${s.totalPayoutRequests}`);
  lines.push(`Total Payout Value,$${s.totalPayoutDollars.toFixed(2)}`);
  lines.push(`Completed Payouts,${s.completedPayouts}`);
  lines.push(`Completed Payout Value,$${s.completedPayoutDollars.toFixed(2)}`);
  lines.push("");

  lines.push("ENGAGEMENT BY DAY (Past 90 Days)");
  lines.push("Date,Lessons Completed");
  for (const e of data.engagement) {
    lines.push(`${e.date},${e.count}`);
  }
  lines.push("");

  lines.push("DROP-OFF ANALYSIS BY PATH");
  lines.push("Path,Total Lessons,Starters,Completers,Starter Completion Rate");
  for (const p of data.dropoff) {
    lines.push(`${csvEscape(p.pathTitle)},${p.totalLessons},${p.uniqueStarters},${p.uniqueCompleters},${p.completionRate}%`);
    for (const m of p.modules) {
      lines.push(`${csvEscape("  " + m.title)},${m.totalLessons},${m.uniqueStarters},${m.uniqueCompleters},${m.completionRate}%`);
    }
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `learn2earn_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("30");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/stats/reports", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.reports);
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePath = (title: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (!data) return <div className={styles.error}>Failed to load report data</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reports</h1>
        <button className={styles.exportBtn} onClick={() => exportReportCSV(data)}>
          ↓ Download Full Report (CSV)
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Milestones Achieved</h2>
        <div className={styles.milestonesGrid}>
          <div className={`${styles.milestoneCard} ${styles.milestoneGreen}`}>
            <div className={styles.milestoneLabel}>Lessons Completed</div>
            <div className={styles.milestoneValue}>{data.milestones.lessonsCompleted.toLocaleString()}</div>
          </div>
          <div className={styles.milestoneCard}>
            <div className={styles.milestoneLabel}>Module Completions</div>
            <div className={styles.milestoneValue}>{data.milestones.moduleCompletions.toLocaleString()}</div>
          </div>
          <div className={`${styles.milestoneCard} ${styles.milestoneBlue}`}>
            <div className={styles.milestoneLabel}>Path Completions</div>
            <div className={styles.milestoneValue}>{data.milestones.pathCompletions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Lessons Completed Per Day</span>
            <div className={styles.rangePicker}>
              {(["30", "60", "90"] as Range[]).map((r) => (
                <button
                  key={r}
                  className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <EngagementChart data={data.engagement} range={range} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Drop-Off Analysis</h2>
        <table className={styles.dropoffTable}>
          <thead>
            <tr>
              <th>Path / Module</th>
              <th>Lessons</th>
              <th>Starters</th>
              <th>Completers</th>
              <th>Starter Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.dropoff.map((path) => (
              <Fragment key={path.pathTitle}>
                <tr
                  className={styles.pathRow}
                  onClick={() => togglePath(path.pathTitle)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    {expandedPaths.has(path.pathTitle) ? "▾" : "▸"} {path.pathTitle}
                  </td>
                  <td>{path.totalLessons}</td>
                  <td>{path.uniqueStarters}</td>
                  <td>{path.uniqueCompleters}</td>
                  <td><RateBar rate={path.completionRate} /></td>
                </tr>
                {expandedPaths.has(path.pathTitle) &&
                  path.modules.map((mod) => (
                    <tr key={`${path.pathTitle}-${mod.title}`} className={styles.moduleRow}>
                      <td>{mod.title}</td>
                      <td>{mod.totalLessons}</td>
                      <td>{mod.uniqueStarters}</td>
                      <td>{mod.uniqueCompleters}</td>
                      <td><RateBar rate={mod.completionRate} /></td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
