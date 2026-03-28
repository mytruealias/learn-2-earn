"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../layout";
import { useToast } from "../AdminToastContext";
import styles from "./finance.module.css";

interface DisbursementWindow {
  dollars: number;
  xp: number;
  count: number;
}

interface RecentPayout {
  id: string;
  learnerName: string;
  learnerEmail: string | null;
  caseNumber: string | null;
  dollarAmount: number;
  paymentMethod: string | null;
  status: string;
  date: string;
}

interface StripeInfo {
  connected: boolean;
  balance: { available: number; pending: number; currency: string } | null;
  accountName: string | null;
  error: string | null;
  keyConfigured: boolean;
}

interface PoolInfo {
  balanceCents: number;
  updatedAt: string;
}

interface FinanceData {
  disbursement: {
    days7: DisbursementWindow;
    days30: DisbursementWindow;
    days90: DisbursementWindow;
  };
  pendingLiability: { dollars: number; count: number };
  recentPayouts: RecentPayout[];
  stripe: StripeInfo;
  pool: PoolInfo;
}

interface Adjustment {
  id: string;
  amountCents: number;
  reason: string;
  createdAt: string;
  adminName: string;
}

function formatDollars(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatCents(cents: number) {
  return formatDollars(cents / 100);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminFinancePage() {
  const { admin } = useAdmin();
  const { showToast } = useToast();

  const [data, setData] = useState<FinanceData | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/finance", { credentials: "include" })
      .then((r) => {
        if (r.status === 403) { setAccessDenied(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.ok) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchAdjustments = useCallback(() => {
    fetch("/api/admin/finance/pool", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setAdjustments(d.adjustments);
      });
  }, []);

  useEffect(() => {
    fetchData();
    fetchAdjustments();
  }, [fetchData, fetchAdjustments]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason.trim()) return;

    const dollars = parseFloat(adjustAmount);
    if (isNaN(dollars) || dollars === 0) {
      showToast("Enter a valid non-zero amount", "error");
      return;
    }

    setAdjustSubmitting(true);
    try {
      const amountCents = Math.round(dollars * 100);
      const res = await fetch("/api/admin/finance/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, reason: adjustReason.trim() }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.ok) {
        showToast(dollars > 0 ? "Deposit recorded" : "Withdrawal recorded", "success");
        setAdjustAmount("");
        setAdjustReason("");
        setShowAdjustForm(false);
        fetchData();
        fetchAdjustments();
      } else {
        showToast(result.error || "Failed to record adjustment", "error");
      }
    } catch {
      showToast("Connection error", "error");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading finance dashboard...</div>;
  }

  if (accessDenied) {
    return (
      <div className={styles.forbiddenPage}>
        <div className={styles.forbiddenIcon}>🔒</div>
        <h1 className={styles.forbiddenTitle}>Access Restricted</h1>
        <p className={styles.forbiddenText}>
          The Finance dashboard is only available to Admin and Finance staff.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className={styles.error}>Failed to load finance data</div>;
  }

  const isFinanceOrAdmin = admin && ["admin", "finance"].includes(admin.role);
  const stripeConnected = data.stripe.connected;
  const poolDollars = data.pool.balanceCents / 100;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Finance</h1>
        <div className={styles.pageHeaderSub}>Payout pool overview and disbursement tracking</div>
      </div>

      <div className={styles.topRow}>
        <div className={styles.poolCard}>
          <div className={styles.poolLabel}>
            {stripeConnected ? "Stripe Available Balance" : "Payout Pool Balance"}
          </div>
          <div className={styles.poolAmount}>
            {stripeConnected && data.stripe.balance
              ? formatCents(data.stripe.balance.available)
              : formatDollars(poolDollars)}
          </div>
          {stripeConnected && data.stripe.balance && (
            <div className={styles.poolSub}>
              {formatCents(data.stripe.balance.pending)} pending in Stripe
            </div>
          )}
          {!stripeConnected && (
            <div className={styles.poolSub}>
              Manual pool — updated {formatDateTime(data.pool.updatedAt)}
            </div>
          )}
        </div>

        <div className={`${styles.liabilityCard}`}>
          <div className={styles.liabilityLabel}>Pending Liability</div>
          <div className={styles.liabilityAmount}>{formatDollars(data.pendingLiability.dollars)}</div>
          <div className={styles.liabilitySub}>{data.pendingLiability.count} payout{data.pendingLiability.count !== 1 ? "s" : ""} awaiting approval</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Disbursement Summary</h2>
        <div className={styles.disbGrid}>
          {(["days7", "days30", "days90"] as const).map((key) => {
            const w = data.disbursement[key];
            const label = key === "days7" ? "7 Days" : key === "days30" ? "30 Days" : "90 Days";
            return (
              <div key={key} className={styles.disbCard}>
                <div className={styles.disbPeriod}>{label}</div>
                <div className={styles.disbAmount}>{formatDollars(w.dollars)}</div>
                <div className={styles.disbMeta}>
                  {w.count} payout{w.count !== 1 ? "s" : ""} · {w.xp.toLocaleString()} XP converted
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.stripeSection}>
        {stripeConnected ? (
          <div className={styles.stripeConnectedCard}>
            <div className={styles.stripeConnectedBadge}>
              <span className={styles.stripeDot} />
              Stripe Connected
            </div>
            {data.stripe.accountName && (
              <div className={styles.stripeAccountName}>{data.stripe.accountName}</div>
            )}
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.stripeLink}
            >
              View in Stripe Dashboard →
            </a>
          </div>
        ) : (
          <div className={styles.stripeCtaCard}>
            <div className={styles.stripeCtaTitle}>
              {data.stripe.keyConfigured ? "Stripe Connection Error" : "Connect Stripe"}
            </div>
            <div className={styles.stripeCtaText}>
              {data.stripe.error
                ? `Could not connect to Stripe: ${data.stripe.error}`
                : "Link a Stripe account to show live balance from your connected payment account. Add a STRIPE_SECRET_KEY environment variable to get started."}
            </div>
            {!data.stripe.keyConfigured && (
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.stripeCtaLink}
              >
                Get your Stripe API key →
              </a>
            )}
          </div>
        )}
      </div>

      {!stripeConnected && isFinanceOrAdmin && (
        <div className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>Manage Pool Balance</h2>
            <button
              className={styles.addAdjBtn}
              onClick={() => setShowAdjustForm((v) => !v)}
            >
              {showAdjustForm ? "Cancel" : "+ Record Adjustment"}
            </button>
          </div>

          {showAdjustForm && (
            <form onSubmit={handleAdjust} className={styles.adjustForm}>
              <div className={styles.adjustFormRow}>
                <div className={styles.adjustFormGroup}>
                  <label className={styles.adjustLabel}>Amount (USD)</label>
                  <div className={styles.adjustAmountWrap}>
                    <span className={styles.adjustCurrencySign}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="e.g. 500.00 or -100.00"
                      className={styles.adjustInput}
                      required
                    />
                  </div>
                  <div className={styles.adjustHint}>Positive = deposit, negative = withdrawal</div>
                </div>
                <div className={styles.adjustFormGroup} style={{ flex: 2 }}>
                  <label className={styles.adjustLabel}>Reason</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value.slice(0, 200))}
                    placeholder="e.g. Grant deposit from City of Austin"
                    className={styles.adjustInput}
                    required
                  />
                </div>
              </div>
              <div className={styles.adjustFormActions}>
                <button type="submit" disabled={adjustSubmitting} className={styles.adjustSubmitBtn}>
                  {adjustSubmitting ? "Saving..." : "Record Adjustment"}
                </button>
              </div>
            </form>
          )}

          {adjustments.length > 0 && (
            <div className={styles.adjTable}>
              <div className={styles.adjTableHeader}>
                <span>Date</span>
                <span>Amount</span>
                <span>Reason</span>
                <span>By</span>
              </div>
              {adjustments.map((a) => (
                <div key={a.id} className={styles.adjTableRow}>
                  <span className={styles.adjDate}>{formatDateTime(a.createdAt)}</span>
                  <span className={`${styles.adjAmount} ${a.amountCents > 0 ? styles.adjDeposit : styles.adjWithdrawal}`}>
                    {a.amountCents > 0 ? "+" : ""}{formatCents(a.amountCents)}
                  </span>
                  <span className={styles.adjReason}>{a.reason}</span>
                  <span className={styles.adjAdmin}>{a.adminName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Payouts</h2>
        {data.recentPayouts.length === 0 ? (
          <div className={styles.emptyTable}>No completed or approved payouts yet</div>
        ) : (
          <div className={styles.recentTable}>
            <div className={styles.recentTableHeader}>
              <span>Learner</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {data.recentPayouts.map((p) => (
              <div key={p.id} className={styles.recentTableRow}>
                <span className={styles.recentLearner}>
                  <span className={styles.recentLearnerName}>{p.learnerName}</span>
                  {p.caseNumber && <span className={styles.recentCaseNum}>#{p.caseNumber}</span>}
                </span>
                <span className={styles.recentAmount}>{formatDollars(p.dollarAmount)}</span>
                <span className={styles.recentMethod}>{p.paymentMethod || "—"}</span>
                <span className={`${styles.recentStatus} ${p.status === "completed" ? styles.statusComplete : styles.statusApproved}`}>
                  {p.status}
                </span>
                <span className={styles.recentDate}>{formatDate(p.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
