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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function NavIcon({ name }: { name: string }) {
  const iconProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: styles.navIcon,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "users":
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "payouts":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
          <path d="M9 10h1.5M12 17c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3" />
        </svg>
      );
    case "audit":
      return (
        <svg {...iconProps}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "staff":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <line x1="12" y1="14" x2="12" y2="20" />
        </svg>
      );
    case "cases":
      return (
        <svg {...iconProps}>
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      );
    case "directory":
      return (
        <svg {...iconProps}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "finance":
      return (
        <svg {...iconProps}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newCaseCount, setNewCaseCount] = useState(0);
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

  useEffect(() => {
    if (!admin || isLoginPage) return;
    const fetchNewCases = () => {
      fetch("/api/admin/cases?status=new&limit=1", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setNewCaseCount(data.pagination?.total ?? 0);
        })
        .catch(() => {});
    };
    fetchNewCases();
    const interval = setInterval(fetchNewCases, 60000);
    return () => clearInterval(interval);
  }, [admin, isLoginPage]);

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
    { href: "/admin", label: "Dashboard", icon: "dashboard", badge: 0 },
    { href: "/admin/users", label: "Users", icon: "users", badge: 0 },
    { href: "/admin/payouts", label: "Payouts", icon: "payouts", badge: 0 },
    { href: "/admin/cases", label: "Cases", icon: "cases", badge: newCaseCount },
    { href: "/admin/directory", label: "Directory", icon: "directory", badge: 0 },
    ...(["admin", "finance"].includes(admin.role)
      ? [{ href: "/admin/finance", label: "Finance", icon: "finance", badge: 0 }]
      : []),
    ...(admin.role === "admin"
      ? [
          { href: "/admin/audit", label: "Audit Log", icon: "audit", badge: 0 },
          { href: "/admin/staff", label: "Staff", icon: "staff", badge: 0 },
        ]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
              <div className={styles.brandWordmark}>
                Learn<span>2</span>Earn
              </div>
              <div className={styles.brandSubtitle}>Admin Portal</div>
            </div>

            <nav className={styles.sidebarNav}>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{ justifyContent: "space-between" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <NavIcon name={item.icon} />
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      borderRadius: "999px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </a>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.adminAvatar}>
                {getInitials(admin.fullName || admin.email)}
              </div>
              <div className={styles.adminName}>{admin.fullName}</div>
              <div className={styles.adminRole}>{admin.role}</div>
              <button onClick={logout} className={styles.logoutBtn}>
                Sign out
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
