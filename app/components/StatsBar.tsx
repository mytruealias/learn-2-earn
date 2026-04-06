"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FireIcon, StarIcon, HeartIcon } from "./icons";

export default function StatsBar() {
  const router = useRouter();
  const [stats, setStats] = useState({ streak: 0, xp: 0, hearts: 5, streakFreezes: 1 });
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("l2e_user_id");
    const isLoggedIn = localStorage.getItem("l2e_logged_in") === "true";
    setLoggedIn(isLoggedIn);
    if (!userId) return;

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          setStats({
            streak: data.user.streak ?? 0,
            xp: data.user.totalXp ?? 0,
            hearts: data.user.hearts ?? 5,
            streakFreezes: data.user.streakFreezes ?? 1,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleXpClick = () => {
    if (loggedIn) {
      router.push("/profile");
    } else {
      router.push("/signup");
    }
  };

  const freezeAvailable = stats.streakFreezes > 0;

  const items = [
    { icon: <FireIcon size={18} color="var(--accent-gold)" />, label: "Streak", value: `${stats.streak}d`, color: "var(--accent-gold)", bg: "rgba(245,183,49,0.12)", clickable: false },
    { icon: <StarIcon size={18} color="var(--accent-green)" />, label: "XP", value: `${stats.xp}`, color: "var(--accent-green)", bg: "rgba(88,204,2,0.12)", clickable: true },
    { icon: <HeartIcon size={18} color="var(--accent-red)" />, label: "Hearts", value: `${stats.hearts}`, color: "var(--accent-red)", bg: "rgba(245,80,80,0.12)", clickable: false },
  ];

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.9rem 1rem",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {items.map((stat) => (
        <div
          key={stat.label}
          onClick={stat.clickable ? handleXpClick : undefined}
          style={{
            backgroundColor: stat.bg,
            border: `1.5px solid ${stat.color}40`,
            borderRadius: "999px",
            padding: "0.4rem 0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: stat.clickable ? "pointer" : "default",
            transition: "all 0.25s",
            flexShrink: 1,
            minWidth: 0,
          }}>
          {stat.icon}
          <span style={{
            fontWeight: "700",
            fontSize: "0.95rem",
            color: stat.color,
            whiteSpace: "nowrap",
          }}>{stat.value}</span>
          <span style={{
            color: "var(--text-muted)",
            fontSize: "0.6rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}>{stat.label}</span>
        </div>
      ))}

      <div
        title={freezeAvailable ? "Streak freeze available — one missed day won't break your streak" : "Streak freeze used — earn back after 7 active days"}
        style={{
          backgroundColor: freezeAvailable ? "rgba(59,158,255,0.12)" : "rgba(136,146,176,0.08)",
          border: `1.5px solid ${freezeAvailable ? "rgba(59,158,255,0.4)" : "rgba(136,146,176,0.2)"}`,
          borderRadius: "999px",
          padding: "0.4rem 0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          cursor: "default",
          transition: "all 0.25s",
          opacity: freezeAvailable ? 1 : 0.55,
          flexShrink: 1,
        }}>
        <span style={{ fontSize: "0.95rem", filter: freezeAvailable ? "none" : "grayscale(1)" }}>❄️</span>
        <span style={{
          color: "var(--text-muted)",
          fontSize: "0.6rem",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>Freeze</span>
      </div>
    </div>
  );
}
