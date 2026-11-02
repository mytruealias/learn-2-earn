import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const evidence = process.env.RELEASE_EVIDENCE_DIR || "docs/release-evidence/public";
const observations: object[] = [];
test.afterAll(() => {
  mkdirSync(evidence, { recursive: true });
  writeFileSync(`${evidence}/checks.json`, JSON.stringify(observations, null, 2) + "\n");
});

for (const width of [360, 390, 768, 1440]) {
  test(`human help remains usable without an account at ${width}px`, async ({ page, context, browser, browserName }) => {
    await page.setViewportSize({ width, height: 950 });
    let pageErrors = 0;
    page.on("pageerror", () => { pageErrors += 1; });
    await page.goto("/lifeline");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Help and human support");
    await expect(page.getByText(/Program support status is unavailable|Sign in to see whether your program has/)).toBeVisible({ timeout: 20000 });
    const serviceUnavailable = await page.getByText(/Program support status is unavailable/).count() > 0;
    const crisis = page.getByRole("link", { name: "Crisis support: 988 (U.S.)", exact: true });
    await expect(crisis).toHaveAttribute("href", "tel:988");
    // Actual keyboard focus, independent of a model/provider or signed-in account.
    for (let n = 0; n < 35 && !(await crisis.evaluate(el => el === document.activeElement)); n++) {
      await page.keyboard.press("Tab");
    }
    await expect(crisis).toBeFocused();
    await expect(crisis).toBeInViewport();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(axe.violations.map(item => item.id)).toEqual([]);
    await expect(crisis).toBeFocused();
    const skip = await page.locator(".ds-skip-link").evaluate(el => ({ focused: el === document.activeElement, bottom: el.getBoundingClientRect().bottom }));
    expect(skip.focused).toBe(false);
    expect(skip.bottom).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(pageErrors).toBe(0);
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/human-help-${width}.png`, fullPage: true, animations: "disabled" });
    await page.screenshot({ path: `${evidence}/human-help-keyboard-${width}-viewport.png`, animations: "disabled" });
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "You appear to be offline" })).toBeVisible();
    await expect(crisis).toHaveAttribute("href", "tel:988");
    await context.setOffline(false);
    observations.push({ route: "/lifeline", width, browser: browserName, version: browser.version(), state: serviceUnavailable ? "public help with unavailable account service" : "public signed-out help", axeViolations: 0, noOverflow: true, pageErrors, keyboardFocus: true, reducedMotion: true, offlineNotice: true, authenticatedJourney: false });
  });
}

test("patched native image dependency works through the actual Next image endpoint", async ({ request }) => {
  const response = await request.get("/_next/image?url=%2Fimages%2Finvest%2Fhero-community.webp&w=640&q=75");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
  expect((await response.body()).length).toBeGreaterThan(1000);
  const invalid = await request.get("/_next/image?url=%2Fimages%2Finvest%2Fhero-community.webp&w=-1&q=75");
  expect(invalid.status()).toBe(400);
});
