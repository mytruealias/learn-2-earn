import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const evidence =
    process.env.MARKETING_EVIDENCE_DIR ||
    "docs/partner-website/screenshots/after",
  observations: object[] = [];
test.afterAll(() => {
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    `${evidence}/checks.json`,
    JSON.stringify(observations, null, 2) + "\n",
  );
});
async function audit(page: Page, name: string, width: number) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(
    result.violations.map((v) => ({
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
      '[data-design="marketing"] :is(button,a,input:not([type=checkbox]):not([type=radio]),select,textarea,summary)',
    )
    .evaluateAll((els) =>
      els
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
        .map((e) => e.tagName + ":" + e.textContent?.slice(0, 35)),
    );
  expect(small).toEqual([]);
  observations.push({
    screen: name,
    width,
    axeViolations: 0,
    noOverflow: true,
    targetsAtLeast44: true,
  });
  mkdirSync(evidence, { recursive: true });
  await page.screenshot({
    path: `${evidence}/${name}-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
for (const width of [360, 390, 768, 1440])
  test(`partner home, public templates and gated deck at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 950 });
    const privateCalls: string[] = [];
    page.on("request", (r) => {
      if (
        /\/api\/(auth|user|progress|payout|admin|support|lesson)/.test(r.url())
      )
        privateCalls.push(r.url());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Learning with support",
    );
    await expect(
      page.getByText("Online intake is not enabled yet", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/published curriculum is temporarily unavailable/),
    ).toBeVisible();
    await audit(page, "home", width);
    for (const [path, name, heading] of [
      ["/demo", "demo", "A small step, tried together."],
      ["/privacy", "privacy", "What is recorded."],
      ["/terms", "terms", "Clear expectations."],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        heading,
      );
      await audit(page, name, width);
    }
    expect(privateCalls).toEqual([]);
    await page.goto("/austin");
    await expect(page).toHaveURL(/\/austin\/unlock/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Access required",
    );
    await audit(page, "city-unlock", width);
    await page.getByLabel("Access PIN").fill("1234");
    await page
      .getByRole("button", { name: "Unlock deck", exact: true })
      .click();
    await expect(page).toHaveURL(/\/austin$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "A supported-learning pilot",
    );
    await audit(page, "city-deck", width);
  });
test("sample uses shared teaching/questions/reflection with keyboard feedback, retry and no real writes", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) calls.push(r.url());
  });
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Continue sample", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("radio", {
      name: "Wait until every problem can be solved at once",
      exact: true,
    })
    .focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("main").getByRole("status")).toContainText(
    "A different approach",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByLabel("A note for yourself (optional)")).toBeVisible();
  await page
    .getByLabel("A note for yourself (optional)")
    .fill("Synthetic note for privacy test");
  await page
    .getByRole("button", {
      name: "Finish sample (reflection optional)",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "One small step, explored.",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("Synthetic note");
  await page
    .getByRole("button", { name: "Try the sample again", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Make room for one small step",
      exact: true,
    }),
  ).toBeVisible();
  expect(calls).toEqual([]);
});
const configuration = {
  configured: true,
  team: "Synthetic reviewed intake team",
  monitoring: "Weekdays 09:00–17:00 UTC; no response time guaranteed",
};
async function configuredForm(page: Page) {
  await page.route("**/api/partner-inquiries", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({ json: configuration });
    else await route.continue();
  });
  await page.goto("/#contact");
  await expect(
    page.getByText("Synthetic reviewed intake team", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Synthetic contact");
  await page
    .getByLabel("Organization", { exact: true })
    .fill("Synthetic community program");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("person@example.test");
  await page.getByLabel(/I agree to share/).check();
}
test("inquiry UI shows only acknowledged storage, preserves retry intent and does not claim delivery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await configuredForm(page);
  const keys: string[] = [];
  let attempt = 0;
  await page.route("**/api/partner-inquiries", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: configuration });
    keys.push(route.request().postDataJSON().requestKey);
    if (attempt++ === 0) return route.abort("connectionreset");
    return route.fulfill({
      json: {
        receipt: {
          reference: "SYNTHETIC-RECEIPT",
          savedAt: "2026-11-01T12:00:00.000Z",
          state: "saved",
          notificationSent: false,
          bookingCreated: false,
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Save partner inquiry", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inquiry saved to the intake queue" }),
  ).toHaveCount(0);
  await audit(page, "inquiry-uncertain", 390);
  await page
    .getByRole("button", { name: "Retry unchanged inquiry", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inquiry saved to the intake queue" }),
  ).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  await expect(
    page.getByRole("status").filter({ hasText: "SYNTHETIC-RECEIPT" }),
  ).toContainText("No email was sent");
  await audit(page, "inquiry-saved", 390);
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...sessionStorage, ...localStorage }),
  );
  expect(stored).not.toContain("person@example.test");
  expect(stored).not.toContain("Synthetic community program");
});
test("invalid fields can be corrected after a definitive server validation error", async ({
  page,
}) => {
  await configuredForm(page);
  await page.route("**/api/partner-inquiries", (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: {
          message: "Check the organization name.",
          fields: { organization: ["Use your organization name."] },
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Save partner inquiry", exact: true })
    .click();
  await expect(page.getByLabel("Organization", { exact: true })).toBeEnabled();
  await expect(
    page.getByLabel("Organization", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page
    .getByLabel("Organization", { exact: true })
    .fill("Corrected synthetic organization");
});
test("mobile navigation, cross-page anchors, 200% text and reduced motion remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 950 });
  await page.goto("/privacy");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#public-content")).toBeFocused();
  await page.getByRole("button", { name: "Menu", exact: true }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Website navigation",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await dialog.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/\/#how-it-works$/);
  await expect(dialog).not.toBeVisible();
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await audit(page, "home-text-200", 360);
  // Verify the device preference and resulting styles explicitly after the visual audit.
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const animated = await page
    .locator("main button")
    .first()
    .evaluate((e) =>
      getComputedStyle(e)
        .transitionDuration.split(",")
        .some((v) => parseFloat(v) > 0.01),
    );
  expect(animated).toBe(false);
});
test("all city decks remain gated, have noindex and produce readable print documents", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const slug of [
    "austin",
    "dallas",
    "houston",
    "denver",
    "los-angeles",
    "san-francisco",
  ]) {
    await page.context().clearCookies();
    await page.goto(`/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/${slug}/unlock`));
    expect(
      (
        await page.request.post(`/api/city-access/${slug}`, {
          data: { pin: slug === "austin" ? "1234" : "9999" },
        })
      ).ok(),
    ).toBe(true);
    await page.goto(`/${slug}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("header").first()).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to content" })).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.pdf({
      path: `${evidence}/discussion-${slug}.pdf`,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });
    await page.emulateMedia({ media: "screen" });
  }
  const site = await page.request.get("/sitemap.xml");
  const xml = await site.text();
  expect(xml).toContain("https://learn2earn.example/demo");
  expect(xml).not.toContain("/austin");
  const og = await page.request.get("/opengraph-image");
  expect(og.ok()).toBe(true);
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("navigation, public metadata and legal links resolve without private records", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Learn2Earn/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://learn2earn.example");
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema || "{}")["@type"]).toBe("WebSite");
  expect(schema).not.toMatch(/NGO|foundingDate|aggregateRating|Nonprofit/);
  const hrefs = await page.locator("header a, footer a").evaluateAll(els => [...new Set(els.map(e => e.getAttribute("href") || ""))]);
  expect(hrefs.every(h => h.startsWith("/"))).toBe(true);
  for (const href of hrefs) {
    if (href.startsWith("/#")) {
      expect(await page.locator(`[id="${href.slice(2)}"]`).count()).toBe(1);
    } else if (href !== "/login") {
      // Learner sign-in imports the generated Prisma client; it has a separate infrastructure gate below.
      const response = await page.request.get(href);
      expect(response.ok(), href).toBe(true);
    }
  }
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /austin");
  await page.goto("/demo");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://learn2earn.example/demo");
  await page.getByRole("link", { name: "Learn2Earn home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});


test("learner sign-in destination resolves with the generated client", async ({ page }) => {
  test.skip(!existsSync("node_modules/.prisma/client/schema.prisma"), "Infrastructure blocked: pinned Prisma client generation requires the engine checksum download currently returning proxy HTTP 403.");
  const response = await page.request.get("/login");
  expect(response.ok()).toBe(true);
});
