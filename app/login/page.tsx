"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Something went wrong");
        setLoading(false);
        return;
      }

      localStorage.setItem("l2e_user_id", data.user.id);
      localStorage.setItem("l2e_logged_in", "true");
      router.push("/profile");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.85rem 1rem",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    fontFamily: "var(--font-display)",
    outline: "none",
  };

  const labelStyle = {
    fontFamily: "var(--font-mono)" as const,
    fontSize: "0.65rem",
    color: "var(--accent-green)",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: "0.35rem",
    display: "block",
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "420px", width: "100%" }}>
        <Link href="/app" style={{
          fontFamily: "var(--font-mono)",
          color: "var(--accent-green)",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          display: "inline-block",
          marginBottom: "1.5rem",
        }}>
          {'<'} back_to_home
        </Link>

        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--accent-green)",
          letterSpacing: "0.2em",
          marginBottom: "0.5rem",
        }}>
          {'>'} authenticate
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
        }}>
          Welcome Back
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: "1.5" }}>
          Log in to continue your learning journey and check your earnings.
        </p>

        {error && (
          <div style={{
            backgroundColor: "rgba(255,51,85,0.08)",
            border: "1px solid var(--accent-red)",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--accent-red)",
            fontSize: "0.85rem",
            fontFamily: "var(--font-display)",
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem",
            marginTop: "1.5rem",
            backgroundColor: "transparent",
            color: loading ? "var(--text-muted)" : "var(--accent-green)",
            border: `1px solid ${loading ? "var(--border-color)" : "var(--accent-green)"}`,
            fontWeight: "700",
            fontSize: "0.95rem",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.05em",
            boxShadow: loading ? "none" : "var(--glow-green)",
          }}
        >
          {loading ? "AUTHENTICATING..." : "LOG IN"}
        </button>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Need an account? </span>
          <Link href="/signup" style={{
            color: "var(--accent-blue)",
            fontSize: "0.85rem",
            fontWeight: "600",
          }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
