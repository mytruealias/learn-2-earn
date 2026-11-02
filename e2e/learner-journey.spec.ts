import { completeLesson } from "./helpers/lesson";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  accountCount,
  disconnect,
  expireLearnerSessions,
  journeyLesson,
  guestRecord,
  learnerRecord,
} from "./helpers/seed";
const password = "synthetic-journey-password";
const code = process.env.DEMO_ACCESS_CODE || "LEARN2EARN";
const evidence = process.env.JOURNEY_EVIDENCE_DIR;
const observations: object[] = [];
let sequence = 0;
const email = () => `journey-${Date.now()}-${sequence++}@example.test`;
test.afterAll(async () => {
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2) + "\n",
    );
  }
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
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  const outside = await page
    .locator("[data-design] :is(h1,h2,input,select,button,a)")
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return (
            box.width &&
            box.height &&
            !el.closest("[inert]") &&
            !el.classList.contains("ds-skip-link") &&
            (box.left < -2 || box.right > innerWidth + 2)
          );
        })
        .map((el) => el.tagName + ":" + el.textContent?.trim().slice(0, 35)),
    );
  expect(outside).toEqual([]);
  const small = await page
    .locator("[data-design] :is(button,a,input,select)")
    .evaluateAll((elements) =>
      elements
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return (
            box.width &&
            box.height &&
            !el.closest("[inert]") &&
            !el.classList.contains("ds-skip-link") &&
            (box.width < 43.9 || box.height < 43.9)
          );
        })
        .map((el) => el.tagName + ":" + el.textContent?.trim().slice(0, 35)),
    );
  expect(small).toEqual([]);
}
async function capture(page: Page, screen: string, width: number) {
  const heading: Record<string, string> = {
    access: "Welcome to Learn2Earn",
    signup: "Create your account",
    welcome: "Small steps, at your pace",
    "privacy-pace": "Your privacy and your pace",
    "learner-home": "Learn at your pace",
    "signed-out": "Welcome back",
    "guest-home": "Learn at your pace",
    "expired-session": "Welcome back",
    "interrupted-signup": "Create your account",
    "account-recovery": "Help signing in",
  };
  if (heading[screen])
    await expect(
      page.getByRole("heading", { name: heading[screen], exact: true }),
    ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await audit(page);
  observations.push({
    screen,
    width,
    axeViolations: 0,
    targetsAtLeast44: true,
    noOverflow: true,
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
async function invitation(page: Page) {
  await page.goto("/access");
  await page.getByLabel("Program access code").fill(code);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Create an account", exact: true }),
  ).toBeVisible();
}
async function credentials(page: Page, address: string, signup = false) {
  await expect(
    page.getByRole("heading", {
      name: signup ? "Create your account" : "Welcome back",
      exact: true,
    }),
  ).toBeVisible();
  if (signup)
    await page.getByLabel("Name you use").fill("Synthetic journey learner");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", {
      name: signup ? "Create account" : "Sign in",
      exact: true,
    })
    .click();
}
async function welcome(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Small steps, at your pace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next: privacy and pace" }).click();
  await page.getByLabel("Learning goal (optional)").selectOption("short");
  await page
    .getByRole("button", { name: "Start learning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Learn at your pace", exact: true }),
  ).toBeVisible();
}
for (const width of [360, 768, 1440]) {
  test(`access, signup, welcome, learner home, logout and re-entry at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/app");
    await expect(page).toHaveURL(/\/access\?/);
    const helpLink = page.getByRole("link", { name: "Help", exact: true });
    await helpLink.focus();
    expect(
      await helpLink.evaluate((el) =>
        parseFloat(getComputedStyle(el).outlineWidth),
      ),
    ).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Program access code")).toBeFocused();
    await capture(page, "access", width);
    await page.getByLabel("Program access code").fill("not-the-code");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator("[data-design] [role=alert]")).toContainText(
      "Invalid access code",
    );
    await page.getByLabel("Program access code").fill(code);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByRole("link", { name: "Create an account", exact: true })
      .click();
    await capture(page, "signup", width);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await audit(page);
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page.getByLabel("Name you use")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("Name you use")).toBeFocused();
    await audit(page);
    const address = email();
    await credentials(page, address, true);
    await expect(page).toHaveURL(/\/onboarding\?/);
    await capture(page, "welcome", width);
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/onboarding\?/);
    expect(await accountCount(address)).toBe(1);
    await page.getByRole("button", { name: "Next: privacy and pace" }).click();
    await expect(
      page.getByRole("heading", { name: "Choose what to share", exact: true }),
    ).toBeFocused();
    await capture(page, "privacy-pace", width);
    await page.getByLabel("Learning goal (optional)").selectOption("short");
    await page
      .getByRole("button", { name: "Start learning", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Learn at your pace", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Your optional goal: Make time for a short lesson."),
    ).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(
      nav.getByRole("link", { name: "Learn", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: "Practice", exact: true }),
    ).toHaveAttribute("href", "/practice");
    await capture(page, "learner-home", width);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "200%"),
    );
    await audit(page);
    observations.push({
      screen: "learner-home",
      width,
      rootTextSize: "200%",
      axeViolations: 0,
      noOverflow: true,
    });
    if (evidence && width === 360)
      await page.screenshot({
        path: `${evidence}/learner-home-360-text-200.png`,
        animations: "disabled",
      });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await nav.getByRole("link", { name: "Rewards", exact: true }).click();
    await expect(page).toHaveURL(/\/profile\?tab=earnings$/);
    await expect(
      page.getByRole("heading", {
        name: "Current program terms",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "No reward requests yet. Learning stays available whether you request a reward or not.",
      ),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Rewards", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    if (width === 360) {
      await expect(
        page.getByRole("button", { name: "Review request", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Profile", exact: true })
        .click();
      await page.getByRole("button", { name: "Info", exact: true }).click();
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      const name = page.getByLabel("Full Name", { exact: true });
      await name.focus();
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport!, "height", {
          configurable: true,
          get: () => window.innerHeight - 300,
        });
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
      await expect(page.locator("[data-keyboard-open]")).toHaveCount(1);
      expect(
        await page
          .getByRole("navigation", { name: "Primary" })
          .evaluate((el) => getComputedStyle(el).position),
      ).toBe("static");
      await name.scrollIntoViewIfNeeded();
      const help = page
        .locator("[data-learner-shell] header")
        .first()
        .getByRole("link", { name: "Help", exact: true });
      expect(
        await help.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight;
        }),
      ).toBe(true);
      await page.evaluate(() => {
        delete (window.visualViewport as unknown as { height?: number }).height;
        window.visualViewport!.dispatchEvent(new Event("resize"));
      });
    }
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
    await capture(page, "signed-out", width);
    const noSession = await page.request.post("/api/auth/session", {
      data: {},
    });
    expect(noSession.status()).toBe(401);
    await credentials(page, address);
    await expect(page).toHaveURL(/\/app$/);
    expect(await accountCount(address)).toBe(1);
    expect(
      await page.evaluate(() => localStorage.getItem("l2e_logged_in")),
    ).toBeNull();
  });
}
test("guest lesson progress is associated only by the server session, then survives signup and login", async ({
  page,
  playwright,
  baseURL,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const fixture = await journeyLesson();
  await invitation(page);
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const guest = (await (await page.request.get("/api/auth/session")).json())
    .user;
  expect(guest.kind).toBe("guest");
  await capture(page, "guest-home", 360);
  await page.goto(`/lesson/${fixture.lessonId}`);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.post("/api/auth/session", { data: {} })
          ).json()
        ).user.lessonsCompleted,
    )
    .toBe(1);
  const before = (
    await (await page.request.post("/api/auth/session", { data: {} })).json()
  ).user;
  const oldCookie = (await page.context().cookies()).find(
    (c) => c.name === "l2e_user_session",
  )!;
  await page.goto("/signup");
  await expect(page.getByRole("status")).toContainText(
    "Your guest learning will stay with this account",
  );
  const address = email();
  let arbitraryIdentitySent = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/register")) {
      const data = request.postDataJSON();
      arbitraryIdentitySent = "guestId" in data || "userId" in data;
    }
  });
  await credentials(page, address, true);
  await welcome(page);
  expect(arbitraryIdentitySent).toBe(false);
  const after = (
    await (await page.request.post("/api/auth/session", { data: {} })).json()
  ).user;
  expect(after.id).toBe(guest.id);
  expect(after.totalXp).toBe(before.totalXp);
  expect(after.lessonsCompleted).toBe(1);
  const copy = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { cookie: `${oldCookie.name}=${oldCookie.value}` },
  });
  expect((await copy.post("/api/auth/session", { data: {} })).status()).toBe(
    401,
  );
  await copy.dispose();
  expect(
    (await learnerRecord(address))?.progress.some(
      (p) => p.lessonId === fixture.lessonId,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
  await credentials(page, address);
  await expect(page).toHaveURL(/\/app$/);
  expect(
    (await (await page.request.post("/api/auth/session", { data: {} })).json())
      .user.totalXp,
  ).toBe(before.totalXp);
});
test("expired and forged local state cannot expose a profile or create a replacement guest", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const address = email();
  await invitation(page);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await credentials(page, address, true);
  await welcome(page);
  const user = await learnerRecord(address);
  expect(user).not.toBeNull();
  await expireLearnerSessions(user!.id);
  await page.evaluate((id) => {
    localStorage.setItem("l2e_user_id", id);
    localStorage.setItem("l2e_logged_in", "true");
  }, user!.id);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  await expect(page.getByRole("status")).toContainText("Your session ended");
  await capture(page, "expired-session", 360);
  expect(
    (await page.request.post("/api/user/ensure", { data: {} })).status(),
  ).toBe(401);
  expect(
    (await page.request.post("/api/auth/session", { data: {} })).status(),
  ).toBe(401);
  await credentials(page, address);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByRole("heading", {
      name: "Synthetic journey learner",
      exact: true,
    }),
  ).toBeVisible();
  expect(await accountCount(address)).toBe(1);
});
test("slow interrupted signup reports uncertainty and resumes the one committed account", async ({
  page,
  playwright,
  baseURL,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  await invitation(page);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  const address = email();
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/auth/register", async (route) => {
    await held;
    const isolated = await playwright.request.newContext({
      baseURL,
      storageState: await page.context().storageState(),
    });
    const response = await isolated.post("/api/auth/register", {
      data: route.request().postDataJSON(),
    });
    expect(response.ok()).toBe(true);
    await isolated.dispose();
    await route.abort("failed");
  });
  await credentials(page, address, true);
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("taking longer", {
    timeout: 8000,
  });
  release();
  await expect(page.locator("[data-design] [role=alert]")).toContainText(
    "could not confirm whether your account was created",
  );
  expect(await accountCount(address)).toBe(1);
  await capture(page, "interrupted-signup", 360);
  await page.unroute("**/api/auth/register");
  await page
    .getByRole("link", { name: "Check whether my account was created" })
    .click();
  await credentials(page, address);
  await welcome(page);
  expect(await accountCount(address)).toBe(1);
});
test("existing account and invalid sign-in offer recovery without fabricated delivery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const address = email();
  expect(
    (await page.request.post("/api/access", { data: { code } })).ok(),
  ).toBe(true);
  expect(
    (
      await page.request.post("/api/auth/register", {
        data: {
          fullName: "Synthetic returning learner",
          email: address,
          password,
        },
      })
    ).ok(),
  ).toBe(true);
  expect((await page.request.delete("/api/auth/session")).ok()).toBe(true);
  await invitation(page);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await credentials(page, address, true);
  await expect(page.locator("[data-design] [role=alert]")).toContainText(
    "already exists",
  );
  await page
    .getByRole("link", { name: "Already have an account? Sign in" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("[data-design] [role=alert]")).toContainText(
    "Invalid email or password",
  );
  await page.getByRole("link", { name: "Help signing in" }).click();
  await expect(
    page.getByRole("heading", { name: "Help signing in" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This site does not currently send password-reset emails or texts. No recovery message has been sent.",
    ),
  ).toBeVisible();
  expect(await page.locator("input").count()).toBe(0);
  await capture(page, "account-recovery", 360);
});
test("redirects stay local, help remains public, and public previews never request private identity", async ({
  page,
}) => {
  const privateRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(auth\/session|progress|payout)/.test(request.url()))
      privateRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(privateRequests).toEqual([]);
  await page.goto("/lifeline");
  await expect(page.getByRole("link", { name: /988/ }).first()).toBeVisible();
  await page.goto("/access?next=https://untrusted.example/");
  await page.getByLabel("Program access code").fill(code);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const response = await page.request.get("/app");
  expect(response.headers()["cache-control"]).toContain("no-store");
});
test("failed session read is retryable and does not show a false empty learner home", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  await invitation(page);
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  await expect(
    page.getByRole("heading", { name: "Learn at your pace", exact: true }),
  ).toBeVisible();
  await page.route("**/api/auth/session", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 503,
          json: { error: { message: "Synthetic unavailable" } },
        })
      : route.continue(),
  );
  await page.reload();
  await expect(page.locator("[data-design] [role=alert]")).toContainText(
    "could not check your session",
  );
  await expect(
    page.getByRole("heading", { name: "Learn at your pace", exact: true }),
  ).toHaveCount(0);
  await capture(page, "session-read-error", 360);
  await page.unroute("**/api/auth/session");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learn at your pace", exact: true }),
  ).toBeVisible();
});

test("guest sign out explains continuity, preserves the session on failure, and confirms real logout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  await invitation(page);
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  const signOut = page.getByRole("button", { name: "Sign out", exact: true });
  await signOut.click();
  const dialog = page.getByRole("dialog", { name: "Keep your guest progress" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Create an account", exact: true }),
  ).toBeVisible();
  await capture(page, "guest-signout", 360);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(signOut).toBeFocused();
  await page.route("**/api/auth/session", (route) =>
    route.request().method() === "DELETE"
      ? route.fulfill({ status: 503, json: { ok: false } })
      : route.continue(),
  );
  await signOut.click();
  await dialog
    .getByRole("button", { name: "Sign out of guest session", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "could not be confirmed",
  );
  expect(
    (await (await page.request.get("/api/auth/session")).json()).user.kind,
  ).toBe("guest");
  await page.unroute("**/api/auth/session");
  await dialog
    .getByRole("button", { name: "Sign out of guest session", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?reason=signed-out$/);
  expect(
    (await (await page.request.get("/api/auth/session")).json()).user,
  ).toBeNull();
});

test("a shared device can deliberately start separately after expiry without deleting guest history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 1000 });
  const fixture = await journeyLesson();
  await invitation(page);
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  await expect(
    page.getByRole("heading", { name: "Learn at your pace", exact: true }),
  ).toBeVisible();
  const old = (await (await page.request.get("/api/auth/session")).json()).user;
  expect((await completeLesson(page.request, fixture.lessonId)).ok()).toBe(
    true,
  );
  const before = await guestRecord(old.id);
  await expireLearnerSessions(old.id);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  await page
    .getByRole("button", { name: "Use a different account", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Clear this device’s sign-in?",
  });
  await expect(dialog).toContainText(
    "Saved accounts, progress and balances are not deleted.",
  );
  await capture(page, "shared-device-reset", 360);
  await dialog
    .getByRole("button", { name: "Clear sign-in on this device", exact: true })
    .click();
  await expect(page).toHaveURL(/\/access\?/);
  await page.getByLabel("Program access code").fill(code);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Explore as a guest" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const fresh = (await (await page.request.get("/api/auth/session")).json())
    .user;
  expect(fresh.id).not.toBe(old.id);
  expect(await guestRecord(old.id)).toEqual(before);
});
