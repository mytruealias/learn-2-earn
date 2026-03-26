"use client";

import { useState, useEffect } from "react";

type AdminView = "dashboard" | "users" | "payouts" | "approving" | "done";

const DEMO_USERS = [
  { name: "Marcus T.", case: "2024-0041", xp: 120, lessons: 8, status: "active" },
  { name: "Deja W.", case: "2024-0038", xp: 90, lessons: 6, status: "active" },
  { name: "Roberto L.", case: "2024-0044", xp: 60, lessons: 4, status: "pending" },
];

const DEMO_PAYOUT = {
  name: "Marcus T.",
  case: "2024-0041",
  xp: 120,
  amount: "$4.00",
  method: "Venmo",
  handle: "@marcus-t",
};

export default function AdminDemo() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<AdminView>("dashboard");
  const [rowHighlight, setRowHighlight] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    type Step = { view: AdminView; delay: number; highlight?: boolean };
    const sequence: Step[] = [
      { view: "dashboard", delay: 2800 },
      { view: "users",     delay: 3000 },
      { view: "payouts",   delay: 2400, highlight: true },
      { view: "approving", delay: 1600 },
      { view: "done",      delay: 3200 },
      { view: "dashboard", delay: 2000 },
    ];

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    function run() {
      if (step >= sequence.length) {
        step = 0;
        setRowHighlight(false);
      }
      const s = sequence[step];
      setView(s.view);
      setRowHighlight(!!s.highlight);
      step++;
      timer = setTimeout(run, s.delay);
    }

    run();
    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="ademo-wrap">
        <div className="ademo-loading">Loading admin demo…</div>
      </div>
    );
  }

  const isPayoutView = view === "payouts" || view === "approving" || view === "done";

  return (
    <div className="ademo-wrap">
      <div className="ademo-browser">
        <div className="ademo-chrome">
          <div className="ademo-dots">
            <span className="ademo-dot ademo-dot-red"></span>
            <span className="ademo-dot ademo-dot-yellow"></span>
            <span className="ademo-dot ademo-dot-green"></span>
          </div>
          <div className="ademo-url">learn2earn.app/admin</div>
        </div>

        <div className="ademo-shell">
          <div className="ademo-sidebar">
            <div className="ademo-brand">
              <div className="ademo-brand-tag">LEARN_2_EARN</div>
              <div className="ademo-brand-sub">Admin Panel</div>
            </div>
            <nav className="ademo-nav">
              <div className={`ademo-nav-item ${view === "dashboard" ? "ademo-nav-active" : ""}`}>
                <span className="ademo-nav-icon">◉</span> Dashboard
              </div>
              <div className={`ademo-nav-item ${view === "users" ? "ademo-nav-active" : ""}`}>
                <span className="ademo-nav-icon">◎</span> Users
              </div>
              <div className={`ademo-nav-item ${isPayoutView ? "ademo-nav-active" : ""}`}>
                <span className="ademo-nav-icon">$</span> Payouts
                {view === "payouts" && <span className="ademo-badge-dot">3</span>}
              </div>
              <div className="ademo-nav-item ademo-nav-dim">
                <span className="ademo-nav-icon">⊡</span> Audit Log
              </div>
            </nav>
            <div className="ademo-sidebar-foot">
              <div className="ademo-admin-name">Alex Rivera</div>
              <div className="ademo-admin-role">admin</div>
            </div>
          </div>

          <div className="ademo-main">
            {view === "dashboard" && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-tag">SYSTEM_OVERVIEW</div>
                <div className="ademo-page-title">Dashboard</div>
                <div className="ademo-stat-grid">
                  <div className="ademo-stat-card ademo-stat-green">
                    <div className="ademo-stat-label">Total Users</div>
                    <div className="ademo-stat-value">47</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-blue">
                    <div className="ademo-stat-label">Active (7d)</div>
                    <div className="ademo-stat-value">31</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-red">
                    <div className="ademo-stat-label">Pending Payouts</div>
                    <div className="ademo-stat-value">3</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-gold">
                    <div className="ademo-stat-label">Total Paid Out</div>
                    <div className="ademo-stat-value">$124.50</div>
                  </div>
                </div>
                <div className="ademo-chart-card">
                  <div className="ademo-chart-label">Learner Registrations — Past 30 Days</div>
                  <svg viewBox="0 0 500 70" className="ademo-sparkline" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ff88" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="0,70 0,58 60,50 120,44 180,36 240,28 300,22 360,16 420,10 500,6 500,70"
                      fill="url(#spark-fill)"
                    />
                    <polyline
                      points="0,58 60,50 120,44 180,36 240,28 300,22 360,16 420,10 500,6"
                      fill="none" stroke="#00ff88" strokeWidth="2"
                      strokeLinejoin="round" strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            )}

            {view === "users" && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-tag">PARTICIPANT_MANAGEMENT</div>
                <div className="ademo-page-title">Users</div>
                <div className="ademo-table">
                  <div className="ademo-table-head">
                    <span>Name</span>
                    <span>Case #</span>
                    <span>XP</span>
                    <span>Lessons</span>
                    <span>Status</span>
                  </div>
                  {DEMO_USERS.map((u, i) => (
                    <div key={i} className="ademo-table-row">
                      <span className="ademo-user-name">{u.name}</span>
                      <span className="ademo-dim">{u.case}</span>
                      <span className="ademo-xp-val">{u.xp} XP</span>
                      <span className="ademo-dim">{u.lessons}</span>
                      <span className={`ademo-pill ${u.status === "active" ? "ademo-pill-green" : "ademo-pill-yellow"}`}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPayoutView && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-tag">PAYOUT_REVIEW</div>
                <div className="ademo-page-title">Payouts</div>

                <div className={`ademo-payout-card ${rowHighlight ? "ademo-payout-hl" : ""} ${view === "done" ? "ademo-payout-done" : ""}`}>
                  <div className="ademo-payout-body">
                    <div className="ademo-payout-info">
                      <div className="ademo-payout-name">{DEMO_PAYOUT.name}</div>
                      <div className="ademo-payout-meta">{DEMO_PAYOUT.case} · {DEMO_PAYOUT.xp} XP</div>
                    </div>
                    <div className="ademo-payout-amt">{DEMO_PAYOUT.amount}</div>
                    <div className="ademo-payout-method-wrap">
                      <div className="ademo-payout-method">{DEMO_PAYOUT.method}</div>
                      <div className="ademo-dim">{DEMO_PAYOUT.handle}</div>
                    </div>
                    {view === "done" ? (
                      <div className="ademo-pill ademo-pill-green">approved ✓</div>
                    ) : (
                      <div className={`ademo-approve-btn ${view === "approving" ? "ademo-approve-busy" : ""}`}>
                        {view === "approving" ? "Approving…" : "APPROVE"}
                      </div>
                    )}
                  </div>
                  {view === "done" && (
                    <div className="ademo-pay-link">
                      <span className="ademo-pay-link-icon">↗</span>
                      PAY NOW via Venmo
                    </div>
                  )}
                </div>

                <div className="ademo-payout-card ademo-payout-dim">
                  <div className="ademo-payout-body">
                    <div className="ademo-payout-info">
                      <div className="ademo-payout-name">Deja W.</div>
                      <div className="ademo-payout-meta">2024-0038 · 90 XP</div>
                    </div>
                    <div className="ademo-payout-amt">$3.00</div>
                    <div className="ademo-payout-method-wrap">
                      <div className="ademo-payout-method">PayPal</div>
                      <div className="ademo-dim">deja.w</div>
                    </div>
                    <div className="ademo-approve-btn">APPROVE</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ademo-caption">
        {view === "dashboard" && "Real-time overview — learners, completions, and financial health at a glance"}
        {view === "users" && "Participant management with case numbers, XP earned, and lesson progress"}
        {view === "payouts" && "Pending payout queue — review each request before approving disbursement"}
        {view === "approving" && "One-click approval with a full audit trail of who approved and when"}
        {view === "done" && "Deep-link to Venmo, PayPal, or Cash App opens instantly — no copy-paste needed"}
      </div>
    </div>
  );
}
