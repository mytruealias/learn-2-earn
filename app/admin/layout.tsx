"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminToastProvider } from "./AdminToastContext";
import styles from "./layout.module.css";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
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
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    setAdmin(null);
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        Loading...
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <AdminContext.Provider value={{ admin, logout }}>
        <AdminToastProvider>{children}</AdminToastProvider>
      </AdminContext.Provider>
    );
  }

  if (!admin) return null;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "◉" },
    { href: "/admin/users", label: "Users", icon: "◎" },
    { href: "/admin/payouts", label: "Payouts", icon: "$" },
    ...(admin.role === "admin"
      ? [
          { href: "/admin/audit", label: "Audit Log", icon: "⊡" },
          { href: "/admin/staff", label: "Staff", icon: "⊕" },
        ]
      : []),
  ];

  return (
    <AdminContext.Provider value={{ admin, logout }}>
      <AdminToastProvider>
        <div className={styles.adminShell}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>

          {sidebarOpen && (
            <div
              className={styles.sidebarOverlay}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarBrand}>
              <div className={styles.brandTag}>LEARN_2_EARN</div>
              <div className={styles.brandTitle}>Admin Panel</div>
            </div>

            <nav className={styles.sidebarNav}>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.adminName}>{admin.fullName}</div>
              <div className={styles.adminRole}>{admin.role}</div>
              <button onClick={logout} className={styles.logoutBtn}>
                LOGOUT
              </button>
            </div>
          </aside>

          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </AdminToastProvider>
    </AdminContext.Provider>
  );
}
