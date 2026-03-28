"use client";

import { useState, useEffect } from "react";

type AdminView = "dashboard" | "cases" | "users" | "payouts" | "approving" | "done";

const DEMO_USERS = [
  { name: "Marcus T.", case: "2024-0041", xp: 120, lessons: 8, status: "active" },
  { name: "Deja W.",   case: "2024-0038", xp: 90,  lessons: 6, status: "active" },
  { name: "Roberto L.", case: "2024-0044", xp: 60, lessons: 4, status: "pending" },
];

const DEMO_CASES = [
  { name: "Marcus T.", type: "Housing",   priority: "high",   status: "open",     worker: "A. Rivera" },
  { name: "Deja W.",   type: "Benefits",  priority: "medium", status: "in_review", worker: "A. Rivera" },
  { name: "Elena M.",  type: "Employment",priority: "low",    status: "open",     worker: "J. Kim" },
];

const DEMO_PAYOUT = {
  name: "Marcus T.",
  case: "2024-0041",
  xp: 120,
  amount: "$4.00",
  method: "Venmo",
  handle: "@marcus-t",
};

const PRIORITY_COLOR: Record<string, string> = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#22c55e",
};

const STATUS_LABEL: Record<string, string> = {
  open:      "Open",
  in_review: "In Review",
  resolved:  "Resolved",
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
      { view: "dashboard", delay: 3000 },
      { view: "cases",     delay: 2600 },
      { view: "users",     delay: 2400 },
      { view: "payouts",   delay: 2200, highlight: true },
      { view: "approving", delay: 1600 },
      { view: "done",      delay: 3000 },
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
              <div className="ademo-brand-wordmark">Learn<span>2</span>Earn</div>
              <div className="ademo-brand-sub">Admin Portal</div>
            </div>

            <nav className="ademo-nav">
              <div className={`ademo-nav-item ${view === "dashboard" ? "ademo-nav-active" : ""}`}>
                <svg className="ademo-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                Dashboard
              </div>

              <div className="ademo-nav-group-label">Learner Management</div>
              <div className={`ademo-nav-item ${view === "users" ? "ademo-nav-active" : ""}`}>
                <svg className="ademo-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Users
              </div>
              <div className={`ademo-nav-item ${isPayoutView ? "ademo-nav-active" : ""}`}>
                <svg className="ademo-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Payouts
                {view === "payouts" && <span className="ademo-badge-dot">3</span>}
              </div>

              <div className="ademo-nav-group-label">Case Management</div>
              <div className={`ademo-nav-item ${view === "cases" ? "ademo-nav-active" : ""}`}>
                <svg className="ademo-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
                Cases
              </div>

              <div className="ademo-nav-group-label">Finance</div>
              <div className="ademo-nav-item ademo-nav-dim">
                <svg className="ademo-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Finance
              </div>
            </nav>

            <div className="ademo-sidebar-foot">
              <div className="ademo-admin-avatar">AR</div>
              <div>
                <div className="ademo-admin-name">Alex Rivera</div>
                <div className="ademo-admin-role">admin</div>
              </div>
            </div>
          </div>

          <div className="ademo-main">

            {view === "dashboard" && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-title">Dashboard</div>
                <div className="ademo-stat-grid">
                  <div className="ademo-stat-card ademo-stat-blue">
                    <div className="ademo-stat-label">Total Users</div>
                    <div className="ademo-stat-value">47</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-green">
                    <div className="ademo-stat-label">Active (7d)</div>
                    <div className="ademo-stat-value">31</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-red">
                    <div className="ademo-stat-label">Open Cases</div>
                    <div className="ademo-stat-value">8</div>
                  </div>
                  <div className="ademo-stat-card ademo-stat-gold">
                    <div className="ademo-stat-label">Pool Balance</div>
                    <div className="ademo-stat-value">$840</div>
                  </div>
                </div>

                <div className="ademo-section-head">Recent Cases</div>
                <div className="ademo-mini-cases">
                  {DEMO_CASES.slice(0, 2).map((c, i) => (
                    <div key={i} className="ademo-mini-case-row">
                      <span className="ademo-priority-dot" style={{ background: PRIORITY_COLOR[c.priority] }}></span>
                      <span className="ademo-mini-case-name">{c.name}</span>
                      <span className="ademo-mini-case-type">{c.type}</span>
                      <span className={`ademo-pill ademo-pill-status-${c.status}`}>{STATUS_LABEL[c.status]}</span>
                    </div>
                  ))}
                </div>

                <div className="ademo-section-head" style={{ marginTop: "0.75rem" }}>Pool Health</div>
                <div className="ademo-pool-bar-wrap">
                  <div className="ademo-pool-bar">
                    <div className="ademo-pool-bar-fill" style={{ width: "67%" }}></div>
                  </div>
                  <span className="ademo-pool-pct">67% funded</span>
                </div>
              </div>
            )}

            {view === "cases" && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-title">Cases</div>
                <div className="ademo-table">
                  <div className="ademo-table-head">
                    <span></span>
                    <span>Learner</span>
                    <span>Type</span>
                    <span>Status</span>
                  </div>
                  {DEMO_CASES.map((c, i) => (
                    <div key={i} className="ademo-table-row">
                      <span>
                        <span className="ademo-priority-dot" style={{ background: PRIORITY_COLOR[c.priority] }}></span>
                      </span>
                      <span className="ademo-user-name">{c.name}</span>
                      <span className="ademo-dim">{c.type}</span>
                      <span className={`ademo-pill ademo-pill-status-${c.status}`}>{STATUS_LABEL[c.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "users" && (
              <div className="ademo-page ademo-fade-in">
                <div className="ademo-page-title">Users</div>
                <div className="ademo-table">
                  <div className="ademo-table-head ademo-users-head">
                    <span>Name</span>
                    <span>Case #</span>
                    <span>XP</span>
                    <span>Status</span>
                  </div>
                  {DEMO_USERS.map((u, i) => (
                    <div key={i} className="ademo-table-row ademo-users-row">
                      <span className="ademo-user-name">{u.name}</span>
                      <span className="ademo-dim">{u.case}</span>
                      <span className="ademo-xp-val">{u.xp} XP</span>
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
                        {view === "approving" ? "Approving…" : "Approve"}
                      </div>
                    )}
                  </div>
                  {view === "done" && (
                    <div className="ademo-pay-link">
                      <span className="ademo-pay-link-icon">↗</span>
                      Pay via Venmo
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
                    <div className="ademo-approve-btn">Approve</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="ademo-caption">
        {view === "dashboard" && "Real-time overview — learner activity, open cases, and pool health at a glance"}
        {view === "cases"     && "Case management — priority-flagged cases with type, status, and assigned caseworker"}
        {view === "users"     && "Participant management with case numbers, XP earned, and lesson progress"}
        {view === "payouts"   && "Pending payout queue — review each request before approving disbursement"}
        {view === "approving" && "One-click approval with a full audit trail of who approved and when"}
        {view === "done"      && "Deep-link to Venmo, PayPal, or Cash App opens instantly — no copy-paste needed"}
      </div>
    </div>
  );
}
