"use client";
import { validRequestId } from "./correlation";
/** Bounded transport only. No automatic retry, queued write, financial replay or response storage. */
export async function clientFetch(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
    const controller = new AbortController();
    const abort = () => controller.abort(init.signal?.reason);
    if (init.signal?.aborted)
        abort();
    else
        init.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const slow = setTimeout(() => window.dispatchEvent(new Event("l2e:connection-slow")), 4000);
    try {
        const response = await fetch(input, { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal });
        // Await the complete non-streaming response so the deadline also covers stalled JSON/CSV bodies.
        const bytes = await response.arrayBuffer();
        const requestId = response.headers.get("x-l2e-request-id");
        window.dispatchEvent(new CustomEvent(response.status >= 500 ? "l2e:connection-failed" : "l2e:connection-ready", { detail: { requestId: validRequestId(requestId) ? requestId : null } }));
        // Framework/proxy failures can be HTML. Never expose that body or a JSON parser error as user feedback.
        if (response.status >= 500 && !response.headers.get("content-type")?.toLowerCase().includes("json")) {
            const headers = new Headers(response.headers);
            headers.set("Content-Type", "application/json");
            headers.delete("Content-Length");
            headers.delete("Content-Encoding");
            return new Response(JSON.stringify({ error: { code: "service_unavailable", message: "This request could not be confirmed. Try again when your connection and the service are available." } }), { status: response.status, headers });
        }
        return new Response([204, 205, 304].includes(response.status) ? null : bytes, { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    catch (error) {
        if (!init.signal?.aborted)
            window.dispatchEvent(new Event("l2e:connection-failed"));
        throw error;
    }
    finally {
        clearTimeout(timer);
        clearTimeout(slow);
        init.signal?.removeEventListener("abort", abort);
    }
}
