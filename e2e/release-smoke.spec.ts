import { test, expect } from '@playwright/test';
import { ensureTestAdmin, deleteUserByEmail, disconnect } from './helpers/seed';
const email = 'release-browser@example.test';
const password = 'disposable-browser-password-only';
test.afterAll(disconnect);
for (const width of [390, 1440]) {
  test(`public landing renders at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("landing.png"), fullPage: false });
  });
}
test('learner signs in through the real UI and opens a seeded path and lesson', async ({ page, request }) => {
  await deleteUserByEmail(email);
  expect((await request.post("/api/access", { data: { code: process.env.DEMO_ACCESS_CODE || "LEARN2EARN" } })).ok()).toBe(true);
  const registration = await request.post('/api/auth/register', { data: { email, password, fullName: 'Synthetic release learner' } });
  expect(registration.ok()).toBe(true);
  expect((await request.post("/api/user/onboarding", { data: { goal: null } })).ok()).toBe(true);
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/app$/);
  const path = page.locator('a[href^="/paths/"]').first();
  await expect(path).toBeVisible(); await path.click();
  const lesson = page.locator('a[href^="/lesson/"]').first();
  await expect(lesson).toBeVisible(); await lesson.click();
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
});
test('first-admin fixture can sign in and view the real dashboard', async ({ page }, testInfo) => {
  await ensureTestAdmin('release-admin@example.test', password);
  await page.goto('/admin/login');
  await page.locator('input[type=email]').fill('release-admin@example.test');
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
});
