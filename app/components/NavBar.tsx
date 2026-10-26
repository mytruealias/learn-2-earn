"use client";

import { useState, useEffect } from "react";
import styles from "./NavBar.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, LifelineIcon, UserIcon, SparkleIcon } from "./icons";

export default function NavBar() {
  const pathname = usePathname();
  const modern = pathname.startsWith("/paths/");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!modern) { setLoggedIn(localStorage.getItem("l2e_logged_in") === "true"); return; }
    let active = true;
    fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(response => response.json()).then(data => { if (active) setLoggedIn(!!data.ok && !!data.user); })
      .catch(() => {});
    return () => { active = false; };
  }, [modern]);

  const cityDeckSlugs = ["/austin", "/dallas", "/houston", "/denver", "/los-angeles", "/san-francisco"];
  const isCityDeck = cityDeckSlugs.some((s) => pathname === s || pathname.startsWith(s + "/"));
  if (pathname === "/" || pathname.startsWith("/lesson/") || pathname.startsWith("/invest") || pathname.startsWith("/admin") || pathname.startsWith("/access") || pathname.startsWith("/dev/") || isCityDeck) return null;

  const links = [
    { href: "/app", label: "Home", icon: (color: string) => <HomeIcon size={22} color={color} /> },
    { href: "/lifeline", label: "Lifeline", icon: (color: string) => <LifelineIcon size={22} color={color} /> },
    ...(loggedIn
      ? [{ href: "/profile", label: "Profile", icon: (color: string) => <UserIcon size={22} color={color} /> }]
      : [{ href: "/signup", label: "Join", icon: (color: string) => <SparkleIcon size={22} color={color} /> }]),
  ];

  return (
    <nav aria-label="Primary" data-design={modern ? "learner-navigation" : undefined} data-ui-shell="learner" className={modern ? styles.modern : undefined} style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "var(--bg-secondary)",
      borderTop: "1px solid var(--border-color)",
      zIndex: 900,
      display: "flex",
      justifyContent: "center",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        display: "flex",
        maxWidth: "500px",
        width: "100%",
      }}>
        {links.map((link) => {
          const active = pathname === link.href || (modern && link.href === "/app");
          const color = active ? (modern ? "var(--l2e-primary)" : "var(--accent-green)") : "var(--text-muted)";
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? (modern ? "location" : "page") : undefined}
              aria-label={link.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.65rem 0.5rem",
                color,
                borderTop: active ? `3px solid ${color}` : "3px solid transparent",
                transition: "all 0.2s",
                background: active ? "rgba(59,158,255,0.08)" : "transparent",
              }}
            >
              {link.icon(color)}
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.7rem",
                fontWeight: "700",
                letterSpacing: "0.03em",
              }}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
