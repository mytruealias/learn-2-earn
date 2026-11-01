"use client";
import Link from "next/link";
import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MarketingShell from "../marketing/MarketingShell";
import { Alert, Button } from "../ui";
import styles from "../marketing/marketing.module.css";
import type { CitySlug, CityDeckTheme } from "./types";
type Props = {
  slug: CitySlug;
  basePath: string;
  badge: string;
  sub: string;
  theme: CityDeckTheme;
};
function Form({ slug, basePath, badge, sub }: Omit<Props, "theme">) {
  const [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    lock = useRef(false),
    params = useSearchParams(),
    router = useRouter();
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/city-access/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pin.trim() }),
          signal: AbortSignal.timeout(15000),
        }),
        d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Access could not be confirmed.");
      let next = basePath;
      try {
        const u = new URL(params.get("next") || basePath, location.origin);
        if (u.origin === location.origin && u.pathname === basePath)
          next = u.pathname + u.search + u.hash;
      } catch {
        /* Keep the known deck. */
      }
      router.push(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Access could not be confirmed. Retry when connected.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className={styles.demoPage}>
      <p className={styles.eyebrow}>{badge}</p>
      <h1>Access required</h1>
      <p>{sub}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label>
          Access PIN
          <input
            type="password"
            autoComplete="off"
            maxLength={40}
            required
            value={pin}
            disabled={busy}
            onChange={(e) => setPin(e.target.value)}
          />
        </label>
        <Button
          type="submit"
          busy={busy}
          disabled={!pin.trim()}
          disabledReason="Enter the PIN supplied for this private discussion."
        >
          Unlock deck
        </Button>
      </form>
      <a className={styles.textLink} href={`/?city=${slug}#contact`}>
        Ask about a pilot or deck access
      </a>
      <Link className={styles.textLink} href="/">
        Back to homepage
      </Link>
    </div>
  );
}
export default function CityDeckUnlock({ theme: _theme, ...props }: Props) {
  return (
    <MarketingShell>
      <Suspense fallback={<p role="status">Loading the access form…</p>}>
        <Form {...props} />
      </Suspense>
    </MarketingShell>
  );
}
