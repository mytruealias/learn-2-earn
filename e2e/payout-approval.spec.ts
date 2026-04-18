import { test, expect } from "@playwright/test";
import {
  ensureTestAdmin,
  deleteUserByEmail,
  setUserXp,
  uniqEmail,
  disconnect,
} from "./helpers/seed";

const DEMO_CODE = process.env.DEMO_ACCESS_CODE || "LEARN2EARN";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "e2e-admin@learn2earn.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "e2e-admin-pw-1";

test.describe.serial("Learner payout request → admin approval → status reflected", () => {
  let learnerEmail: string;

  test.beforeAll(async () => {
    learnerEmail = uniqEmail("learner-payout");
    // Strict: prerequisite admin MUST exist with known credentials. Seed it
    // here so the test fails loudly if it can't be set up rather than
    // silently skipping branches.
    await ensureTestAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test.afterAll(async () => {
    await deleteUserByEmail(learnerEmail);
    await disconnect();
  });

  test("full payout pipeline", async ({ playwright, baseURL }) => {
    // ── Learner side ─────────────────────────────────────────────────────
    // Reuse the suite-wide baseURL (set in playwright.config.ts) so this
    // test always hits the dedicated e2e webServer and never the dev DB.
    const learnerCtx = await playwright.request.newContext({ baseURL });

    const accessRes = await learnerCtx.post("/api/access", { data: { code: DEMO_CODE } });
    expect(accessRes.status(), "demo gate").toBe(200);

    const reg = await learnerCtx.post("/api/auth/register", {
      data: { email: learnerEmail, password: "learner-pw-1", fullName: "Payout Learner" },
    });
    expect(reg.status(), "learner registered").toBe(200);

    // Grant XP directly so the test does not depend on lesson seed details
    // or per-program rule changes.
    await setUserXp(learnerEmail, 1000);

    const payoutRes = await learnerCtx.post("/api/payout/request", {
      data: { xpAmount: 60, paymentMethod: "venmo", paymentHandle: "@payout-e2e" },
    });
    expect(payoutRes.status(), "learner payout request submitted").toBe(200);
    const payoutBody = await payoutRes.json();
    const payoutId = payoutBody.payout.id as string;
    expect(payoutBody.payout.status).toBe("pending");

    await learnerCtx.dispose();

    // ── Admin side (separate request context, separate cookie jar) ──────
    const adminCtx = await playwright.request.newContext({ baseURL });

    const login = await adminCtx.post("/api/admin/login", {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(login.status(), "admin login").toBe(200);

    const review = await adminCtx.patch("/api/admin/payouts", {
      data: { payoutId, action: "review", decisionNote: "E2E review" },
    });
    expect(review.status(), "review transition").toBe(200);
    expect((await review.json()).payout.status).toBe("reviewed");

    const approve = await adminCtx.patch("/api/admin/payouts", {
      data: { payoutId, action: "approve", decisionNote: "E2E approve" },
    });
    expect(approve.status(), "approve transition").toBe(200);
    expect((await approve.json()).payout.status).toBe("approved");

    // ── Verify the new status is reflected in the admin-facing list ─────
    const list = await adminCtx.get("/api/admin/payouts?status=approved");
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    const payouts = (listBody.payouts ?? []) as Array<{ id: string; status: string }>;
    const found = payouts.find((p) => p.id === payoutId);
    expect(found, "approved payout appears in admin list").toBeTruthy();
    expect(found?.status).toBe("approved");

    await adminCtx.dispose();
  });
});
