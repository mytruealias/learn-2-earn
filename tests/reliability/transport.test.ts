import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clientFetch } from "@/lib/reliability/client-fetch";
let events: string[];
beforeEach(() => { events = []; const target = new EventTarget(); for (const e of ["l2e:connection-slow", "l2e:connection-failed", "l2e:connection-ready"])
    target.addEventListener(e, () => events.push(e)); vi.stubGlobal("window", target); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });
it("does not replay mutations and forces private no-store transport", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Synthetic disconnection"));
    vi.stubGlobal("fetch", fetcher);
    await expect(clientFetch("/api/payout/request", { method: "POST", body: "synthetic" })).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].cache).toBe("no-store");
    expect(events).toContain("l2e:connection-failed");
});
it("preserves cancellation and enforces a deadline while reading a stalled body", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async (_input, init) => new Response(new ReadableStream({ start(controller) { init.signal.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError"))); } }))));
    const waiting = clientFetch("/api/practice", {}, 5000);
    const result = expect(waiting).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(4100);
    expect(events).toContain("l2e:connection-slow");
    await vi.advanceTimersByTimeAsync(1000);
    await result;
    expect(events).toContain("l2e:connection-failed");
});
it("does not report normal caller cancellation as a service failure", async () => {
    const c = new AbortController();
    c.abort();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("Aborted", "AbortError"); }));
    await expect(clientFetch("/api/practice", { signal: c.signal })).rejects.toThrow();
    expect(events).toEqual([]);
});
it("preserves confirmed status and JSON, including no-content replies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ ok: true })).mockResolvedValueOnce(new Response(null, { status: 204 })));
    expect(await (await clientFetch("/api/practice")).json()).toEqual({ ok: true });
    expect((await clientFetch("/api/example")).status).toBe(204);
});
