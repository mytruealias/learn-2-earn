import { completeLesson } from "./helpers/lesson";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  programFixture,
  learnerFixture,
  savedSnapshot,
  markEarlierReview,
  programVisible,
  disconnectLearning,
} from "./helpers/learning";
const evidence = process.env.PROGRESSION_EVIDENCE_DIR,
  observations: object[] = [];
let fixture: Awaited<ReturnType<typeof programFixture>>;
test.beforeAll(async () => {
  fixture = await programFixture();
});
test.afterAll(async () => {
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2) + "\n",
    );
  }
  await disconnectLearning();
});
async function login(page: Page) {
  const user = await learnerFixture();
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: user.email, password: "synthetic-progression-password" },
      })
    ).ok(),
  ).toBe(true);
  return user;
}
async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  const geometry = await page
    .locator("[data-design] :is(h1,h2,h3,button,a,input,select,summary)")
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width &&
            r.height &&
            !el.closest("[inert]") &&
            !el.classList.contains("ds-skip-link") &&
            (r.left < -2 ||
              r.right > innerWidth + 2 ||
              (["A", "BUTTON", "INPUT", "SELECT", "SUMMARY"].includes(
                el.tagName,
              ) &&
                (r.width < 43.9 || r.height < 43.9)))
          );
        })
        .map((el) => el.tagName + ":" + el.textContent?.trim().slice(0, 45)),
    );
  expect(geometry).toEqual([]);
}
async function capture(page: Page, screen: string, width: number) {
  await audit(page);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  observations.push({
    screen,
    width,
    axeViolations: 0,
    noOverflow: true,
    targetsAtLeast44: true,
  });
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({
      path: `${evidence}/${screen}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}
async function complete(page: Page, id: string) {
  expect((await completeLesson(page.request, id)).ok()).toBe(true);
}
for (const width of [360, 768, 1440]) {
  test(`new learning home and equivalent path views at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const user = await login(page);
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Learn at your pace", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: fixture.a.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("About 3 minutes", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A small goal for today" }),
    ).toBeVisible();
    await capture(page, "new-home", width);
    const before = await savedSnapshot(user.id),
      opened = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/lesson/attempt") &&
          r.request().method() === "POST",
      );
    await page
      .getByRole("link", { name: "Start learning", exact: true })
      .click();
    expect((await opened).ok()).toBe(true);
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    expect(await savedSnapshot(user.id)).toEqual(before);
    await page.goto(`/paths/${fixture.path.slug}`);
    await expect(
      page.getByRole("progressbar", { name: "Path progress" }),
    ).toHaveAttribute("value", "0");
    await expect(
      page.getByRole("heading", { name: fixture.path.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Hidden inactive lesson", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Hidden inactive unit", { exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("[data-lesson-state=in_progress]")).toHaveCount(
      1,
    );
    await expect(page.locator("[data-lesson-state=unavailable]")).toContainText(
      "being prepared",
    );
    const pathLinks = await page
      .locator('ol a[href^="/lesson/"]')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
    await capture(page, "vertical-path", width);
    const linear = page.getByRole("button", {
      name: "Linear list",
      exact: true,
    });
    await linear.focus();
    expect(
      await linear.evaluate((el) =>
        parseFloat(getComputedStyle(el).outlineWidth),
      ),
    ).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Enter");
    await expect(linear).toHaveAttribute("aria-pressed", "true");
    expect(
      await page
        .locator('ol a[href^="/lesson/"]')
        .evaluateAll((elements) =>
          elements.map((el) => el.getAttribute("href")),
        ),
    ).toEqual(pathLinks);
    await capture(page, "linear-list", width);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await audit(page);
    observations.push({
      screen: "linear-list",
      width,
      rootTextSize: "200%",
      axeViolations: 0,
      noOverflow: true,
    });
    if (evidence && width === 360)
      await page.screenshot({
        path: `${evidence}/linear-list-360-text-200.png`,
        animations: "disabled",
      });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    expect(await savedSnapshot(user.id)).toEqual(before);
  });
}
test("returning partial progress, opened state, optional review and selected pathways are real", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const user = await login(page);
  await complete(page, fixture.a.id);
  await complete(page, fixture.c.id);
  await markEarlierReview(user.id, fixture.a.id, fixture.a.cards[0].id);
  expect(
    (
      await page.request.post("/api/progress/open", {
        data: { lessonId: fixture.b.id },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: fixture.b.title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Welcome back. Your progress is still here.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: `Keep in My paths: ${fixture.path.title}`,
      exact: true,
    })
    .click();
  await expect(
    page.locator("[role=status]").filter({ hasText: "is in My paths" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: fixture.b.title, exact: true }),
  ).toBeVisible();
  await capture(page, "returning-home", 360);
  await page.goto(`/paths/${fixture.path.slug}`);
  await expect(
    page.getByRole("progressbar", { name: "Path progress" }),
  ).toHaveAttribute("value", "2");
  await expect(
    page.getByRole("progressbar", { name: "Path progress" }),
  ).toHaveAttribute("max", "4");
  for (const state of [
    "ready",
    "in_progress",
    "completed",
    "review_suggested",
    "unavailable",
  ])
    await expect(page.locator(`[data-lesson-state=${state}]`)).toHaveCount(1);
  await capture(page, "all-lesson-states", 360);
});
test("all available lessons complete offers optional review and an empty unit stays truthful", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const user = await login(page);
  for (const lesson of [fixture.a, fixture.b, fixture.c, fixture.d])
    await complete(page, lesson.id);
  const before = await savedSnapshot(user.id);
  await page.goto("/app");
  await expect(
    page.getByRole("link", { name: "Review a lesson", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Every available lesson is complete. Optional practice can count toward your daily goal.",
    ),
  ).toBeVisible();
  await capture(page, "all-complete", 1440);
  await page.goto(`/paths/${fixture.empty.slug}`);
  await expect(
    page.getByText(
      "No published lessons in this unit yet. Other units and Help remain available.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await capture(page, "empty-path", 1440);
  expect(await savedSnapshot(user.id)).toEqual(before);
});
test("an empty program preserves history and does not claim all-complete", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const user = await login(page);
  await complete(page, fixture.a.id);
  const before = await savedSnapshot(user.id);
  try {
    await programVisible(false, [fixture.path.id, fixture.empty.id]);
    await page.goto("/app");
    await expect(
      page.getByRole("heading", {
        name: "No learning paths are available yet",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Review a lesson", exact: true }),
    ).toHaveCount(0);
    await capture(page, "empty-program", 360);
    expect(await savedSnapshot(user.id)).toEqual(before);
  } finally {
    await programVisible(true, [fixture.path.id, fixture.empty.id]);
  }
});
test("inactive and prepared-content boundaries have real explanations and never award XP", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const user = await login(page),
    before = await savedSnapshot(user.id);
  for (const id of [fixture.inactive.id, fixture.hidden.id]) {
    await page.goto(`/lesson/${id}`);
    await expect(
      page.getByRole("heading", { name: "This lesson is not available" }),
    ).toBeVisible();
    expect(
      (
        await page.request.post("/api/progress/complete", {
          data: { lessonId: id },
        })
      ).status(),
    ).toBe(400);
  }
  await page.goto(`/lesson/${fixture.preparing.id}`);
  await expect(
    page.getByRole("heading", { name: "This lesson is being prepared" }),
  ).toBeVisible();
  await capture(page, "content-being-prepared", 360);
  expect(await savedSnapshot(user.id)).toEqual(before);
});
test("daily goals count confirmed completions and navigation has no reward effect", async ({
  page,
}) => {
  const user = await login(page);
  await page.goto("/app");
  await expect(
    page.getByRole("button", { name: "1 lesson", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1 lesson", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "Daily learning goal" }),
  ).toHaveAttribute("value", "0");
  await complete(page, fixture.a.id);
  await page.reload();
  await expect(
    page.getByRole("progressbar", { name: "Daily learning goal" }),
  ).toHaveAttribute("value", "1");
  const before = await savedSnapshot(user.id);
  await page.goto(`/lesson/${fixture.d.id}`);
  await expect
    .poll(async () => {
      const r = await page.request.post("/api/progress/list", { data: {} });
      return (await r.json()).visits.some(
        (v: { lessonId: string }) => v.lessonId === fixture.d.id,
      );
    })
    .toBe(true);
  expect(await savedSnapshot(user.id)).toEqual(before);
  await page.goto("/app");
  await page
    .getByRole("button", { name: "No daily goal", exact: true })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Daily learning goal" }),
  ).toHaveCount(0);
});
test("network errors provide retry and do not fabricate progress or successful preferences", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  await login(page);
  await page.route("**/api/user/learning-plan", (r) =>
    r.fulfill({ status: 503, json: { ok: false } }),
  );
  await page.goto("/app");
  await expect(
    page
      .locator("[role=alert]")
      .filter({ hasText: "Your daily goal could not load" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start learning", exact: true }),
  ).toBeVisible();
  await capture(page, "goal-network-error", 360);
  await page.unroute("**/api/user/learning-plan");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "1 lesson", exact: true }),
  ).toBeVisible();
  await page.route("**/api/user/learning-plan", (r) =>
    r.request().method() === "POST"
      ? r.fulfill({ status: 500, json: { ok: false } })
      : r.continue(),
  );
  await page
    .getByRole("button", {
      name: `Keep in My paths: ${fixture.path.title}`,
      exact: true,
    })
    .click();
  await expect(
    page
      .locator("[role=alert]")
      .filter({ hasText: "Your pathway choice could not be confirmed" }),
  ).toBeVisible();
  await expect(
    page.locator("[role=status]").filter({ hasText: "is in My paths" }),
  ).toHaveCount(0);
  await page.unroute("**/api/user/learning-plan");
  await page.route("**/api/progress/list", (r) =>
    r.fulfill({ status: 500, json: { ok: false } }),
  );
  await page.goto(`/paths/${fixture.path.slug}`);
  await expect(
    page
      .locator("[role=alert]")
      .filter({ hasText: "Your progress could not load" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.locator("[data-lesson-state=unknown]")).toHaveCount(4);
  await capture(page, "path-network-error", 360);
  await page.unroute("**/api/progress/list");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "Path progress" }),
  ).toHaveAttribute("value", "0");
});
