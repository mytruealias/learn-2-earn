"use client";
import { Button, ButtonLink } from "../ui";
import styles from "./reliability.module.css";
export default function RecoveryScreen({ reset }: {
    reset?: () => void;
}) {
    return <main className={styles.error} data-design="recovery" tabIndex={-1}>
    <h1>This page could not load</h1>
    <p>Your connection or a service may be unavailable. Keep any unsaved work in its original tab. No new save, reward or payment is confirmed by this message.</p>
    <div>{reset && <Button onClick={reset}>Try loading again</Button>}<ButtonLink href="/lifeline" variant="secondary">Human-help resources</ButtonLink><ButtonLink href="/" variant="quiet">Public homepage</ButtonLink></div>
  </main>;
}
