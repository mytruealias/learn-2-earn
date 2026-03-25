"use client";

import { useState, useEffect } from "react";

interface UserSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  caseNumber: string | null;
  totalXp: number;
  streak: number;
  createdAt: string;
  lastActiveAt: string;
  consentGiven: boolean;
  _count: { progress: number; payoutRequests: number };
}

interface UserDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  caseNumber: string | null;
  totalXp: number;
  hearts: number;
  streak: number;
  createdAt: string;
  lastActiveAt: string;
  consentGiven: boolean;
  progress: Array<{
    id: string;
    xpEarned: number;
    completedAt: string;
    lesson: { title: string; module: { title: string; path: { title: string } } };
  }>;
  payoutRequests: Array<{
    id: string;
    xpAmount: number;
    dollarAmount: number;
    status: string;
    createdAt: string;
  }>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUsers(data.users);
          setTotalPages(data.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const viewUser = (userId: string) => {
    setDetailLoading(true);
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`/api/admin/users/${userId}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSelectedUser(data.user);
      })
      .finally(() => setDetailLoading(false));
  };

  if (selectedUser) {
    const totalPayoutXp = selectedUser.payoutRequests
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.xpAmount, 0);
    const availableXp = selectedUser.totalXp - totalPayoutXp;

    return (
      <div>
        <button
          onClick={() => setSelectedUser(null)}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.75rem",
            color: "#00ff88",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.1em",
            marginBottom: "1.5rem",
          }}
        >
          {'<'} back_to_users
        </button>

        <div style={{
          backgroundColor: "#15202b",
          border: "1px solid #253341",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#e1e8ed",
                marginBottom: "0.25rem",
              }}>{selectedUser.fullName || "Guest User"}</h1>
              <div style={{ fontSize: "0.85rem", color: "#8899a6" }}>
                {selectedUser.email || "No email"} {selectedUser.caseNumber && `• Case: ${selectedUser.caseNumber}`}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8899a6", marginTop: "0.25rem" }}>
                {selectedUser.city && `${selectedUser.city}, `}{selectedUser.state} {selectedUser.zipCode}
              </div>
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.6rem",
              color: selectedUser.consentGiven ? "#00ff88" : "#ff6b6b",
              border: `1px solid ${selectedUser.consentGiven ? "rgba(0,255,136,0.3)" : "rgba(255,107,107,0.3)"}`,
              padding: "0.3rem 0.6rem",
              letterSpacing: "0.1em",
            }}>
              {selectedUser.consentGiven ? "CONSENT_GIVEN" : "NO_CONSENT"}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #253341",
          }}>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6", letterSpacing: "0.1em" }}>TOTAL_XP</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffd700" }}>{selectedUser.totalXp}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6", letterSpacing: "0.1em" }}>AVAILABLE_XP</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#00ff88" }}>{availableXp}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6", letterSpacing: "0.1em" }}>LESSONS</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#00d4ff" }}>{selectedUser.progress.length}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6", letterSpacing: "0.1em" }}>STREAK</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#a855f7" }}>{selectedUser.streak}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6", letterSpacing: "0.1em" }}>JOINED</div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#e1e8ed" }}>{formatDate(selectedUser.createdAt)}</div>
            </div>
          </div>
        </div>

        {selectedUser.progress.length > 0 && (
          <div style={{
            backgroundColor: "#15202b",
            border: "1px solid #253341",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}>
            <h2 style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.75rem",
              color: "#8899a6",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>LESSON_HISTORY</h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {selectedUser.progress.slice(0, 20).map((p) => (
                <div key={p.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#0f1419",
                  border: "1px solid #253341",
                  fontSize: "0.8rem",
                }}>
                  <div>
                    <span style={{ color: "#e1e8ed" }}>{p.lesson.title}</span>
                    <span style={{ color: "#8899a6", marginLeft: "0.5rem", fontSize: "0.7rem" }}>
                      {p.lesson.module.path.title} › {p.lesson.module.title}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.7rem", color: "#ffd700" }}>
                      +{p.xpEarned}xp
                    </span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#8899a6" }}>
                      {formatDateTime(p.completedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUser.payoutRequests.length > 0 && (
          <div style={{
            backgroundColor: "#15202b",
            border: "1px solid #253341",
            padding: "1.5rem",
          }}>
            <h2 style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.75rem",
              color: "#8899a6",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>PAYOUT_HISTORY</h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {selectedUser.payoutRequests.map((p) => {
                const statusColor = { pending: "#ffd700", reviewed: "#00d4ff", approved: "#00ff88", completed: "#00ff88", rejected: "#ff6b6b" }[p.status] || "#8899a6";
                return (
                  <div key={p.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#0f1419",
                    border: "1px solid #253341",
                    fontSize: "0.8rem",
                  }}>
                    <div>
                      <span style={{ color: "#e1e8ed" }}>{p.xpAmount} XP → ${p.dollarAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "0.65rem",
                        color: statusColor,
                        border: `1px solid ${statusColor}`,
                        padding: "0.15rem 0.5rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}>{p.status}</span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#8899a6" }}>
                        {formatDate(p.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
        }}>USER_MANAGEMENT</div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#e1e8ed",
        }}>Users</h1>
      </div>

      <form onSubmit={handleSearch} style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or case number..."
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: "#15202b",
            border: "1px solid #253341",
            color: "#e1e8ed",
            fontSize: "0.85rem",
            fontFamily: "'Share Tech Mono', monospace",
            outline: "none",
          }}
        />
        <button type="submit" style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#00ff88",
          color: "#0f1419",
          border: "none",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.8rem",
          fontWeight: "700",
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}>SEARCH</button>
      </form>

      {loading ? (
        <div style={{ color: "#8899a6", fontFamily: "'Share Tech Mono', monospace" }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => viewUser(user.id)}
                style={{
                  backgroundColor: "#15202b",
                  border: "1px solid #253341",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ color: "#e1e8ed", fontWeight: "600", fontSize: "0.9rem" }}>
                    {user.fullName || "Guest User"}
                  </div>
                  <div style={{ color: "#8899a6", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                    {user.email || "No email"} {user.caseNumber && `• Case: ${user.caseNumber}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.7rem", color: "#ffd700" }}>
                      {user.totalXp} XP
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#8899a6" }}>
                      {user._count.progress} lessons
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#8899a6" }}>
                    {formatDate(user.lastActiveAt)}
                  </div>
                  <span style={{ color: "#8899a6" }}>{'>'}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: page <= 1 ? "#253341" : "#15202b",
                  border: "1px solid #253341",
                  color: page <= 1 ? "#8899a6" : "#e1e8ed",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.75rem",
                  cursor: page <= 1 ? "default" : "pointer",
                }}
              >PREV</button>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.75rem",
                color: "#8899a6",
                alignSelf: "center",
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: page >= totalPages ? "#253341" : "#15202b",
                  border: "1px solid #253341",
                  color: page >= totalPages ? "#8899a6" : "#e1e8ed",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.75rem",
                  cursor: page >= totalPages ? "default" : "pointer",
                }}
              >NEXT</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
