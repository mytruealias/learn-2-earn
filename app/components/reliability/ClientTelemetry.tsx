"use client";
import { useEffect } from "react";
import { routeTemplate } from "@/lib/reliability/route-template";
/** Optional technical-error channel. No error values, stacks, user IDs, content, query strings or offline queue. */
export default function ClientTelemetry({ enabled }: {
    enabled: boolean;
}) {
    useEffect(() => {
        if (!enabled)
            return;
        let last = 0;
        const report = (code: "client_error" | "client_rejection") => {
            if (!navigator.onLine || Date.now() - last < 30000)
                return;
            last = Date.now();
            void fetch("/api/telemetry", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, route: routeTemplate(location.pathname) }), signal: AbortSignal.timeout(5000) }).catch(() => { });
        };
        const error = () => report("client_error"), rejection = () => report("client_rejection");
        window.addEventListener("error", error);
        window.addEventListener("unhandledrejection", rejection);
        return () => { window.removeEventListener("error", error); window.removeEventListener("unhandledrejection", rejection); };
    }, [enabled]);
    return null;
}
