"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.ok) {
        if (data.token) {
          localStorage.setItem("l2e_admin_token", data.token);
        }
        window.location.href = "/admin";
        return;
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f1419",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#15202b",
        border: "1px solid #253341",
        padding: "2.5rem",
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#00ff88",
          letterSpacing: "0.2em",
          marginBottom: "0.5rem",
        }}>LEARN_2_EARN</div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#e1e8ed",
          marginBottom: "2rem",
        }}>Admin Login</h1>

        {error && (
          <div style={{
            padding: "0.75rem",
            backgroundColor: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.3)",
            color: "#ff6b6b",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            fontFamily: "'Share Tech Mono', monospace",
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem",
              color: "#8899a6",
              letterSpacing: "0.1em",
              marginBottom: "0.5rem",
            }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#0f1419",
                border: "1px solid #253341",
                color: "#e1e8ed",
                fontSize: "0.9rem",
                fontFamily: "'Share Tech Mono', monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem",
              color: "#8899a6",
              letterSpacing: "0.1em",
              marginBottom: "0.5rem",
            }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#0f1419",
                border: "1px solid #253341",
                color: "#e1e8ed",
                fontSize: "0.9rem",
                fontFamily: "'Share Tech Mono', monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              backgroundColor: loading ? "#253341" : "#00ff88",
              color: loading ? "#8899a6" : "#0f1419",
              border: "none",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.85rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
