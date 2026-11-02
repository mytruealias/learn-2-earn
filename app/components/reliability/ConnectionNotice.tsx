"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../ui";
import styles from "./reliability.module.css";
export default function ConnectionNotice() {
    const [state, setState] = useState<"ready" | "offline" | "slow" | "failed" | "reconnected">("ready");
    const ref = useRef<HTMLElement>(null);
    const [reference, setReference] = useState<string | null>(null);
    useEffect(() => {
        const offline = () => setState("offline"), online = () => setState("reconnected"), slow = () => setState(s => s === "offline" ? s : "slow"), failed = (event: Event) => { setReference((event as CustomEvent<{
            requestId?: string;
        }>).detail?.requestId || null); setState(s => s === "offline" ? s : "failed"); }, ready = () => setState(s => s === "slow" ? "ready" : s);
        if (!navigator.onLine)
            offline();
        window.addEventListener("offline", offline);
        window.addEventListener("online", online);
        window.addEventListener("l2e:connection-slow", slow);
        window.addEventListener("l2e:connection-failed", failed);
        window.addEventListener("l2e:connection-ready", ready);
        return () => { window.removeEventListener("offline", offline); window.removeEventListener("online", online); window.removeEventListener("l2e:connection-slow", slow); window.removeEventListener("l2e:connection-failed", failed); window.removeEventListener("l2e:connection-ready", ready); };
    }, []);
    useEffect(() => {
        if (state === "ready")
            return;
        const measure = () => document.documentElement.style.setProperty("--l2e-connection-inset", `${Math.ceil(Math.max(0, ref.current?.getBoundingClientRect().bottom || 0))}px`);
        const observer = new ResizeObserver(measure);
        if (ref.current)
            observer.observe(ref.current);
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        measure();
        return () => { observer.disconnect(); window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); document.documentElement.style.removeProperty("--l2e-connection-inset"); };
    }, [state]);
    if (state === "ready")
        return null;
    return <aside ref={ref} className={styles.connection} data-design="connection" aria-label="Connection status">
    <p role="status" aria-atomic="true">{state === "offline" ? "You appear to be offline. Connectivity is needed to save learning and confirm requests. Unsaved answers and financial requests are not queued for automatic replay." : state === "slow" ? "This is taking longer than usual. Keep this page open while the request finishes; a save is confirmed only by its response." : state === "reconnected" ? "Your connection appears to be back. Use the screen’s retry or check saved history before repeating a request." : "A connection or service request could not be confirmed. Keep any unsaved work here and use the screen’s retry when ready."}{reference && <span> Support reference: {reference}.</span>}</p>
    <div><Link href="/lifeline">Human-help resources</Link><Button variant="quiet" onClick={() => setState("ready")}>Dismiss connection notice</Button></div>
  </aside>;
}
