import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ensureTestAdmin, disconnect } from "./helpers/seed";
import { mkdirSync, writeFileSync } from "node:fs";
const evidence = process.env.DESIGN_EVIDENCE_DIR;
const widths = [360, 768, 1440];
const observations: object[] = [];
test.afterAll(async () => {
  if (evidence)
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2) + "\n",
    );
  await disconnect();
});
async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      elements: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
async function checkLayout(page: Page) {
  // Inspect actual boxes, not overflow-x hidden on the old body reset.
  const outside = await page
    .locator(
      "[data-design] :is(h1,h2,h3,input,select,textarea,button,a,progress)",
    )
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            !el.closest("[inert]") &&
            !el.classList.contains("ds-skip-link") &&
            (r.left < -2 || r.right > innerWidth + 2)
          );
        })
        .map((el) => el.tagName + ":" + el.textContent?.trim().slice(0, 50)),
    );
  expect(outside).toEqual([]);
  const small = await page
    .locator("[data-design] :is(button,a,input,select)")
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            !el.closest("[inert]") &&
            !el.classList.contains("ds-skip-link") &&
            (r.width < 43.9 || r.height < 43.9)
          );
        })
        .map((el) => el.tagName + ":" + el.textContent?.trim().slice(0, 50)),
    );
  expect(small).toEqual([]);
}
async function screenshot(page: Page, name: string, width: number) {
  await checkLayout(page);
  await audit(page);
  observations.push({
    screen: name,
    width,
    axeViolations: 0,
    targetsAtLeast44: true,
    noOverflow: true,
  });
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({
      path: `${evidence}/${name}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}
async function staff(page: Page) {
  await ensureTestAdmin(
    "design-staff@example.test",
    "disposable-design-password",
  );
  const response = await page.request.post("/api/admin/login", {
    data: {
      email: "design-staff@example.test",
      password: "disposable-design-password",
    },
  });
  expect(response.ok()).toBe(true);
}
async function learner(page: Page) {
  expect((await page.request.post("/api/access", { data: { code: process.env.DEMO_ACCESS_CODE || "LEARN2EARN" } })).ok()).toBe(true);
  const response = await page.request.post("/api/auth/register", {
    data: {
      email: `design-${Date.now()}@example.test`,
      password: "disposable-design-password",
      fullName: "Synthetic design learner",
    },
  });
  expect(response.ok()).toBe(true);
  expect((await page.request.post("/api/user/onboarding", { data: { goal: null } })).ok()).toBe(true);
  await page.goto("/app");
  await page.locator('a[href^="/paths/"]').first().click();
  await expect(page).toHaveURL(/\/paths\/[^/?]+$/);
  await expect(page.locator('[data-design="learner"]')).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start learning", exact: true }),
  ).toBeVisible();
}
for (const width of widths) {
  test(`representative screens and showcase at ${width}px, text zoom and reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/design-system");
    expect(
      await page
        .getByRole("button", { name: "Open example dialog", exact: true })
        .evaluate((el) =>
          getComputedStyle(el)
            .transitionDuration.split(",")
            .every((value) => parseFloat(value) < 0.001),
        ),
    ).toBe(true);
    await screenshot(page, "showcase", width);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await checkLayout(page);
    await audit(page);
    if (evidence && width === 360)
      await page.screenshot({
        path: `${evidence}/showcase-360-text-200.png`,
        animations: "disabled",
      });
    await expect(
      page.getByRole("button", { name: "Unavailable action" }),
    ).toHaveAccessibleDescription(
      "Add a required organization name before saving.",
    );
    await expect(page.getByLabel("Website", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await learner(page);
    await screenshot(page, "learner-path", width);
    const progress = page.getByRole("progressbar", { name: "Path progress" });
    await expect(progress).toHaveAttribute("value", "0");
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await checkLayout(page);
    await audit(page);
    // Reflow must preserve readable words, not merely hide horizontal overflow.
    for (const label of [page.locator("h1"), page.getByRole("navigation", { name: "Primary" }).getByText("Help", { exact: true })]) {
      expect(await label.evaluate((element) => {
        const node = element.firstChild!;
        const range = document.createRange();
        range.setStart(node, 0);
        range.setEnd(node, (node.textContent || "").split(/\s/)[0].length);
        return range.getClientRects().length;
      })).toBe(1);
    }
    if (evidence && width === 360)
      await page.screenshot({
        path: `${evidence}/learner-path-360-text-200.png`,
        animations: "disabled",
      });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await staff(page);
    const existingServices = await (
      await page.request.get("/api/admin/directory")
    ).json();
    if (
      !existingServices.entries.some(
        (entry: { name: string }) =>
          entry.name === "Community support centre (synthetic)",
      )
    ) {
      const service = await page.request.post("/api/admin/directory", {
        data: {
          name: "Community support centre (synthetic)",
          category: "Shelter",
          address: "Synthetic address — no real location",
          hours: "Monday to Friday · check current availability",
          notes:
            "A sample entry for layout review. No personal learner information.",
          phone: null,
          website: null,
        },
      });
      expect(service.ok()).toBe(true);
    }
    await page.goto("/admin/directory");
    await expect(
      page
        .getByRole("heading", { name: "Community support centre (synthetic)" })
        .first(),
    ).toBeVisible();
    await screenshot(page, "staff-directory", width);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await checkLayout(page);
    await audit(page);
    if (evidence && width === 360)
      await page.screenshot({
        path: `${evidence}/staff-directory-360-text-200.png`,
        animations: "disabled",
      });
    observations.push({
      screen: "all-three",
      width,
      rootTextSize: "200%",
      axeViolations: 0,
      noOverflow: true,
    });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page
      .getByRole("button", { name: "+ Add service", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Add a service" });
    await expect(dialog).toBeVisible();
    await checkLayout(page);
    await audit(page);
    if (evidence)
      await page.screenshot({
        path: `${evidence}/staff-dialog-${width}.png`,
        animations: "disabled",
      });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
test("dialog keyboard loop, meaningful disabled state, focus restore and persistent notification", async ({
  page,
}) => {
  await page.goto("/dev/design-system");
  const trigger = page.getByRole("button", {
    name: "Open example dialog",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Example service form" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const outline = await trigger.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).toBe("solid");
  await page
    .getByRole("button", { name: "Preview notification", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Example notification. No data was saved." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(
    page.getByText("Example notification. No data was saved."),
  ).not.toBeVisible();
});
test("directory creates, edits, clears optional data and removes using the real server", async ({
  page,
}) => {
  await staff(page);
  await page.goto("/admin/directory");
  await page
    .getByRole("button", { name: "+ Add service", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const save = dialog.getByRole("button", {
    name: "Save service",
    exact: true,
  });
  await expect(save).toBeDisabled();
  await expect(save).toHaveAccessibleDescription(
    "Enter an organization name to save this service.",
  );
  const longName =
    "A community-led support organization with a long descriptive name for checking narrow screen layouts";
  await page
    .getByLabel("Organization name (required)", { exact: true })
    .fill(longName);
  await page.getByLabel("Address", { exact: true }).fill("Synthetic address");
  await save.click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: longName, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Edit ${longName}`, exact: true })
    .click();
  await page.getByLabel("Address", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save service", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const list = await (await page.request.get("/api/admin/directory")).json();
  expect(
    list.entries.find((entry: { name: string }) => entry.name === longName)
      .address,
  ).toBeNull();
  await page
    .getByRole("button", { name: `Remove ${longName}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove service", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: longName, exact: true }),
  ).not.toBeVisible();
});
test("real progress loads without a browser identity hint; failures offer retry instead of zero", async ({
  page,
}) => {
  await learner(page);
  const path = page.url();
  const link = page.locator('ol a[href^="/lesson/"]').first();
  const id = (await link.getAttribute("href"))!.split("/").pop();
  const session = await (
    await page.request.post("/api/auth/session", { data: {} })
  ).json();
  expect(
    (
      await page.request.post("/api/progress/complete", {
        data: { userId: session.user.id, lessonId: id },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("progressbar", { name: "Path progress" }),
  ).toHaveAttribute("value", "1");
  await page.route("**/api/progress/list", (route) =>
    route.fulfill({ status: 500, json: { ok: false } }),
  );
  await page.goto(path);
  await expect(
    page.locator("[data-design=learner]").getByRole("alert"),
  ).toContainText("Your progress could not load");
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.unroute("**/api/progress/list");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Path progress" }),
  ).toHaveAttribute("value", "1");
});
test("directory errors preserve the form; loading, empty and retry states stay explicit", async ({
  page,
}) => {
  await staff(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/admin/directory?**", async (route) => {
    await held;
    await route.fulfill({ status: 500, json: { ok: false } });
  });
  await page.goto("/admin/directory");
  try {
    await expect(
      page.getByRole("status").filter({ hasText: "Loading services" }).last(),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(
    page.locator("[data-design=staff-directory]").getByRole("alert"),
  ).toContainText("The directory could not load");
  await page.unroute("**/api/admin/directory?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await page
    .getByLabel("Search services", { exact: true })
    .fill("no-match-for-this-fixture");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matching services" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("button", { name: "+ Add service", exact: true })
    .click();
  await page
    .getByLabel("Organization name (required)", { exact: true })
    .fill("Preserve this input");
  await page.route("**/api/admin/directory", (route) =>
    route.fulfill({ status: 500, json: { ok: false } }),
  );
  await page.getByRole("button", { name: "Save service", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "could not be saved",
  );
  await expect(
    page.getByLabel("Organization name (required)", { exact: true }),
  ).toHaveValue("Preserve this input");
});

test("mobile staff navigation traps keyboard focus and restores the menu trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  await staff(page);
  await page.goto("/admin/directory");
  const toggle = page.getByRole("button", {
    name: "Toggle sidebar",
    exact: true,
  });
  await toggle.click();
  const navigation = page.getByRole("dialog", {
    name: "Staff navigation",
    exact: true,
  });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await expect(page.locator("#staff-content")).toHaveAttribute("inert", "");
  await page.keyboard.press("Shift+Tab");
  await expect(
    navigation.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    navigation.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(navigation).not.toBeVisible();
  await expect(toggle).toBeFocused();
});
