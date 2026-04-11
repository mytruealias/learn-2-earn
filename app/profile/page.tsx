"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpButton from "../components/HelpButton";
import { StarIcon, BookIcon, WalletIcon, CashIcon, LightbulbIcon, ClipboardIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon } from "../components/icons";

interface PayoutRequest {
  id: string;
  xpAmount: number;
  dollarAmount: number;
  status: string;
  note: string | null;
  paymentMethod: string | null;
  paymentHandle: string | null;
  createdAt: string;
}

interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
}

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  caseNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  totalXp: number;
  hearts: number;
  streak: number;
  streakFreezes?: number;
  lastFreezeUsedAt?: string | null;
  lessonsCompleted: number;
  availableXp: number;
  availableBalance: number;
  totalEarnings: number;
  payoutRequests: PayoutRequest[];
  badges?: Badge[];
}

const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "paypal", label: "PayPal" },
  { value: "cashapp", label: "Cash App" },
  { value: "check", label: "Check" },
];

const PAYMENT_PLACEHOLDERS: Record<string, string> = {
  zelle: "Email or phone number linked to Zelle",
  venmo: "@your-venmo-handle",
  paypal: "your@email.com or PayPal handle",
  cashapp: "$your-cashtag",
  check: "Full name and mailing address",
};

const MIN_PAYOUT_XP = 20;
const WEEKLY_XP_CAP = 500;
const XP_TO_DOLLAR = 0.05;

const BADGE_GROUPS = [
  { label: "Lessons",     ids: ["first_lesson","lessons_5","lessons_10","lessons_25","lessons_50"] },
  { label: "Streaks",     ids: ["streak_3","streak_7","streak_14","streak_30"] },
  { label: "Earnings",    ids: ["xp_50","xp_100","xp_500","first_payout"] },
  { label: "Paths",       ids: ["first_path","paths_2","paths_3"] },
  { label: "Perfect Play",ids: ["perfect_lesson","perfect_3","perfect_5"] },
];

const BADGE_HOW_TO: Record<string, string> = {
  first_lesson:        "Complete your very first lesson on any learning path.",
  lessons_5:           "Finish 5 lessons total — mix any paths you like.",
  lessons_10:          "Complete 10 lessons total across any paths.",
  lessons_25:          "Keep going — 25 lessons completed across any paths.",
  lessons_50:          "A true scholar. Complete 50 lessons total.",
  streak_3:            "Log in and complete at least one lesson 3 days in a row.",
  streak_7:            "Keep your streak alive for 7 consecutive days.",
  streak_14:           "Two weeks of showing up — 14 days in a row.",
  streak_30:           "A full month of daily learning — 30 days in a row.",
  xp_50:               "Earn a total of 50 XP by completing lessons (worth $2.50).",
  xp_100:              "Earn 100 XP total — that's $5.00 in your pocket.",
  xp_500:              "Earn 500 XP total — the weekly cap and worth $25!",
  first_payout:        "Request your first cash payout from the Earnings tab.",
  first_path:          "Complete every single lesson in one full learning path.",
  paths_2:             "Finish all lessons in 2 different learning paths.",
  paths_3:             "Master 3 complete learning paths from start to finish.",
  perfect_lesson:      "Complete any lesson without losing a single heart.",
  perfect_3:           "Achieve 3 perfectly completed lessons — no hearts lost.",
  perfect_5:           "Go flawless on 5 different lessons — no hearts lost.",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentHandle, setPaymentHandle] = useState("");
  const [tab, setTab] = useState<"overview" | "earnings" | "achievements" | "info">("overview");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [xpToRedeem, setXpToRedeem] = useState(20);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "", dateOfBirth: "", phone: "", city: "",
    state: "", zipCode: "", emergencyContactName: "", emergencyContactPhone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = localStorage.getItem("l2e_user_id");
    const loggedIn = localStorage.getItem("l2e_logged_in");

    if (!userId || !loggedIn) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      const avail = data.user?.availableXp ?? 0;
      setXpToRedeem(Math.min(Math.max(avail, MIN_PAYOUT_XP), WEEKLY_XP_CAP));
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (!user) return;
    setEditForm({
      fullName: user.fullName || "",
      dateOfBirth: user.dateOfBirth || "",
      phone: user.phone || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
    });
    setSaveMsg("");
    setEditing(true);
  };

  const saveProfile = async () => {
    const userId = localStorage.getItem("l2e_user_id");
    if (!userId) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setUser((prev) => prev ? { ...prev, ...data.user } : prev);
      setEditing(false);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handlePayout = async () => {
    if (!user || user.availableXp < MIN_PAYOUT_XP) return;
    if (!paymentMethod || !paymentHandle.trim()) return;

    setPayoutLoading(true);
    setPayoutMsg("");

    try {
      const res = await fetch("/api/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, xpAmount: xpToRedeem, paymentMethod, paymentHandle }),
      });

      const data = await res.json();

      if (res.ok) {
        setPayoutMsg("Payout request submitted! You'll be notified when it's ready.");
        setPaymentMethod("");
        setPaymentHandle("");
        loadProfile();
      } else {
        setPayoutMsg(data.error || "Failed to submit request");
      }
    } catch {
      setPayoutMsg("Connection error. Please try again.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("l2e_logged_in");
    router.push("/app");
  };

  if (loading) {
    return (
      <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--accent-green)", fontSize: "1rem", fontWeight: "600" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statusColors: Record<string, string> = {
    pending: "var(--accent-gold)",
    approved: "var(--accent-green)",
    rejected: "var(--accent-red)",
    completed: "var(--accent-blue)",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <ClockIcon size={14} />,
    approved: <CheckCircleIcon size={14} />,
    rejected: <XCircleIcon size={14} />,
    completed: <CashIcon size={14} />,
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", padding: "0 0 6rem 0" }}>
      <header style={{
        padding: "1.5rem 1.5rem",
        background: "linear-gradient(180deg, rgba(59,158,255,0.07) 0%, rgba(167,139,250,0.04) 50%, transparent 100%)",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <Link href="/app" style={{
              color: "var(--accent-green)",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}>
              <div style={{ transform: "rotate(180deg)", display: "flex" }}>
                <ChevronRightIcon size={16} color="var(--accent-green)" />
              </div>
              Back to Home
            </Link>
            <button onClick={handleLogout} style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "0.4rem 0.85rem",
              fontWeight: "600",
            }}>
              Log Out
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              color: "#fff",
              fontWeight: "700",
            }}>
              {(user.fullName || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: "700",
              }}>
                {user.fullName || "Member"}
              </h1>
              {user.email && (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{user.email}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1rem 1.5rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}>
          {[
            { label: "Total XP", value: user.totalXp.toLocaleString(), color: "var(--accent-green)", icon: <StarIcon size={20} color="var(--accent-green)" /> },
            { label: "Lessons", value: user.lessonsCompleted.toString(), color: "var(--accent-blue)", icon: <BookIcon size={20} color="var(--accent-blue)" /> },
            { label: "Balance", value: `$${user.totalEarnings.toFixed(2)}`, color: "var(--accent-gold)", icon: <WalletIcon size={20} color="var(--accent-gold)" /> },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1rem",
              textAlign: "center",
            }}>
              <div style={{ marginBottom: "0.3rem", display: "flex", justifyContent: "center" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.65rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex",
          gap: "0",
          marginBottom: "1.5rem",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}>
          {(["overview", "earnings", "achievements", "info"] as const).map((t, i, arr) => {
            const active = tab === t;
            const color = active ? "var(--accent-green)" : "var(--text-muted)";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "0.7rem 0.25rem",
                  backgroundColor: active ? "var(--bg-card-hover)" : "var(--bg-card)",
                  color,
                  borderRight: i < arr.length - 1 ? "1px solid var(--border-color)" : "none",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                }}
              >
                {t === "overview"      && <LightbulbIcon size={15} color={color} />}
                {t === "earnings"      && <CashIcon size={15} color={color} />}
                {t === "achievements"  && <span style={{ fontSize: "15px", lineHeight: 1 }}>🏆</span>}
                {t === "info"          && <ClipboardIcon size={15} color={color} />}
                {t === "overview" ? "Overview" : t === "earnings" ? "Earnings" : t === "achievements" ? "Awards" : "Info"}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--accent-gold)" }}>{user.streak} day streak</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Streak</div>
                </div>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: (user.streakFreezes ?? 1) > 0 ? "rgba(59,158,255,0.1)" : "rgba(136,146,176,0.08)",
                border: `1px solid ${(user.streakFreezes ?? 1) > 0 ? "rgba(59,158,255,0.3)" : "rgba(136,146,176,0.2)"}`,
                borderRadius: "8px",
                padding: "0.5rem 0.85rem",
                opacity: (user.streakFreezes ?? 1) > 0 ? 1 : 0.6,
              }}>
                <span style={{ fontSize: "1.1rem", filter: (user.streakFreezes ?? 1) > 0 ? "none" : "grayscale(1)" }}>❄️</span>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: (user.streakFreezes ?? 1) > 0 ? "var(--accent-blue)" : "var(--text-muted)" }}>
                    {(user.streakFreezes ?? 1) > 0 ? "Freeze Ready" : "Freeze Used"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {(user.streakFreezes ?? 1) > 0 ? "Protects 1 missed day" : "Earns back at 7-day streak"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "2px solid var(--accent-gold)",
              borderRadius: "16px",
              padding: "1.5rem",
            }}>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "var(--accent-gold)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}>
                <WalletIcon size={16} color="var(--accent-gold)" />
                XP to Cash — 1 XP = $0.05
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--accent-gold)" }}>
                  ${user.availableBalance.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  available ({user.availableXp} XP)
                </div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Total earned: ${user.totalEarnings.toFixed(2)} • {user.totalXp} XP total
              </div>

              {(!user.fullName || !user.email) ? (
                <div style={{
                  padding: "1rem",
                  backgroundColor: "rgba(255,180,0,0.08)",
                  border: "1px solid rgba(255,180,0,0.3)",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                }}>
                  Complete your profile (name and email) before requesting a payout.{" "}
                  <Link href="/profile?tab=info" style={{ color: "var(--accent-gold)", fontWeight: "700" }}>
                    Fill in your info →
                  </Link>
                </div>
              ) : user.availableXp < MIN_PAYOUT_XP ? (
                <div style={{
                  width: "100%",
                  padding: "0.85rem",
                  backgroundColor: "var(--bg-card-hover)",
                  color: "var(--text-muted)",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-display)",
                  textAlign: "center",
                }}>
                  You need {MIN_PAYOUT_XP - user.availableXp} more XP to request a payout (min {MIN_PAYOUT_XP} XP = ${(MIN_PAYOUT_XP * XP_TO_DOLLAR).toFixed(2)})
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {/* XP amount slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Amount to Redeem
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--accent-gold)" }}>
                        {xpToRedeem} XP = ${(xpToRedeem * XP_TO_DOLLAR).toFixed(2)}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={MIN_PAYOUT_XP}
                      max={Math.min(user.availableXp, WEEKLY_XP_CAP)}
                      step={1}
                      value={xpToRedeem}
                      onChange={(e) => setXpToRedeem(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--accent-gold)", cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      <span>{MIN_PAYOUT_XP} XP min</span>
                      <span>{Math.min(user.availableXp, WEEKLY_XP_CAP)} XP max</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                      Payment Method
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => { setPaymentMethod(m.value); setPaymentHandle(""); }}
                          style={{
                            padding: "0.45rem 0.9rem",
                            backgroundColor: paymentMethod === m.value ? "var(--accent-gold)" : "var(--bg-card-hover)",
                            color: paymentMethod === m.value ? "#0f1923" : "var(--text-secondary)",
                            border: `1px solid ${paymentMethod === m.value ? "var(--accent-gold)" : "var(--border-color)"}`,
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "0.8rem",
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                        {paymentMethod === "check" ? "Mailing Address" : "Handle / Address"}
                      </div>
                      <input
                        type="text"
                        value={paymentHandle}
                        onChange={(e) => setPaymentHandle(e.target.value)}
                        placeholder={PAYMENT_PLACEHOLDERS[paymentMethod] || ""}
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          backgroundColor: "var(--bg-card-hover)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "10px",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}

                  <button
                    onClick={handlePayout}
                    disabled={payoutLoading || !paymentMethod || !paymentHandle.trim()}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      backgroundColor: (!paymentMethod || !paymentHandle.trim()) ? "var(--bg-card-hover)" : "var(--accent-gold)",
                      color: (!paymentMethod || !paymentHandle.trim()) ? "var(--text-muted)" : "#0f1923",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {payoutLoading ? "Processing..." : `Request $${(xpToRedeem * XP_TO_DOLLAR).toFixed(2)} Payout`}
                  </button>
                </div>
              )}

              {payoutMsg && (
                <div style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: payoutMsg.includes("error") || payoutMsg.includes("Failed") ? "var(--accent-red)" : "var(--accent-green)",
                  lineHeight: "1.5",
                }}>
                  {payoutMsg}
                </div>
              )}
            </div>

            {/* Achievements teaser */}
            {user.badges && user.badges.length > 0 && (() => {
              const earned = user.badges.filter((b) => b.earned).length;
              const total = user.badges.length;
              const pct = Math.round((earned / total) * 100);
              const recent = user.badges.filter((b) => b.earned).slice(-3);
              return (
                <button
                  onClick={() => setTab("achievements")}
                  style={{
                    width: "100%",
                    background: "none",
                    padding: 0,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    borderRadius: "14px",
                    padding: "1rem 1.25rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>🏆</span>
                        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-purple)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Achievements
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)" }}>
                          {earned}/{total}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-purple)" }}>→</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, var(--accent-purple), var(--accent-blue))",
                            borderRadius: "3px",
                          }} />
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                          {pct}% complete — tap to see all
                        </div>
                      </div>
                      {recent.length > 0 && (
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {recent.map((b) => (
                            <span key={b.id} style={{ fontSize: "1.25rem" }}>{b.icon}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })()}

          </div>
        )}

        {tab === "earnings" && (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-green)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Payout History
            </div>
            {user.payoutRequests.length === 0 ? (
              <div style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px",
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
              }}>
                No payout requests yet. Keep earning XP and request your first payout!
              </div>
            ) : (
              user.payoutRequests.map((p) => (
                <div key={p.id} style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  borderLeft: `3px solid ${statusColors[p.status] || "var(--text-muted)"}`,
                  padding: "0.85rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      ${p.dollarAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {p.xpAmount} XP — {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    color: statusColors[p.status] || "var(--text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                    background: `${statusColors[p.status] || "var(--text-muted)"}15`,
                  }}>
                    <span style={{ color: statusColors[p.status] }}>{statusIcons[p.status]}</span>
                    {p.status}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "achievements" && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {(() => {
              const badges = user.badges ?? [];
              const earnedCount = badges.filter((b) => b.earned).length;
              const totalCount = badges.length;
              const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
              return (
                <>
            {/* Header bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-purple)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                All Achievements
              </div>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "var(--text-muted)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                padding: "0.2rem 0.75rem",
              }}>
                {earnedCount} / {totalCount} earned
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%`,
                background: "linear-gradient(90deg, var(--accent-purple), var(--accent-blue))",
                borderRadius: "3px",
                transition: "width 0.5s ease",
              }} />
            </div>

            {/* Badge groups */}
            {(() => {
              return BADGE_GROUPS.map((group) => {
                const groupBadges = group.ids.map((id) => byId[id]).filter(Boolean);
                if (groupBadges.length === 0) return null;
                const groupEarned = groupBadges.filter((b) => b.earned).length;
                return (
                  <div key={group.label} style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}>
                    {/* Group header */}
                    <div style={{
                      padding: "0.65rem 1rem",
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "rgba(255,255,255,0.02)",
                    }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--accent-purple)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {group.label}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "600" }}>
                        {groupEarned}/{groupBadges.length}
                      </div>
                    </div>

                    {/* Badge rows */}
                    <div>
                      {groupBadges.map((badge, idx) => {
                        const isOpen = selectedBadge === badge.id;
                        const howTo = BADGE_HOW_TO[badge.id] || badge.description;
                        return (
                          <div key={badge.id}>
                            <button
                              onClick={() => setSelectedBadge(isOpen ? null : badge.id)}
                              style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                borderTop: idx > 0 ? "1px solid var(--border-color)" : "none",
                                cursor: "pointer",
                                padding: "0.75rem 1rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.85rem",
                                textAlign: "left",
                              }}
                            >
                              {/* Icon */}
                              <div style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.4rem",
                                flexShrink: 0,
                                backgroundColor: badge.earned ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${badge.earned ? "rgba(167,139,250,0.4)" : "var(--border-color)"}`,
                                filter: badge.earned ? "none" : "grayscale(1)",
                                opacity: badge.earned ? 1 : 0.45,
                              }}>
                                {badge.icon}
                              </div>

                              {/* Name + description */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "700",
                                  color: badge.earned ? "var(--text-primary)" : "var(--text-secondary)",
                                  marginBottom: "0.15rem",
                                }}>
                                  {badge.label}
                                </div>
                                <div style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                  lineHeight: "1.3",
                                }}>
                                  {badge.description}
                                </div>
                              </div>

                              {/* Status pill */}
                              <div style={{
                                flexShrink: 0,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "20px",
                                backgroundColor: badge.earned ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                                color: badge.earned ? "var(--accent-green)" : "var(--text-muted)",
                                border: `1px solid ${badge.earned ? "rgba(52,211,153,0.3)" : "var(--border-color)"}`,
                                letterSpacing: "0.04em",
                              }}>
                                {badge.earned ? "✓ Earned" : "Locked"}
                              </div>
                            </button>

                            {/* Expandable how-to panel */}
                            {isOpen && (
                              <div style={{
                                margin: "0 1rem 0.75rem",
                                padding: "0.75rem 1rem",
                                borderRadius: "10px",
                                backgroundColor: badge.earned
                                  ? "rgba(52,211,153,0.08)"
                                  : "rgba(59,158,255,0.08)",
                                border: `1px solid ${badge.earned ? "rgba(52,211,153,0.25)" : "rgba(59,158,255,0.25)"}`,
                              }}>
                                {badge.earned ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "1.1rem" }}>🎉</span>
                                    <div>
                                      <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-green)", marginBottom: "0.1rem" }}>
                                        Achievement Unlocked!
                                      </div>
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                        You&apos;ve earned this badge. Keep it up!
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "1rem", marginTop: "0.05rem" }}>💡</span>
                                    <div>
                                      <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--accent-blue)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        How to earn
                                      </div>
                                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                        {howTo}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
                </>
              );
            })()}
          </div>
        )}

        {tab === "info" && (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-green)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Your Information
              </div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  style={{
                    background: "rgba(59,158,255,0.12)",
                    border: "1px solid rgba(59,158,255,0.3)",
                    color: "var(--accent-blue)",
                    borderRadius: "8px",
                    padding: "0.3rem 0.85rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {saveMsg && (
                    <span style={{ fontSize: "0.75rem", color: saveMsg === "Saved!" ? "var(--accent-green)" : "var(--accent-red)", fontWeight: "600" }}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={() => { setEditing(false); setSaveMsg(""); }}
                    disabled={saving}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-muted)",
                      borderRadius: "8px",
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      background: "var(--accent-green)",
                      border: "none",
                      color: "#000",
                      borderRadius: "8px",
                      padding: "0.3rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Read-only fields */}
            {[
              { label: "Email", value: user.email },
              { label: "Case Number", value: user.caseNumber },
            ].map((field) => (
              <div key={field.label} style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "0.65rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 0.7,
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                  {field.value || "—"}
                </div>
              </div>
            ))}

            {/* Editable fields */}
            {[
              { label: "Full Name",         key: "fullName",              placeholder: "Your full name" },
              { label: "Date of Birth",     key: "dateOfBirth",           placeholder: "MM/DD/YYYY" },
              { label: "Phone",             key: "phone",                 placeholder: "Your phone number" },
              { label: "City",              key: "city",                  placeholder: "Your city" },
              { label: "State",             key: "state",                 placeholder: "Your state" },
              { label: "Zip Code",          key: "zipCode",               placeholder: "Your zip code" },
              { label: "Emergency Contact", key: "emergencyContactName",  placeholder: "Contact name" },
              { label: "Emergency Phone",   key: "emergencyContactPhone", placeholder: "Contact phone number" },
            ].map((field) => {
              const key = field.key as keyof typeof editForm;
              const currentValue = user[field.key as keyof UserProfile] as string | null;
              return (
                <div key={field.key} style={{
                  backgroundColor: editing ? "rgba(59,158,255,0.04)" : "var(--bg-card)",
                  border: `1px solid ${editing ? "rgba(59,158,255,0.2)" : "var(--border-color)"}`,
                  borderRadius: "10px",
                  padding: "0.65rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                    {field.label}
                  </div>
                  {editing ? (
                    <input
                      value={editForm[key]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        textAlign: "right",
                        flex: 1,
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: "0.9rem", fontWeight: "600", color: currentValue ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {currentValue || "—"}
                    </div>
                  )}
                </div>
              );
            })}

            {!editing && saveMsg === "Saved!" && (
              <div style={{ textAlign: "center", color: "var(--accent-green)", fontSize: "0.8rem", fontWeight: "600", marginTop: "0.25rem" }}>
                ✓ Changes saved
              </div>
            )}
          </div>
        )}
      </div>

      <HelpButton />
    </div>
  );
}
