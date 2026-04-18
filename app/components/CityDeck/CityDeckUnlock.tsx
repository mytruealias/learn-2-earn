"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "./city-deck.css";
import type { CitySlug, CityDeckTheme } from "./types";

interface Props {
  slug: CitySlug;
  basePath: string;
  badge: string;
  sub: string;
  theme: CityDeckTheme;
}

function UnlockForm({ slug, basePath, badge, sub }: Omit<Props, "theme">) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || basePath;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/city-access/${slug}`, {
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

      router.push(next.startsWith(basePath) ? next : basePath);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputId = `cd-pin-${slug}`;

  return (
    <div className="cd-unlock-card">
      <div className="cd-unlock-header">
        <div className="cd-hero-badge">{badge}</div>
        <h1 className="cd-unlock-title">Enter Access PIN</h1>
        <p className="cd-unlock-sub">{sub}</p>
      </div>

      <form onSubmit={handleSubmit} className="cd-unlock-form">
        <label className="cd-unlock-label" htmlFor={inputId}>
          Access PIN
        </label>
        <input
          id={inputId}
          type="password"
          inputMode="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter your PIN"
          autoFocus
          autoComplete="off"
          className="cd-unlock-input"
        />
        {error && <p className="cd-unlock-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !pin.trim()}
          className="cd-btn-primary cd-unlock-submit"
        >
          {loading ? "Verifying..." : "Unlock Deck"}
        </button>
      </form>

      <div className="cd-unlock-footer">
        <p className="cd-unlock-help">
          Need a PIN? <a href="mailto:partners@learn2earn.org">Contact us</a>
        </p>
        <Link href="/" className="cd-unlock-back">
          &larr; Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function CityDeckUnlock({ slug, basePath, badge, sub, theme }: Props) {
  return (
    <div className="cd-page cd-unlock-page" style={theme.themeStyle}>
      <div className="cd-unlock-bg">
        <Suspense
          fallback={
            <div className="cd-unlock-card">
              <p className="cd-unlock-sub">Loading...</p>
            </div>
          }
        >
          <UnlockForm slug={slug} basePath={basePath} badge={badge} sub={sub} />
        </Suspense>
      </div>
    </div>
  );
}
