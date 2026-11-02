import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  programFixture,
  learnerFixture,
  disconnectLearning,
} from "./helpers/learning";
import {
  lessonFixture,
  lessonEvidence,
  dueNow,
  setHearts,
  malformed,
  disconnectLesson,
} from "./helpers/lesson";
let fixture: Awaited<ReturnType<typeof lessonFixture>>;
const evidence = process.env.LESSON_EVIDENCE_DIR;
const observations: object[] = [];
test.beforeAll(async () => {
  const p = await programFixture();
  fixture = await lessonFixture(p.a.moduleId);
});
test.afterAll(async () => {
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2),
    );
  }
  await disconnectLearning();
  await disconnectLesson();
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
async function capture(page: Page, name: string, width: number) {
  expect(await page.evaluate(() => innerWidth)).toBe(width);
  const a = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(
    a.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const small = await page
    .locator(
      '[data-design] :is(button,a,summary,select,textarea,input:not([type="radio"]))',
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
            (r.width < 43.9 || r.height < 43.9)
          );
        })
        .map((e) => e.textContent?.slice(0, 50)),
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
    mkdirSync(evidence, { recursive: true });
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${evidence}/${name}-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}
async function next(page: Page) {
  await expect(page.getByRole("button", { name: "Next step", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
}
async function answer(page: Page, name: string) {
  await page.getByRole("radio", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeVisible();
}
async function finishFromQuestion(page: Page, wrong = false) {
  await answer(page, wrong ? "Everything at once" : "One small action");
  await next(page);
  await answer(page, "Check the new time");
  await next(page);
  await expect(
    page.getByRole("heading", { name: "Reflect: a next step", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("A note for yourself (optional)")
    .fill("Synthetic private reflection that must not leave this screen");
  await page
    .getByRole("button", { name: "Skip reflection", exact: true })
    .click();
  await next(page);
  await answer(page, "False");
  await next(page);
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /^(Lesson|Practice) complete$/ }),
  ).toBeVisible();
}
for (const width of [360, 768, 1440])
  test(`complete, review and practice with separated rewards at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const user = await login(page);
    await setHearts(user.id);
    const sent: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/lesson/")) sent.push(r.postData() || "");
    });
    await page.goto(`/lesson/${fixture.id}`);
    await expect(
      page.getByRole("heading", { name: "One useful step", exact: true }),
    ).toBeVisible();
    await capture(page, "teaching", width);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await next(page);
    await answer(page, "Everything at once");
    await expect(
      page.getByRole("heading", { name: "Let’s look at this together" }),
    ).toBeVisible();
    await capture(page, "helpful-feedback", width);
    await next(page);
    await answer(page, "Check the new time");
    await next(page);
    await page
      .getByRole("button", { name: "Skip reflection", exact: true })
      .click();
    await next(page);
    await answer(page, "False");
    await next(page);
    await page
      .getByRole("button", { name: "Finish lesson", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Lesson complete", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("10 XP confirmed and saved.", { exact: false }),
    ).toBeVisible();
    await capture(page, "first-completion", width);
    const before = await lessonEvidence(user.id);
    expect(before.progress).toHaveLength(1);
    expect(before.user.totalXp).toBe(10);
    expect(before.user.hearts).toBe(0);
    await dueNow(user.id);
    await page.goto("/practice");
    await expect(
      page.getByRole("heading", { name: fixture.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Review suggested now", { exact: false }),
    ).toBeVisible();
    await capture(page, "practice-due", width);
    await page
      .getByRole("button", { name: "Missed questions", exact: true })
      .click();
    await page.getByText("1 question to revisit", { exact: true }).click();
    await expect(
      page.getByText("Which step is manageable?", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: `Practice: ${fixture.title}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "One useful step", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await next(page);
    await finishFromQuestion(page);
    await expect(
      page.getByText("Your practice activity is saved.", { exact: false }),
    ).toBeVisible();
    await capture(page, "practice-completion", width);
    const after = await lessonEvidence(user.id);
    expect(after.user.totalXp).toBe(before.user.totalXp);
    expect(after.progress).toEqual(before.progress);
    expect(after.payouts).toEqual(before.payouts);
    expect(after.attempts.filter((a) => a.completedAt)).toHaveLength(2);
    expect(after.reviews[0].missedCardIds).toBe("[]");
    expect(sent.join(" ")).not.toContain("Synthetic private reflection");
    await page.goto("/practice");
    await page
      .getByRole("button", { name: "Topic practice", exact: true })
      .click();
    await expect(
      page.locator('section[aria-label="Learning and practice totals"]'),
    ).toContainText("1 completed practice session");
    await expect(
      page.getByRole("heading", { name: fixture.title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Topic", exact: true })
      .selectOption(fixture.moduleId);
    await expect(
      page.getByRole("heading", { name: fixture.title, exact: true }),
    ).toBeVisible();
  });
test("interruption resumes answers, keyboard choices and optional notes remain private", async ({
  page,
}) => {
  const user = await login(page);
  await page.setViewportSize({ width: 360, height: 1000 });
  await page.goto(`/lesson/${fixture.id}`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await next(page);
  await page
    .getByRole("radio", { name: "One small action", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await page
    .getByRole("button", { name: "Check answer", exact: true })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "That’s right", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "That’s right", exact: true }),
  ).toBeVisible();
  await next(page);
  await answer(page, "Check the new time");
  await next(page);
  await page
    .getByLabel("A note for yourself (optional)")
    .fill("Synthetic private reflection");
  await page.reload();
  await expect(page.getByLabel("A note for yourself (optional)")).toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "Exit lesson", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Take a break?" }),
  ).toContainText("Unchecked selections and personal notes are not saved");
  await page
    .getByRole("button", { name: "Keep learning", exact: true })
    .click();
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await capture(page, "reflection-text-200", 360);
  const record = await lessonEvidence(user.id);
  expect(record.attempts[0].answers).toHaveLength(3);
  expect(record.progress).toEqual([]);
  expect(record.user.totalXp).toBe(0);
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page
    .getByRole("button", { name: "Skip reflection", exact: true })
    .click();
  await next(page);
  await answer(page, "False");
  await next(page);
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lesson complete", exact: true }),
  ).toBeVisible();
  const finished = await lessonEvidence(user.id);
  expect(finished.progress).toHaveLength(1);
  expect(finished.user.totalXp).toBe(14);
});
test("failed saves, content issues, expired sessions and switched accounts recover honestly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.goto(`/lesson/${fixture.id}`);
  await page.route("**/api/lesson/answer", (r) => r.abort());
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await capture(page, "failed-save", 1440);
  await page.unroute("**/api/lesson/answer");
  await page
    .getByRole("button", { name: "Reload saved place", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "One useful step", exact: true }),
  ).toBeVisible();
  await page.request.delete("/api/auth/session");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "session ended",
  );
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  const b = await login(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One useful step", exact: true }),
  ).toBeVisible();
  expect((await lessonEvidence(b.id)).progress).toEqual([]);
  await malformed(fixture.id, true);
  try {
    await page.reload();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "content check",
    );
    await capture(page, "content-issue", 1440);
  } finally {
    await malformed(fixture.id, false);
  }
});
test("practice empty/error views and saved timezone settings have real outcomes", async ({
  page,
}) => {
  await login(page);
  await page.goto("/practice");
  await expect(
    page.getByRole("heading", { name: "Practice grows with your learning" }),
  ).toBeVisible();
  await page.getByLabel("Timezone (IANA name)").fill("America/Chicago");
  await page
    .getByRole("button", { name: "Save timezone", exact: true })
    .click();
  await expect(page.getByRole("status").filter({ hasText: "Timezone saved:" })).toContainText(
    "Timezone saved: America/Chicago",
  );
  await page.reload();
  await expect(page.getByLabel("Timezone (IANA name)")).toHaveValue(
    "America/Chicago",
  );
  await page.route("**/api/practice", (r) =>
    r.fulfill({ status: 503, json: { error: { message: "Unavailable" } } }),
  );
  await page.reload();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Your practice could not load",
  );
  await page.unroute("**/api/practice");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice grows with your learning" }),
  ).toBeVisible();
});

test("a lost completion response retries the same saved receipt without a second credit", async ({
  page,
}) => {
  const user = await login(page);
  await page.goto(`/lesson/${fixture.id}`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await next(page);
  await answer(page, "One small action");
  await next(page);
  await answer(page, "Check the new time");
  await next(page);
  await page
    .getByRole("button", { name: "Skip reflection", exact: true })
    .click();
  await next(page);
  await answer(page, "False");
  await next(page);
  await page.route("**/api/progress/complete", async (route) => {
    const saved = await route.fetch();
    expect(saved.ok()).toBe(true);
    await route.abort();
  });
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "could not be confirmed",
  );
  await expect(
    page.getByRole("heading", { name: "Lesson complete", exact: true }),
  ).toHaveCount(0);
  const before = await lessonEvidence(user.id);
  expect(before.progress).toHaveLength(1);
  expect(before.user.totalXp).toBe(14);
  await page.unroute("**/api/progress/complete");
  await page
    .getByRole("button", { name: "Try saving again", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lesson complete", exact: true }),
  ).toBeVisible();
  const after = await lessonEvidence(user.id);
  expect(after.user.totalXp).toBe(before.user.totalXp);
  expect(after.progress).toEqual(before.progress);
});
