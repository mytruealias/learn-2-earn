import { test, expect } from "@playwright/test";

const CITY_SLUG = process.env.E2E_CITY_SLUG || "austin";
const VALID_PIN = process.env.E2E_CITY_PIN || process.env.AUSTIN_ACCESS_PIN || "1234";

test.describe("City PIN gate", () => {
  test("wrong PIN shows error, correct PIN unlocks", async ({ page }) => {
    await page.goto(`/${CITY_SLUG}`);

    const pinInput = page.locator('input[type="password"], input[type="tel"], input[name="pin"]').first();
    if (!(await pinInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "City PIN gate not configured for this slug");
    }

    await pinInput.fill("0000");
    await page.locator('button[type="submit"]').click();
    const err = page.locator("text=Invalid").or(page.locator("text=incorrect"));
    await expect(err).toBeVisible({ timeout: 5000 });

    await pinInput.fill(VALID_PIN);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/${CITY_SLUG}**`, { timeout: 5000 }).catch(() => {});
    const stillGated = await pinInput.isVisible().catch(() => false);
    expect(stillGated).toBe(false);
  });
});

test.describe("Landing page navigation", () => {
  test("loads and shows core CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Learn 2 Earn|L2E/i);
    const bookDemo = page.locator("text=/book a demo|request demo|contact/i").first();
    await expect(bookDemo).toBeVisible({ timeout: 5000 });
  });
});
