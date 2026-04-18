"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../invest/invest.css";

function AccessForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/app";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Invalid access code");
        setLoading(false);
        return;
      }

      router.push(next);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div className="inv-nav-logo" style={{ fontSize: "1.6rem", marginBottom: "1.5rem" }}>
          Learn <span>2</span> Earn
        </div>
        <h1 style={{
          fontFamily: "var(--cy-display)",
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--cy-text-bright)",
          marginBottom: "0.75rem",
        }}>
          Demo Access
        </h1>
        <p style={{
          fontSize: "0.95rem",
          color: "var(--cy-text-dim)",
          lineHeight: 1.6,
        }}>
          Enter your access code to explore the learning platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{
          background: "var(--cy-bg-card)",
          border: "1px solid var(--cy-border)",
          borderRadius: "14px",
          padding: "2rem",
          backdropFilter: "blur(12px)",
        }}>
          <label style={{
            display: "block",
            fontFamily: "var(--cy-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--cy-blue-bright)",
            marginBottom: "0.75rem",
          }}>
            Access Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code"
            autoFocus
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              fontSize: "1rem",
              fontFamily: "var(--cy-mono)",
              letterSpacing: "0.1em",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--cy-border-hover)",
              borderRadius: "10px",
              color: "var(--cy-text-bright)",
              outline: "none",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          />
          {error && (
            <p style={{
              color: "var(--cy-red)",
              fontSize: "0.82rem",
              marginTop: "0.75rem",
              textAlign: "center",
            }}>
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inv-btn inv-btn-primary inv-btn-lg"
          style={{
            width: "100%",
            opacity: loading || !code.trim() ? 0.5 : 1,
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Access Platform"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--cy-text-dim)", marginBottom: "1rem" }}>
          Need an access code?
        </p>
        <a
          href="mailto:partners@learn2earn.org"
          style={{
            fontSize: "0.82rem",
            color: "var(--cy-blue-bright)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(96,165,250,0.3)",
            paddingBottom: "1px",
          }}
        >
          Contact us to request a demo
        </a>
      </div>

      <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
        <Link
          href="/"
          style={{
            fontSize: "0.78rem",
            color: "var(--cy-text-dim)",
            textDecoration: "none",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          &larr; Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function AccessPage() {
  return (
    <div className="inv-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="inv-hero-glow inv-hero-glow-1"></div>
      <div className="inv-hero-glow inv-hero-glow-2"></div>
      <Suspense fallback={
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "var(--cy-text-dim)" }}>
          Loading...
        </div>
      }>
        <AccessForm />
      </Suspense>
    </div>
  );
}
