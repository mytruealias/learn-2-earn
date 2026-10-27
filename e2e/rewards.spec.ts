import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  rewardFixture,
  rewardStaff,
  rewardSnapshot,
  disconnectRewards,
} from "./helpers/rewards";
const evidence = process.env.REWARDS_EVIDENCE_DIR,
  observations: object[] = [];
test.afterAll(async () => {
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2),
    );
  }
  await disconnectRewards();
});
async function login(page: Page, email: string) {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email, password: "synthetic-reward-password" },
      })
    ).ok(),
  ).toBe(true);
}
async function audit(page: Page, name: string, width: number) {
  expect(await page.evaluate(() => innerWidth)).toBe(width);
  const a = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(
    a.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const small = await page
    .locator(
      "[data-design] :is(button,a,select,input:not([type=checkbox]),textarea)",
    )
    .evaluateAll((es) =>
      es
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.width &&
            r.height &&
            !e.closest("[inert]") &&
            !e.classList.contains("ds-skip-link") &&
            (r.height < 43.9 || r.width < 43.9)
          );
        })
        .map((e) => e.textContent?.slice(0, 45)),
    );
  expect(small).toEqual([]);
  observations.push({
    screen: name,
    width,
    axeViolations: 0,
    noOverflow: true,
    targetsAtLeast44: true,
  });
  if (evidence) {
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({
      path: `${evidence}/${name}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}
async function fill(page: Page) {
  await page.getByLabel("XP to request", { exact: true }).fill("100");
  await page
    .getByLabel("Payment method", { exact: true })
    .selectOption("venmo");
  await page
    .getByLabel("Payment contact or mailing address", { exact: true })
    .fill("@synthetic-reward-contact");
  await page
    .getByRole("button", { name: "Review request", exact: true })
    .click();
}
for (const width of [360, 768, 1440])
  test(`request, reserve, review, approve and record manual payment at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const user = await rewardFixture(),
      staff = await rewardStaff();
    await login(page, user.email!);
    await page.goto("/profile?tab=earnings");
    await expect(
      page.getByRole("heading", { name: "Rewards", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Current program terms" }),
    ).toBeVisible();
    await audit(page, "learner-rewards", width);
    await fill(page);
    const dialog = page.getByRole("dialog", { name: "Confirm reward request" });
    await expect(dialog).toContainText("$5.00");
    await audit(page, "request-confirmation", width);
    await dialog.getByRole("checkbox").check();
    await dialog
      .getByRole("button", { name: "Confirm request", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Awaiting staff review", { exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator('section[aria-label="Reward request history"]')
        .textContent(),
    ).not.toContain("@synthetic-reward-contact");
    await audit(page, "reserved-request", width);
    const before = await rewardSnapshot(user.id);
    expect(before.account).toMatchObject({
      availableXp: 400,
      reservedXp: 100,
      spentXp: 0,
    });
    expect(before.user.totalXp).toBe(500);
    expect(
      (
        await page.request.post("/api/admin/login", {
          data: { email: staff.email, password: "synthetic-staff-password" },
        })
      ).ok(),
    ).toBe(true);
    await page.goto("/admin/payouts");
    await expect(
      page.getByRole("heading", { name: "Reward requests", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("••••ct", { exact: false })).toBeVisible();
    await audit(page, "staff-review", width);
    await page
      .getByRole("button", { name: "Record review", exact: true })
      .click();
    await page
      .getByLabel("Decision reason")
      .fill("Synthetic eligibility checked");
    await page
      .getByRole("button", { name: "Save decision", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("reviewed");
    await page
      .getByRole("button", { name: "Approve request", exact: true })
      .click();
    await page.getByLabel("Decision reason").fill("Synthetic approval only");
    await page
      .getByRole("button", { name: "Save decision", exact: true })
      .click();
    const approved = await rewardSnapshot(user.id);
    expect(approved.account).toMatchObject({ reservedXp: 100, spentXp: 0 });
    expect(approved.requests[0].paidAt).toBeNull();
    expect(
      (
        await page.request.post("/api/admin/finance/pool", {
          data: {
            requestKey: crypto.randomUUID(),
            amountCents: 1000,
            reason: "Synthetic bookkeeping funding; no funds move",
          },
        })
      ).ok(),
    ).toBe(true);
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("approved");
    await page
      .getByRole("button", {
        name: "Open private payment details",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Private payment contact:", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Hide payment contact", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Record manual payment", exact: true })
      .click();
    await page
      .getByLabel("Decision reason")
      .fill("Verified synthetic reference for test only");
    await page
      .getByLabel("External payment reference")
      .fill(`synthetic-reference-${width}`);
    const local = await page.evaluate(() => {
      const n = new Date();
      return new Date(n.getTime() - n.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19);
    });
    await page.getByLabel("Actual payment date and time").fill(local);
    await page
      .getByRole("checkbox", {
        name: "I verified this external payment.",
        exact: false,
      })
      .check();
    await audit(page, "manual-payment-record", width);
    await page
      .getByRole("button", { name: "Save payment record", exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.goto("/admin/finance");
    await expect(
      page.getByRole("heading", { name: "Reward finance", exact: true }),
    ).toBeVisible();
    await audit(page, "finance", width);
    await page.goto("/profile?tab=earnings");
    await expect(
      page.getByText("Payment recorded by staff", { exact: true }).first(),
    ).toBeVisible();
    await audit(page, "learner-paid-history", width);
    const paid = await rewardSnapshot(user.id);
    expect(paid.account).toMatchObject({
      availableXp: 400,
      reservedXp: 0,
      spentXp: 100,
    });
    expect(paid.user.totalXp).toBe(500);
    expect(paid.requests).toHaveLength(1);
    expect(paid.requests[0].amountCents).toBe(500);
    expect(paid.requests[0].paymentReference).toBe(
      `synthetic-reference-${width}`,
    );
  });
test("uncertain request retry reserves once; cancellation releases once", async ({
  page,
}) => {
  const user = await rewardFixture();
  await login(page, user.email!);
  await page.goto("/profile?tab=earnings");
  await fill(page);
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.route("**/api/payout/request", async (route) => {
    expect((await route.fetch()).ok()).toBe(true);
    await route.abort();
  });
  await page
    .getByRole("button", { name: "Confirm request", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await page.unroute("**/api/payout/request");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Retry unchanged request", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect((await rewardSnapshot(user.id)).requests).toHaveLength(1);
  await page
    .getByRole("button", { name: "Cancel this request", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await expect(
    page.getByText("Cancelled; XP released", { exact: true }).first(),
  ).toBeVisible();
  expect((await rewardSnapshot(user.id)).account).toMatchObject({
    availableXp: 500,
    reservedXp: 0,
  });
});
test("narrow keyboard confirmation, 200% text and network failure retain honest state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const user = await rewardFixture();
  await login(page, user.email!);
  await page.goto("/profile?tab=earnings");
  await fill(page);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Review request", exact: true }),
  ).toBeFocused();
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await audit(page, "rewards-text-200", 360);
  await page.route("**/api/rewards", (r) =>
    r.fulfill({
      status: 503,
      json: { error: { message: "Synthetic unavailable" } },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/rewards");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Current program terms" }),
  ).toBeVisible();
  expect((await rewardSnapshot(user.id)).requests).toEqual([]);
});
