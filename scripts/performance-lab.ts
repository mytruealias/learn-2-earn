/** Production-mode lab only. Invoked by the nonce-attested disposable database harness; never a live URL. */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { getTestDatabaseUrl, assertTestDatabase } from "../lib/test-database-safety";
const origin = "http://127.0.0.1:5080";
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let cleanupDatabase: (() => Promise<void>) | undefined;
// Only controlled stage names and route templates reach logs; never error objects,
// request URLs, session tokens, database bindings or learner details.
let stage = "validate isolated database and build";
async function main() {
    getTestDatabaseUrl(); // Refuses production, development and unmarked/pre-existing targets.
    // Never publish a stale report when a subsequent run cannot complete.
    rmSync("docs/accessibility-reliability/lab/production-lab.json", { force: true });
    const artifact = ".next/BUILD_ID";
    if (!existsSync(artifact))
        throw new Error("Run the safe production build before the lab.");
    const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "app", "lib", "middleware.ts", "instrumentation.ts", "next.config.ts", "package.json", "package-lock.json", "prisma/schema.prisma", "scripts/build.ts"], { encoding: "utf8" }).trim().split("\n");
    if (files.some(file => existsSync(file) && statSync(file).mtimeMs > statSync(artifact).mtimeMs))
        throw new Error("The production artifact is stale. Rebuild before measuring.");
    stage = "prepare synthetic fixtures";
    const { default: db } = await import("../lib/prisma");
    cleanupDatabase = () => db.$disconnect();
    await assertTestDatabase(db);
    const { default: setup } = await import("../e2e/global-setup");
    await setup();
    const { createUser } = await import("../tests/helpers/factories");
    const { provisionStaff } = await import("../e2e/helpers/staff");
    const { reconcileFixtures } = await import("../tests/helpers/rewards");
    const learner = await createUser({ fullName: "Synthetic lab learner", totalXp: 120 });
    const staff = await provisionStaff("lab-staff@example.test", "synthetic-lab-password-only");
    const lessons = await db.lesson.findMany({ where: { isActive: true, module: { isActive: true, path: { isActive: true } } }, take: 25, orderBy: { id: "asc" }, select: { id: true, module: { select: { path: { select: { slug: true } } } } } });
    if (!lessons.length)
        throw new Error("Synthetic curriculum fixture is missing.");
    for (const lesson of lessons.slice(0, 15))
        await db.progress.create({ data: { userId: learner.user.id, lessonId: lesson.id, xpEarned: 8 } });
    for (let i = 0; i < 150; i++) {
        const participant = await db.user.create({ data: { fullName: `Synthetic participant ${i}`, totalXp: 100, enrollment: { create: { programId: "test-program" } } } });
        if (i < 30)
            await db.payoutRequest.create({ data: { userId: participant.id, programId: "test-program", xpAmount: 20, dollarAmount: 1, status: "pending", paymentMethod: "check", paymentHandle: "Synthetic fixture only" } });
    }
    await reconcileFixtures();
    const { createUserSession } = await import("../lib/user-session");
    const { createStaffSession } = await import("../lib/admin-auth");
    const learnerToken = await createUserSession(learner.user.id);
    const staffToken = await db.$transaction(tx => createStaffSession(tx, staff.id, true, "test-program"));
    const { createConnection } = await import("node:net");
    const occupied = await new Promise<boolean>(resolve => { const socket = createConnection({ host: "127.0.0.1", port: 5080 }); socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false)); socket.setTimeout(1000, () => { socket.destroy(); resolve(true); }); });
    if (occupied)
        throw new Error("Pre-existing local servers are refused.");
    stage = "start production server";
    let childReady = false;
    const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "5080", "-H", "0.0.0.0"], { env: { ...process.env, NODE_ENV: "production", NEXT_DIST_DIR: ".next", ROOT_DOMAIN: "", OPERATIONAL_TELEMETRY_ENABLED: "", OPENAI_API_KEY: "", STRIPE_SECRET_KEY: "", HUBERT_APPROVED_POLICY_VERSION: "", HUBERT_REVIEW_REFERENCE: "" }, stdio: ["ignore", "pipe", "pipe"] });
    server.stdout?.on("data", chunk => { if (String(chunk).includes("Ready"))
        childReady = true; });
    server.stderr?.on("data", () => { });
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
        let available = false;
        for (let i = 0; i < 50; i++) {
            try {
                available = (await fetch(origin + "/api/health/live", { signal: AbortSignal.timeout(1000) })).ok;
            }
            catch { }
            if (available && childReady && server.exitCode === null)
                break;
            available = false;
            await pause(200);
        }
        if (!available)
            throw new Error("Local production server did not start; no measurements recorded.");
        stage = "launch browser";
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined) });
        const routes = [
            { label: "/", path: "/", kind: "public" }, { label: "/app", path: "/app", kind: "learner" },
            { label: "/paths/[pathSlug]", path: `/paths/${lessons[0].module.path.slug}`, kind: "learner" },
            { label: "/lesson/[lessonId]", path: `/lesson/${lessons.at(-1)!.id}`, kind: "learner" },
            { label: "/practice", path: "/practice", kind: "learner" }, { label: "/profile?tab=earnings", path: "/profile?tab=earnings", kind: "learner" },
            { label: "/lifeline", path: "/lifeline", kind: "public" }, { label: "/admin/users", path: "/admin/users", kind: "staff" }, { label: "/admin/payouts", path: "/admin/payouts", kind: "staff" },
        ];
        const samples: {
            route: string;
            run: number;
            lcpMs: number | null;
            cls: number;
            labInteractionMs: number | null;
            transferredBytes: number;
            scriptBytes: number;
        }[] = [];
        for (const route of routes)
            for (let run = 0; run < 5; run++) {
                stage = `navigate ${route.label}, sample ${run + 1}`;
                console.log(`[performance] ${stage}`);
                const headers: Record<string, string> = route.kind === "learner" ? { cookie: `l2e_user_session=${learnerToken}` } : route.kind === "staff" ? { cookie: `l2e_admin_session=${staffToken}`, "x-l2e-program": "test-program" } : {};
                const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1, reducedMotion: "reduce", extraHTTPHeaders: headers });
                // A lab fixture may only contact this newly started local server. Never send its credential to another origin.
                await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
                const page = await context.newPage(), cdp = await context.newCDPSession(page);
                await cdp.send("Network.enable");
                await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
                await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 });
                await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
                await page.addInitScript(() => {
                    const metrics = { lcp: 0, cls: 0, interaction: 0 };
                    (window as unknown as {
                        lab: typeof metrics;
                    }).lab = metrics;
                    new PerformanceObserver(list => { for (const entry of list.getEntries())
                        metrics.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
                    let start = 0, last = 0, total = 0;
                    new PerformanceObserver(list => { for (const entry of list.getEntries() as (PerformanceEntry & {
                        hadRecentInput: boolean;
                        value: number;
                    })[]) {
                        if (entry.hadRecentInput)
                            continue;
                        if (entry.startTime - last > 1000 || entry.startTime - start > 5000) {
                            start = entry.startTime;
                            total = 0;
                        }
                        last = entry.startTime;
                        total += entry.value;
                        metrics.cls = Math.max(metrics.cls, total);
                    } }).observe({ type: "layout-shift", buffered: true });
                    if (PerformanceObserver.supportedEntryTypes.includes("event"))
                        new PerformanceObserver(list => { for (const entry of list.getEntries() as (PerformanceEntry & {
                            interactionId: number;
                        })[])
                            if (entry.interactionId)
                                metrics.interaction = Math.max(metrics.interaction, entry.duration); }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
                });
                const response = await page.goto(origin + route.path, { waitUntil: "networkidle", timeout: 45000 });
                if (!response?.ok() || page.url().includes("/login") || page.url().includes("/access"))
                    throw new Error("Representative route did not load its intended state; no successful lab report is emitted.");
                stage = `check loaded state ${route.label}, sample ${run + 1}`;
                await page.waitForTimeout(2000);
                await page.getByRole("status").filter({ hasText: /^Loading / }).first().waitFor({ state: "hidden", timeout: 20000 });
                stage = `check heading ${route.label}, sample ${run + 1}`;
                const heading = await page.locator("main h1").first().textContent();
                if (!heading || /This page could not load|Learn2Earn could not open|could not find that page|Checking your staff session/.test(heading) || await page.locator("main").getByRole("alert").count())
                    throw new Error("The representative route is in an error state; no successful lab report is emitted.");
                // Only a navigation dialog is exercised. No answer, reward or finance action is automatically submitted.
                const menu = page.getByRole("button", { name: "Menu", exact: true });
                if (await menu.count()) {
                    stage = `open navigation ${route.label}, sample ${run + 1}`;
                    await menu.click();
                    await page.waitForTimeout(250);
                }
                const values = await page.evaluate(() => ({ ...(window as unknown as {
                        lab: {
                            lcp: number;
                            cls: number;
                            interaction: number;
                        };
                    }).lab, transferredBytes: (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).reduce((n, entry) => n + entry.transferSize, 0), scriptBytes: (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).filter(entry => entry.initiatorType === "script").reduce((n, entry) => n + entry.encodedBodySize, 0) }));
                samples.push({ route: route.label, run: run + 1, lcpMs: values.lcp || null, cls: values.cls, labInteractionMs: values.interaction || null, transferredBytes: values.transferredBytes, scriptBytes: values.scriptBytes });
                await context.close();
            }
        const percentile = (values: number[]) => values.length ? values.sort((a, b) => a - b)[Math.ceil(values.length * .75) - 1] : null;
        const summaries = routes.map(route => { const group = samples.filter(sample => sample.route === route.label); return { route: route.label, labP75LcpMs: percentile(group.flatMap(s => s.lcpMs === null ? [] : [s.lcpMs])), labP75Cls: percentile(group.map(s => s.cls)), labP75InteractionMs: percentile(group.flatMap(s => s.labInteractionMs === null ? [] : [s.labInteractionMs])), measuredInteractionRuns: group.filter(s => s.labInteractionMs !== null).length }; });
        const directory = "docs/accessibility-reliability/lab";
        mkdirSync(directory, { recursive: true });
        writeFileSync(join(directory, "production-lab.json"), JSON.stringify({ kind: "local production lab, not field telemetry or field INP", build: readFileSync(artifact, "utf8").trim(), conditions: { viewport: "390x844", cpuSlowdown: 4, latencyMs: 150, downMbps: 1.6, upMbps: .75, coldBrowserCache: true, runsPerRoute: 5 }, fixtures: { authoredCurriculum: true, returningLearnerCompletions: 15, additionalSyntheticParticipants: 150, syntheticPendingRequests: 30, liveProviderCalls: false }, fieldGoals: { lcpP75Ms: 2500, inpP75Ms: 200, clsP75: .1 }, samples, summaries }, null, 2) + "\n");
        console.log("Production lab complete. Results contain route templates and timings only; no field-performance claim.");
    }
    finally {
        if (browser)
            await browser.close();
        server.kill("SIGTERM");
        await db.$disconnect();
    }
}
main().catch(async () => {
    if (cleanupDatabase) await cleanupDatabase().catch(() => {}); console.error(`Production lab failed during: ${stage}. No partial lab results are claimed.`); process.exitCode = 1; });
