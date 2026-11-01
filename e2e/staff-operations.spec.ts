import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { authenticator } from "../lib/staff-security";
import {
  provisionStaff,
  staffUiLogin,
  staffScreenFixture,
  manyStaffParticipants,
  unconfirmedStaff,
  disconnectStaff,
} from "./helpers/staff";
const password = "synthetic-staff-browser-password",
  evidence = process.env.STAFF_EVIDENCE_DIR,
  observations: object[] = [];
test.afterAll(async () => {
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      `${evidence}/browser-checks.json`,
      JSON.stringify(observations, null, 2),
    );
  }
  await disconnectStaff();
});
async function audit(page: Page, name: string, width: number) {
  await expect(page.locator("main")).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  observations.push({
    screen: name,
    width,
    axeViolations: 0,
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
for (const width of [360, 768, 1440])
  test(`all staff workspaces render with active scope and real empty states at ${width}px`, async ({
    page,
  }) => {
    const email = `staff-screens-${width}@example.test`;
    await provisionStaff(email, password);
    const f = await staffScreenFixture();
    await page.setViewportSize({ width, height: 900 });
    await staffUiLogin(page, email, password);
    const routes: [string, string, string][] = [
      ["/admin", "overview", "Your program workspace"],
      ["/admin/users", "participants", "Participants"],
      [
        `/admin/users/${f.user.id}`,
        "participant-detail",
        "Synthetic participant",
      ],
      ["/admin/cases", "cases", "Support cases"],
      [`/admin/cases/${f.c.id}`, "case-detail", "Synthetic support follow-up"],
      ["/admin/payouts", "payouts", "Reward requests"],
      ["/admin/finance", "finance", "Reward finance"],
      ["/admin/reports", "reports", "Program reports"],
      ["/admin/directory", "directory", "Service directory"],
      ["/admin/staff", "staff", "Program staff"],
      ["/admin/audit", "audit", "Audit trail"],
    ];
    for (const [path, name, heading] of routes) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Synthetic learning program", { exact: true }).first(),
      ).toBeAttached();
      await expect(
        page.getByRole("status").filter({ hasText: /Loading|Calculating/ }),
      ).toHaveCount(0);
      await audit(page, name, width);
    }
  });
test("caseworker saves notes and follow-up; simultaneous edit shows a conflict without losing history", async ({
  page,
  browser,
}) => {
  const f = await staffScreenFixture();
  await provisionStaff("casework-browser@example.test", password, "caseworker");
  await provisionStaff("casework-second@example.test", password, "caseworker");
  await staffUiLogin(page, "casework-browser@example.test", password);
  await page.goto(`/admin/cases/${f.c.id}`);
  await expect(page.getByLabel("New case note")).toBeVisible();
  const ctx = await browser.newContext({
      baseURL: "http://127.0.0.1:" + (process.env.E2E_PORT || "5050"),
    }),
    other = await ctx.newPage();
  await staffUiLogin(other, "casework-second@example.test", password);
  await other.goto(`/admin/cases/${f.c.id}`);
  await expect(other.getByLabel("New case note")).toBeVisible();
  await page.getByLabel("New case note").fill("First authorized staff note");
  await page
    .getByRole("button", { name: "Save authorized note", exact: true })
    .click();
  await expect(
    page.locator("main ol").getByText("First authorized staff note", { exact: true }),
  ).toBeVisible();
  await other.getByLabel("New case note").fill("Second authorized staff note");
  await other
    .getByRole("button", { name: "Save authorized note", exact: true })
    .click();
  await expect(other.locator("main").getByRole("alert")).toContainText(
    "Another staff member changed",
  );
  await other
    .getByRole("button", { name: "Reload latest case", exact: true })
    .click();
  await expect(
    other.locator("main ol").getByText("First authorized staff note", { exact: true }),
  ).toBeVisible();
  await expect(other.getByLabel("New case note")).toHaveValue(
    "Second authorized staff note",
  );
  await other
    .getByRole("button", { name: "Save authorized note", exact: true })
    .click();
  await expect(
    other.locator("main ol").getByText("Second authorized staff note", { exact: true }),
  ).toBeVisible();
  await other
    .getByRole("button", { name: "Update case and follow-up", exact: true })
    .click();
  const dialog = other.getByRole("dialog");
  await dialog.getByLabel("Status", { exact: true }).selectOption("open");
  await dialog
    .getByLabel("Assigned staff")
    .selectOption({ label: "Synthetic caseworker staff" });
  await dialog
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const denied = await other.request.get("/api/admin/staff?format=csv", {
    headers: { "x-l2e-program": "test-program" },
  });
  expect(denied.status()).toBe(403);
  await ctx.close();
});
test("server pagination, URL filters, empty results and filtered downloads stay in program scope", async ({
  page,
}) => {
  await manyStaffParticipants();
  await provisionStaff("pages-browser@example.test", password);
  await staffUiLogin(page, "pages-browser@example.test", password);
  await page.goto(
    "/admin/users?search=Paged+browser+sample&sort=name&direction=asc",
  );
  await expect(
    page.getByText("25 matching records in this program.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(21);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
  await page.reload();
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export filtered records", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain(
    "participants-program.csv",
  );
  await page
    .getByLabel("Search", { exact: true })
    .fill("No such synthetic participant");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matching records", exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("page")).toBe("1");
});
test("finance sees explicit adjustment confirmation and denied support/staff actions", async ({
  page,
}) => {
  await provisionStaff("finance-browser@example.test", password, "finance");
  await staffUiLogin(page, "finance-browser@example.test", password);
  await page.goto("/admin/finance");
  await page
    .getByLabel("Adjustment in integer cents", { exact: true })
    .fill("100");
  await page
    .getByLabel("Reason", { exact: true })
    .fill("Synthetic funding record only");
  await page
    .getByRole("button", { name: "Record pool adjustment", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Result:");
  await expect(dialog).toContainText("moves no bank funds");
  await dialog
    .getByRole("button", { name: "Confirm adjustment", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("Saved and audited. No external transfer was performed.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (
      await page.request.get("/api/admin/cases", {
        headers: { "x-l2e-program": "test-program" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin/staff");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Your role cannot open",
  );
});
test("authenticator enrollment and recovery are real browser flows; logout revokes staff entry", async ({
  page,
}) => {
  await unconfirmedStaff("enroll-browser@example.test", password);
  await page.goto("/admin/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill("enroll-browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Set up your authenticator",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show my setup key", exact: true })
    .click();
  const key = await page
    .getByLabel("Private authenticator setup key", { exact: true })
    .inputValue();
  await page
    .getByLabel("Authenticator code", { exact: true })
    .fill(authenticator(key).generate());
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Save your recovery codes",
      exact: true,
    }),
  ).toBeVisible();
  const recovery = await page.locator("main code").first().textContent();
  await page
    .getByRole("button", { name: "I saved my recovery codes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page
    .getByLabel("Email", { exact: true })
    .fill("enroll-browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use a recovery code instead", exact: true })
    .click();
  await page
    .getByLabel("Unused recovery code", { exact: true })
    .fill(recovery!);
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("program administrator completes confirmed service, staff and participant workflows with an authorized audit trail", async ({
  page,
}) => {
  await provisionStaff("operations-admin@example.test", password);
  const f = await staffScreenFixture();
  await staffUiLogin(page, "operations-admin@example.test", password);
  await page.goto("/admin/directory");
  await page.getByRole("button", { name: "Add service", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Service name", { exact: true })
    .fill("Administrator browser service");
  await dialog.getByLabel("Phone", { exact: true }).fill("211");
  await dialog
    .getByRole("button", { name: "Save service", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  let row = page
    .getByRole("row")
    .filter({ hasText: "Administrator browser service" });
  await expect(row).toBeVisible();
  await row
    .getByRole("button", {
      name: "Edit Administrator browser service",
      exact: true,
    })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Hours", { exact: true })
    .fill("Verify current hours");
  await dialog
    .getByRole("button", { name: "Save service", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(row).toContainText("Verify current hours");
  await row
    .getByRole("button", {
      name: "Remove Administrator browser service",
      exact: true,
    })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Historical service allocations");
  await dialog
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await page.goto("/admin/staff");
  await page
    .getByRole("button", { name: "Create program staff account", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Full name", { exact: true })
    .fill("Synthetic newly provisioned staff");
  await dialog
    .getByLabel("Email", { exact: true })
    .fill("new-program-staff@example.test");
  await dialog
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await expect(dialog.locator("code")).toHaveCount(1);
  await dialog
    .getByRole("button", {
      name: "I completed the private handoff",
      exact: true,
    })
    .click();
  row = page
    .getByRole("row")
    .filter({ hasText: "Synthetic newly provisioned staff" });
  await row
    .getByRole("button", { name: "Disable membership", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Other program memberships");
  await dialog
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await expect(row).toContainText("Inactive");
  await page.goto(`/admin/users/${f.user.id}`);
  await page
    .getByRole("button", { name: "Update participant", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Case number", { exact: true })
    .fill("SYNTHETIC-CASE-REVIEW");
  await dialog
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Create support case", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Case title", { exact: true })
    .fill("Administrator created synthetic case");
  await dialog
    .getByLabel("Authorized support note", { exact: true })
    .fill("Synthetic support documentation only");
  await dialog
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: /Administrator created synthetic case/ }),
  ).toBeVisible();
  await page.goto("/admin/audit?search=PROGRAM_MEMBERSHIP_REVOKED");
  await expect(page.getByRole("table")).toContainText(
    "PROGRAM_MEMBERSHIP_REVOKED",
  );
});
