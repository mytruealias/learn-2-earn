"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../austin.css";

function UnlockForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/austin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/austin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid PIN");
        setLoading(false);
        return;
      }

      router.push(next.startsWith("/austin") ? next : "/austin");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="atx-unlock-card">
      <div className="atx-unlock-header">
        <div className="atx-hero-badge">
          City of Austin &middot; Invitation-Only Partnership Deck
        </div>
        <h1 className="atx-unlock-title">
          Enter Access PIN
        </h1>
        <p className="atx-unlock-sub">
          This pitch deck is shared with invited Austin partners. Please enter your PIN to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="atx-unlock-form">
        <label className="atx-unlock-label" htmlFor="atx-pin">
          Access PIN
        </label>
        <input
          id="atx-pin"
          type="password"
          inputMode="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter your PIN"
          autoFocus
          autoComplete="off"
          className="atx-unlock-input"
        />
        {error && <p className="atx-unlock-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !pin.trim()}
          className="atx-btn-primary atx-unlock-submit"
        >
          {loading ? "Verifying..." : "Unlock Deck"}
        </button>
      </form>

      <div className="atx-unlock-footer">
        <p className="atx-unlock-help">
          Need a PIN?{" "}
          <a href="mailto:partners@learn2earn.org">Contact us</a>
        </p>
        <Link href="/" className="atx-unlock-back">
          &larr; Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function AustinUnlockPage() {
  return (
    <div className="atx-page atx-unlock-page">
      <div className="atx-unlock-bg">
        <Suspense
          fallback={
            <div className="atx-unlock-card">
              <p className="atx-unlock-sub">Loading...</p>
            </div>
          }
        >
          <UnlockForm />
        </Suspense>
      </div>
    </div>
  );
}
