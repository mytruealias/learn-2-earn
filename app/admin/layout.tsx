"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

const AdminContext = createContext<{ admin: AdminUser | null; logout: () => void }>({
  admin: null,
  logout: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const token = localStorage.getItem("l2e_admin_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    fetch("/api/admin/session", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setAdmin(data.admin);
        } else if (!isLoginPage) {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        if (!isLoginPage) router.push("/admin/login");
      })
      .finally(() => setLoading(false));
  }, [isLoginPage, router]);

  const logout = async () => {
    localStorage.removeItem("l2e_admin_token");
    await fetch("/api/admin/session", { method: "DELETE" });
    setAdmin(null);
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0f1419",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8899a6",
        fontFamily: "'Share Tech Mono', monospace",
      }}>
        Loading...
      </div>
    );
  }

  if (isLoginPage) {
    return <AdminContext.Provider value={{ admin, logout }}>{children}</AdminContext.Provider>;
  }

  if (!admin) return null;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "◉" },
    { href: "/admin/users", label: "Users", icon: "◎" },
    { href: "/admin/payouts", label: "Payouts", icon: "$" },
    ...(admin.role === "admin" ? [{ href: "/admin/audit", label: "Audit Log", icon: "⊡" }] : []),
  ];

  return (
    <AdminContext.Provider value={{ admin, logout }}>
      <div style={{ minHeight: "100vh", backgroundColor: "#0f1419", display: "flex" }}>
        <aside style={{
          width: "240px",
          backgroundColor: "#15202b",
          borderRight: "1px solid #253341",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
        }}>
          <div style={{
            padding: "0 1.25rem 1.5rem",
            borderBottom: "1px solid #253341",
            marginBottom: "1rem",
          }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem",
              color: "#00ff88",
              letterSpacing: "0.15em",
              marginBottom: "0.25rem",
            }}>LEARN_2_EARN</div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#e1e8ed",
            }}>Admin Panel</div>
          </div>

          <nav style={{ flex: 1, padding: "0 0.75rem" }}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0.75rem",
                  color: pathname === item.href ? "#00ff88" : "#8899a6",
                  backgroundColor: pathname === item.href ? "rgba(0,255,136,0.08)" : "transparent",
                  borderLeft: pathname === item.href ? "2px solid #00ff88" : "2px solid transparent",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                  textDecoration: "none",
                  marginBottom: "0.25rem",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid #253341",
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#e1e8ed",
              marginBottom: "0.25rem",
              fontWeight: "600",
            }}>{admin.fullName}</div>
            <div style={{
              fontSize: "0.65rem",
              color: "#8899a6",
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: "0.05em",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
            }}>{admin.role}</div>
            <button
              onClick={logout}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.7rem",
                color: "#ff6b6b",
                background: "none",
                border: "1px solid rgba(255,107,107,0.3)",
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              LOGOUT
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, marginLeft: "240px", padding: "2rem" }}>
          {children}
        </main>
      </div>
    </AdminContext.Provider>
  );
}
