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
  { value: "venmo", label: "Venmo" },
  { value: "paypal", label: "PayPal" },
  { value: "cashapp", label: "Cash App" },
  { value: "check", label: "Check" },
];

const PAYMENT_PLACEHOLDERS: Record<string, string> = {
  venmo: "@your-venmo-handle",
  paypal: "your@email.com or PayPal handle",
  cashapp: "$your-cashtag",
  check: "Full name and mailing address",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentHandle, setPaymentHandle] = useState("");
  const [tab, setTab] = useState<"overview" | "earnings" | "info">("overview");

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
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!user || user.availableXp < 3) return;
    if (!paymentMethod || !paymentHandle.trim()) return;

    setPayoutLoading(true);
    setPayoutMsg("");

    try {
      const res = await fetch("/api/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, xpAmount: user.availableXp, paymentMethod, paymentHandle }),
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
          {(["overview", "earnings", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "0.7rem",
                backgroundColor: tab === t ? "var(--bg-card-hover)" : "var(--bg-card)",
                color: tab === t ? "var(--accent-green)" : "var(--text-muted)",
                borderRight: t !== "info" ? "1px solid var(--border-color)" : "none",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              {t === "overview" && <LightbulbIcon size={14} color={tab === t ? "var(--accent-green)" : "var(--text-muted)"} />}
              {t === "earnings" && <CashIcon size={14} color={tab === t ? "var(--accent-green)" : "var(--text-muted)"} />}
              {t === "info" && <ClipboardIcon size={14} color={tab === t ? "var(--accent-green)" : "var(--text-muted)"} />}
              {t === "overview" ? "Overview" : t === "earnings" ? "Earnings" : "Info"}
            </button>
          ))}
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
                XP to Cash — $1 = 3 XP
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
              ) : user.availableXp < 3 ? (
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
                  You need {3 - user.availableXp} more XP to request a payout
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
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
                    {payoutLoading ? "Processing..." : "Request Payout"}
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

            {user.badges && user.badges.length > 0 && (() => {
              const BADGE_GROUPS = [
                { label: "Lessons", ids: ["first_lesson","lessons_5","lessons_10","lessons_25","lessons_50"] },
                { label: "Streaks", ids: ["streak_3","streak_7","streak_14","streak_30"] },
                { label: "Earnings", ids: ["xp_50","xp_100","xp_500","first_payout"] },
                { label: "Paths", ids: ["first_path","paths_2","paths_3"] },
                { label: "Perfect Play", ids: ["perfect_lesson","perfect_3","perfect_5"] },
              ];
              const byId = Object.fromEntries(user.badges.map((b) => [b.id, b]));
              const earnedTotal = user.badges.filter((b) => b.earned).length;
              return (
                <div style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "14px",
                  padding: "1rem 1.25rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--accent-purple)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                      Achievements
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      fontWeight: "600",
                    }}>
                      {earnedTotal} / {user.badges.length} earned
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {BADGE_GROUPS.map((group) => {
                      const groupBadges = group.ids.map((id) => byId[id]).filter(Boolean);
                      return (
                        <div key={group.label}>
                          <div style={{
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            color: "var(--text-muted)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}>
                            {group.label}
                          </div>
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                            gap: "0.5rem",
                          }}>
                            {groupBadges.map((badge) => (
                              <div
                                key={badge.id}
                                title={badge.description}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.65rem 0.4rem",
                                  borderRadius: "10px",
                                  backgroundColor: badge.earned ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
                                  border: `1px solid ${badge.earned ? "rgba(167,139,250,0.4)" : "var(--border-color)"}`,
                                  opacity: badge.earned ? 1 : 0.4,
                                  transition: "all 0.2s",
                                }}
                              >
                                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{badge.icon}</span>
                                <span style={{
                                  fontSize: "0.6rem",
                                  fontWeight: "700",
                                  color: badge.earned ? "var(--text-primary)" : "var(--text-muted)",
                                  textAlign: "center",
                                  lineHeight: "1.2",
                                }}>
                                  {badge.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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

        {tab === "info" && (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-green)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Your Information
            </div>
            {[
              { label: "Full Name", value: user.fullName },
              { label: "Email", value: user.email },
              { label: "Date of Birth", value: user.dateOfBirth },
              { label: "Phone", value: user.phone },
              { label: "City", value: user.city },
              { label: "State", value: user.state },
              { label: "Zip Code", value: user.zipCode },
              { label: "Case Number", value: user.caseNumber },
              { label: "Emergency Contact", value: user.emergencyContactName },
              { label: "Emergency Phone", value: user.emergencyContactPhone },
            ].map((field) => (
              <div key={field.label} style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "0.65rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {field.label}
                </div>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: field.value ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                  {field.value || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <HelpButton />
    </div>
  );
}
