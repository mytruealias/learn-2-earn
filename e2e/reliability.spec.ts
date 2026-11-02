import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { syntheticCityAccess } from "./helpers/public-city";
const evidence = process.env.RELIABILITY_EVIDENCE_DIR || "docs/accessibility-reliability/screenshots";
const observations: object[] = [];
test.afterAll(() => { mkdirSync(evidence, { recursive: true }); writeFileSync(`${evidence}/checks.json`, JSON.stringify(observations, null, 2) + "\n"); });
async function inspect(page: Page, label: string, width: number, state: string) {
    await expect(page.locator("main").first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), label).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label).toBe(true);
    await expect(page.locator("h1").first()).toBeVisible();
    const marketingNav = page.locator('[data-ui-shell="marketing"] > header');
    if (await marketingNav.count()) expect(await marketingNav.evaluate(e => getComputedStyle(e).display)).toBe("flex");
    const cdp = await page.context().newCDPSession(page);
    const ax = await cdp.send("Accessibility.getFullAXTree");
    await cdp.detach();
    const controls = ax.nodes.filter(n => ["status", "alert", "dialog", "textbox", "radio", "progressbar", "button"].includes(n.role?.value || "")).slice(0, 40).map(n => ({ role: n.role?.value, name: n.name?.value, description: n.description?.value, live: n.properties?.find(p => p.name === "live")?.value.value }));
    const headings = ax.nodes.filter(n => n.role?.value === "heading").map(n => ({ name: n.name?.value, level: n.properties?.find(p => p.name === "level")?.value.value }));
    observations.push({ route: label, width, state, axeViolations: 0, noOverflow: true, headingTree: headings, accessibilityTreeControls: controls, screenReaderSpeech: "not run" });
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/${label.replaceAll("/", "-").replace(/^-|-$|[\[\]]/g, "") || "home"}-${state}-${width}.png`, fullPage: true, animations: "disabled" });
}
for (const width of [360, 1440])
    test(`public, help and city states at ${width}`, async ({ page }) => {
        test.setTimeout(150000);
        await page.setViewportSize({ width, height: 900 });
        for (const path of ["/", "/demo", "/privacy", "/terms", "/recover", "/lifeline", "/unknown-audit-address"]) {
            await page.goto(path);
            await inspect(page, path, width, path === "/lifeline" ? "unavailable-account-service" : "rendered");
        }
        await page.goto("/austin");
        await expect(page).toHaveURL(/\/unlock/);
        await inspect(page, "/austin/unlock", width, "ready");
        await page.getByLabel("Access PIN").fill("1234");
        await page.getByRole("button", { name: "Unlock deck", exact: true }).click();
        await expect(page.locator("main").getByRole("alert")).toContainText("shared access service");
        await inspect(page, "/austin/unlock", width, "store-unavailable");
        for (const slug of ["austin", "dallas", "houston", "denver", "los-angeles", "san-francisco"]) {
            await page.goto(`/${slug}`);
            await expect(page).toHaveURL(new RegExp(`/${slug}/unlock`));
            await inspect(page, `/${slug}/unlock`, width, "gated");
            await syntheticCityAccess(page.context(), slug, 5056);
            await page.goto(`/${slug}`);
            await inspect(page, `/${slug}`, width, "synthetic-signed-presentation");
        }
    });
test("offline, reconnect, keyboard menu, text enlargement and no write replay", async ({ page, context }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto("/demo");
    let writes = 0;
    page.on("request", r => { if (r.method() === "POST")
        writes++; });
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "You appear to be offline" })).toBeVisible();
    await page.getByRole("button", { name: "Continue sample", exact: true }).click();
    await context.setOffline(false);
    await expect(page.getByRole("status").filter({ hasText: "connection appears to be back" })).toBeVisible();
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Dismiss connection notice" }).click();
    await page.getByRole("button", { name: "Menu", exact: true }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Website navigation" });
    await expect(dialog.getByRole("button", { name: "Close dialog" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("link").last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const readableChoices = await page.locator('main label:has(input[type="radio"]) > span').evaluateAll(els => els.length === 2 && els.every(e => e.getBoundingClientRect().width >= 5 * parseFloat(getComputedStyle(e).fontSize)));
    expect(readableChoices).toBe(true);
    await inspect(page, "/demo", 360, "text-200");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    const durations = await page.locator("main button").evaluateAll(els => els.flatMap(e => getComputedStyle(e).transitionDuration.split(",").map(parseFloat)));
    expect(durations.every(n => n <= .01)).toBe(true);
    expect(await page.evaluate(() => navigator.serviceWorker?.getRegistrations().then(r => r.length) || 0)).toBe(0);
});
test("health, readiness and independent gate fail safely without database access", async ({ request }) => {
    const live = await request.get("/api/health/live");
    expect(live.ok()).toBe(true);
    expect(live.headers()["cache-control"]).toContain("no-store");
    expect(live.headers()["x-l2e-request-id"]).toMatch(/^[a-f0-9]{32}$/);
    const ready = await request.get("/api/health/ready");
    expect(ready.status()).toBe(503);
    expect(await ready.text()).not.toMatch(/password|postgresql|Prisma|DATABASE_URL/);
    const pin = await request.post("/api/city-access/austin", { data: { pin: "1234" } });
    expect(pin.status()).toBe(503);
    expect((await pin.json()).requestId).toBe(pin.headers()["x-l2e-request-id"]);
    expect(pin.headers()["cache-control"]).toContain("no-store");
    expect((await request.post("/api/telemetry", { data: { code: "client_error", route: "/" } })).status()).toBe(404);
});
const syntheticAdmin = { id: "synthetic-admin", email: "staff@example.test", fullName: "Synthetic staff", role: "admin", programId: "synthetic-program", programName: "Synthetic test program", organizationName: "Synthetic test organization", membershipRole: "program_admin" };
test("staff client routes retain accessible loading/error recovery with synthetic API interception", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 360, height: 900 });
    await page.route("**/api/admin/**", route => route.fulfill({ status: route.request().url().endsWith("/session") ? 200 : 503, json: route.request().url().endsWith("/session") ? { authenticated: true, admin: syntheticAdmin } : { error: { code: "service_unavailable", message: "Synthetic service unavailable. Retry when connected." } } }));
    for (const path of ["/admin", "/admin/users", "/admin/cases", "/admin/cases/synthetic-case", "/admin/users/synthetic-user", "/admin/payouts", "/admin/reports", "/admin/directory", "/admin/staff", "/admin/audit", "/admin/inquiries", "/admin/security"]) {
        await page.goto(path);
        await expect(page.locator("main").getByRole("alert").first()).toBeVisible();
        await inspect(page, path, 360, "synthetic-api-error");
        const notice = page.getByRole("complementary", { name: "Connection status" });
        if (await notice.isVisible()) {
            const n = await notice.boundingBox(), button = await page.getByRole("button", { name: "Toggle sidebar" }).boundingBox();
            expect(button!.y).toBeGreaterThanOrEqual(n!.y + n!.height - 1);
        }
    }
});
test("staff revoked/unknown session hides records and exposes a real recovery action", async ({ page }) => {
    await page.route("**/api/admin/**", r => r.fulfill({ status: 503, json: { error: { message: "Synthetic session unavailable" } } }));
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Staff access could not be checked" })).toBeVisible();
    await inspect(page, "/admin/users", 1440, "session-unavailable");
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Staff access could not be checked" })).toBeVisible();
});
test("staff sign-in and membership recovery preserve keyboard semantics and do not fake sign-out", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.route("**/api/admin/**", r => r.fulfill({ status: r.request().url().endsWith("/session") && r.request().method() === "GET" ? 200 : 503, json: r.request().url().endsWith("/session") && r.request().method() === "GET" ? { authenticated: false, nextStep: "login" } : { error: { message: "Synthetic service unavailable" } } }));
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
    await inspect(page, "/admin/login", 360, "sign-in");
    await page.goto("/admin/programs");
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    await inspect(page, "/admin/programs", 360, "memberships-unavailable");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Sign out could not be confirmed");
    await expect(page).toHaveURL(/\/admin\/programs$/);
});
test("back navigation and refresh recheck a revoked staff session", async ({ page }) => {
    let active = true;
    await page.route("**/api/admin/**", route => route.fulfill({ status: route.request().url().endsWith("/session") ? 200 : 503, json: route.request().url().endsWith("/session") ? (active ? { authenticated: true, admin: syntheticAdmin } : { authenticated: false, nextStep: "login" }) : { error: { message: "Synthetic unavailable queue" } } }));
    await page.goto("/admin/users");
    await expect(page.getByText("Synthetic test program", { exact: true }).first()).toBeVisible();
    await page.goto("/privacy");
    active = false;
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
    await expect(page.getByText("Synthetic test program", { exact: true })).toHaveCount(0);
});
test("human help does not start audio or AI processing without a choice", async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as {
        audioStarts: number;
    }).audioStarts = 0; HTMLMediaElement.prototype.play = async () => { (window as unknown as {
        audioStarts: number;
    }).audioStarts++; }; if ("speechSynthesis" in window)
        window.speechSynthesis.speak = () => { (window as unknown as {
            audioStarts: number;
        }).audioStarts++; }; });
    const providerCalls: string[] = [];
    page.on("request", r => { if (/\/api\/(chat|tts)$/.test(r.url()) && r.method() === "POST")
        providerCalls.push(r.url()); });
    await page.goto("/lifeline");
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as {
        audioStarts: number;
    }).audioStarts)).toBe(0);
    expect(providerCalls).toEqual([]);
});

test("development component workshop retains dialog focus, visible states and persistent feedback",async({page})=>{
 await page.setViewportSize({width:360,height:900});await page.goto("/dev/design-system");
 const trigger=page.getByRole("button",{name:"Open example dialog",exact:true});await trigger.focus();await page.keyboard.press("Enter");
 const dialog=page.getByRole("dialog",{name:"Example service form"});await expect(dialog.getByRole("button",{name:"Close dialog"})).toBeFocused();await page.keyboard.press("Escape");await expect(trigger).toBeFocused();
 await page.getByRole("button",{name:"Preview notification",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Example notification"})).toBeVisible();await inspect(page,"/dev/design-system",360,"component-states");
});

test("focused human-help controls remain between sticky header and bottom navigation",async({page})=>{
 await page.setViewportSize({width:360,height:900});await page.route("**/api/**",r=>r.fulfill({status:503,json:{error:{message:"Synthetic unavailable account service"}}}));
 await page.goto("/lifeline");await expect(page.getByRole("complementary",{name:"Connection status"})).toBeVisible();
 const link=page.getByRole("link",{name:/Crisis support: 988/});await link.focus();
 await expect.poll(async()=>{const target=await link.boundingBox(),header=await page.locator('[data-learner-shell] header').first().boundingBox(),nav=await page.getByRole("navigation",{name:"Primary"}).boundingBox();return !!(target&&header&&nav&&target.y>=header.y+header.height-1&&target.y+target.height<=nav.y+1);}).toBe(true);
 await page.screenshot({path:`${evidence}/lifeline-keyboard-focus-360.png`,fullPage:false});
});
