"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
        <div style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Learn <span style={{ color: "var(--accent-blue)" }}>2</span> Earn
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.75rem",
        }}>
          Demo Access
        </h1>
        <p style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}>
          Enter your access code to explore the learning platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "var(--shadow-sm)",
        }}>
          <label htmlFor="access-code" style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-blue)",
            marginBottom: "0.75rem",
          }}>
            Access Code
          </label>
          <input
            id="access-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code"
            autoFocus
            autoComplete="off"
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "access-error" : undefined}
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              fontSize: "1rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)",
              color: "var(--text-primary)",
              outline: "none",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          />
          <div role="alert" aria-live="assertive">
            {error && (
              <p id="access-error" style={{
                color: "var(--accent-red)",
                fontSize: "0.82rem",
                marginTop: "0.75rem",
                textAlign: "center",
              }}>
                {error}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            width: "100%",
            padding: "0.95rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            fontFamily: "var(--font-display)",
            background: loading || !code.trim() ? "var(--bg-card)" : "var(--accent-blue)",
            color: loading || !code.trim() ? "var(--text-muted)" : "#fff",
            border: `1px solid ${loading || !code.trim() ? "var(--border-color)" : "var(--accent-blue)"}`,
            borderRadius: "var(--radius)",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            boxShadow: loading || !code.trim() ? "none" : "var(--shadow-md)",
          }}
        >
          {loading ? "Verifying..." : "Access Platform"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Need an access code?
        </p>
        <a
          href="mailto:partners@learn2earn.org"
          style={{
            fontSize: "0.82rem",
            color: "var(--accent-blue)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(25,118,210,0.3)",
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
            color: "var(--text-muted)",
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
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-primary)" }}>
      <Suspense fallback={
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "var(--text-muted)" }}>
          Loading...
        </div>
      }>
        <AccessForm />
      </Suspense>
    </div>
  );
}
