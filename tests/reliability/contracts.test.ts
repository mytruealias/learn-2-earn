import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { operationalEvent } from "@/lib/reliability/events";
import { newRequestId, validRequestId } from "@/lib/reliability/correlation";
import { routeTemplate } from "@/lib/reliability/route-template";
import { readRequestJson } from "@/lib/reliability/read-json";
import { summarizePath } from "@/lib/path-summary";
import type { LearningPath } from "@/lib/learning-progression";
import { boundedDatabaseUrl } from "@/lib/reliability/database-url";
import { apiServerError } from "@/lib/api-helpers";
import { RateStoreUnavailable } from "@/lib/reliability/rate-limit";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("bounded and private operational contracts", () => {
    it("bounds connection/pool waits without changing database identity or credentials", () => {
        const value = "postgresql://synthetic:synthetic@127.0.0.1:1/synthetic?schema=public&connect_timeout=0&pool_timeout=90";
        const result = new URL(boundedDatabaseUrl(value)!);
        expect(result.hostname).toBe("127.0.0.1");
        expect(result.pathname).toBe("/synthetic");
        expect(result.password).toBe("synthetic");
        expect(result.searchParams.get("connect_timeout")).toBe("5");
        expect(result.searchParams.get("pool_timeout")).toBe("5");
        expect(boundedDatabaseUrl(undefined)).toBeUndefined();
    });
    it("overwrites untrusted correlation IDs and prevents private API/redirect caching", async () => {
        vi.stubEnv("ROOT_DOMAIN", "");
        for (const path of ["/api/rewards", "/api/chat", "/api/health/live", "/api/telemetry", "/profile"]) {
            const r = await middleware(new NextRequest("http://local.test" + path, { headers: { "x-l2e-request-id": "person@example.test" } }));
            expect(validRequestId(r.headers.get("x-l2e-request-id"))).toBe(true);
            expect(r.headers.get("cache-control")).toContain("no-store");
        }
    });
    it("records no raw error, route ID, personal data or secrets", async () => {
        const log = vi.spyOn(console, "error").mockImplementation(() => { });
        operationalEvent("api_failure", "email@example.test", "https://host/person@example.test?secret=private");
        operationalEvent("render_failure", "email@example.test", "/admin/users/synthetic-private-person");
        const r = await apiServerError("auth/login", new Error("private password and person@example.test"));
        const d = await r.json();
        expect(d.requestId).toBe(r.headers.get("x-l2e-request-id"));
        expect(validRequestId(d.requestId)).toBe(true);
        expect(JSON.stringify(log.mock.calls)).not.toMatch(/password|email@|person@|synthetic-private-person|private|secret/);
        expect((await apiServerError("access", new RateStoreUnavailable())).status).toBe(503);
    });
    it("classifies routes without retaining dynamic identity or queries", () => {
        expect(routeTemplate("/paths/a-private-program")).toBe("/paths/[pathSlug]");
        expect(routeTemplate("/admin/users/person%40example.test")).toBe("/admin/users/[userId]");
        expect(routeTemplate("/unknown?secret=x")).toBe("/other");
        expect(validRequestId(newRequestId())).toBe(true);
    });
    it("bounds streamed and declared bodies, malformed data and explicit cancellation", async () => {
        const req = (body: string, headers = {}) => new Request("http://test", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
        expect((await readRequestJson(req('{"test":1}'), 64)).ok).toBe(true);
        const long = await readRequestJson(req('"' + "x".repeat(128) + '"'), 64);
        expect(!long.ok && long.error.status).toBe(413);
        const declared = await readRequestJson(req('{}', { "content-length": "1000" }), 64);
        expect(!declared.ok && declared.error.status).toBe(413);
        const malformed = await readRequestJson(req('{invalid'), 64);
        expect(!malformed.ok && malformed.error.status).toBe(400);
        const controller = new AbortController();
        controller.abort();
        const cancelled = await readRequestJson(new Request("http://test", { method: "POST", body: '{}', headers: { "content-type": "application/json" }, signal: controller.signal }), 64);
        expect(!cancelled.ok && cancelled.error.status).toBe(408);
    });
    it("keeps accurate path summaries without serializing the curriculum tree", () => {
        const path: LearningPath = { id: "path", slug: "test", title: "Synthetic path", description: "Synthetic only", icon: "", modules: [{ id: "unit", title: "Unit", description: "", order: 1, lessons: Array.from({ length: 200 }, (_, n) => ({ id: `lesson-${n}`, title: `Synthetic lesson ${n}`, order: n, xpReward: 10, estimatedMinutes: 5, lessonType: "learn", available: n < 199 })) }] };
        const summary = summarizePath(path, new Set(["lesson-0", "lesson-199"]));
        expect(summary.progress).toEqual({ total: 199, completed: 1, preparing: 1 });
        expect(summary.minutes).toBe(995);
        expect(JSON.stringify(summary)).not.toContain("lesson-0");
        expect(JSON.stringify(summary).length).toBeLessThan(JSON.stringify(path).length / 10);
    });
});
