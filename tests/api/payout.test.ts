import { execFileSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import prisma from "@/lib/prisma";
import { createUserSession } from "@/lib/user-session";
import { POST as request } from "@/app/api/payout/request/route";
import { POST as cancel } from "@/app/api/payout/cancel/route";
import { PATCH as decide, GET as list } from "@/app/api/admin/payouts/route";
import { POST as details } from "@/app/api/admin/payouts/[payoutId]/payment-details/route";
import { GET as rewards } from "@/app/api/rewards/route";
import { POST as pool } from "@/app/api/admin/finance/pool/route";
import { PUT as configUpdate } from "@/app/api/admin/finance/payout-config/route";
import { POST as assign } from "@/app/api/admin/rewards/program/route";
import { PATCH as correct } from "@/app/api/admin/users/[userId]/route";
import { backfillRewards, reconciliationPlan } from "@/lib/rewards/accounting";
import { financeData } from "@/lib/rewards/finance";
import { clearDb, createUser, createAdmin } from "../helpers/factories";
import { makeRequest } from "../helpers/request";
import { reconcileFixtures } from "../helpers/rewards";
import { assertTestDatabase } from "@/lib/test-database-safety";
function req(path: string, token: string, body?: unknown, staff = false) {
  return makeRequest(`http://test/api/${path}`, {
    body,
    cookies: { [staff ? "l2e_admin_session" : "l2e_user_session"]: token },
  });
}
async function actor(xp = 1000) {
  const { user } = await createUser({ totalXp: xp });
  return { user, token: await createUserSession(user.id) };
}
async function staff(role = "admin") {
  const { admin } = await createAdmin({ role });
  const token = randomUUID();
  await prisma.adminSession.create({
    data: {
      token,
      adminId: admin.id,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return { admin, token };
}
async function quote(token: string) {
  const r = await rewards(req("rewards", token));
  expect(r.ok).toBe(true);
  return r.json();
}
async function payload(token: string, xp = 100) {
  return {
    requestKey: randomUUID(),
    ruleVersion: (await quote(token)).rules.version,
    xpAmount: xp,
    paymentMethod: "venmo",
    paymentHandle: "@synthetic-private",
  };
}
async function makePayout(a: Awaited<ReturnType<typeof actor>>, xp = 100) {
  const body = await payload(a.token, xp);
  const r = await request(req("payout/request", a.token, body));
  expect(r.status).toBe(200);
  return (await r.json()).payout;
}
async function decision(
  token: string,
  payoutId: string,
  action: string,
  extra: object = {},
) {
  return decide(
    req(
      "admin/payouts",
      token,
      {
        payoutId,
        action,
        requestKey: randomUUID(),
        decisionNote: "Synthetic decision",
        ...extra,
      },
      true,
    ),
  );
}
async function snapshot() {
  return {
    accounts: await prisma.rewardAccount.findMany({
      orderBy: { userId: "asc" },
    }),
    requests: await prisma.payoutRequest.findMany({ orderBy: { id: "asc" } }),
    entries: await prisma.rewardEntry.findMany({ orderBy: { id: "asc" } }),
    pool: await prisma.poolBalance.findMany(),
    adjustments: await prisma.poolAdjustment.findMany(),
  };
}
describe("auditable reward reservations and exact manual payments", () => {
  beforeEach(clearDb);
  it("requires signed identity and strict terms/idempotency fields", async () => {
    expect(
      (
        await request(
          makeRequest("http://test/api/payout/request", { body: {} }),
        )
      ).status,
    ).toBe(401);
    const a = await actor();
    await reconcileFixtures();
    const p = await payload(a.token);
    for (const body of [
      { ...p, userId: "other" },
      { ...p, xpAmount: -1 },
      { ...p, ruleVersion: undefined },
      { ...p, requestKey: undefined },
    ])
      expect((await request(req("payout/request", a.token, body))).status).toBe(
        400,
      );
  });
  it("requires reviewed legacy initialization and preserves old XP differences explicitly", async () => {
    const a = await actor();
    const p = await payload(a.token);
    expect((await request(req("payout/request", a.token, p))).status).toBe(409);
    const plan = await prisma.$transaction((tx) => reconciliationPlan(tx));
    expect(plan.adjustmentAccounts).toBe(1);
    await expect(
      prisma.$transaction((tx) => backfillRewards(tx, plan.hash, false)),
    ).rejects.toThrow();
    await reconcileFixtures();
    expect((await quote(a.token)).lifetimeXp).toBe(1000);
    expect(
      (
        await prisma.rewardAccount.findUniqueOrThrow({
          where: { userId: a.user.id },
        })
      ).openingAdjustmentXp,
    ).toBe(1000);
  });
  it("serializes concurrent requests against available entitlement", async () => {
    const a = await actor(100);
    await reconcileFixtures();
    const first = await payload(a.token, 80),
      second = { ...first, requestKey: randomUUID() };
    const rows = await Promise.all([
      request(req("payout/request", a.token, first)),
      request(req("payout/request", a.token, second)),
    ]);
    expect(rows.map((r) => r.status).sort()).toEqual([200, 400]);
    const q = await quote(a.token);
    expect(q).toMatchObject({
      availableXp: 20,
      reservedXp: 80,
      lifetimeXp: 100,
    });
    expect(await prisma.payoutRequest.count()).toBe(1);
  });
  it("serializes rolling cap boundaries independently of balance", async () => {
    const a = await actor(1000);
    await reconcileFixtures();
    const body = await payload(a.token, 300);
    const rows = await Promise.all([
      request(req("payout/request", a.token, body)),
      request(
        req("payout/request", a.token, { ...body, requestKey: randomUUID() }),
      ),
    ]);
    expect(rows.map((r) => r.status).sort()).toEqual([200, 400]);
    await makePayout(a, 200);
    expect((await quote(a.token)).weeklyRemaining).toBe(0);
    expect(
      (
        await request(
          req("payout/request", a.token, await payload(a.token, 20)),
        )
      ).status,
    ).toBe(400);
  });
  it("makes timeout-style request replays idempotent and rejects altered key reuse", async () => {
    const a = await actor();
    await reconcileFixtures();
    const body = await payload(a.token);
    const rows = await Promise.all(
      Array.from({ length: 4 }, () =>
        request(req("payout/request", a.token, body)),
      ),
    );
    expect(rows.every((r) => r.ok)).toBe(true);
    expect(await prisma.payoutRequest.count()).toBe(1);
    expect((await quote(a.token)).availableXp).toBe(900);
    expect(
      (
        await request(
          req("payout/request", a.token, { ...body, xpAmount: 200 }),
        )
      ).status,
    ).toBe(409);
  });
  it("snapshots rule terms and rejects stale new quotes after a rate change", async () => {
    const c = await prisma.payoutConfig.create({
        data: {
          programSlug: "default",
          programName: "Synthetic program",
          xpToDollar: 0.05,
          rateExact: "0.05",
        },
      }),
      a = await actor(),
      f = await staff();
    await reconcileFixtures();
    const oldBody = await payload(a.token);
    const p = await makePayout(a);
    const updated = await configUpdate(
      req(
        "admin/finance/payout-config",
        f.token,
        {
          id: c.id,
          version: c.version,
          programName: c.programName,
          xpToDollar: "0.10",
          minimumXp: 20,
          weeklyXpCap: 500,
          methods: ["venmo"],
          separateApprover: false,
          manualWorkflowConfirmed: true,
          isActive: true,
        },
        true,
      ),
    );
    expect(updated.status).toBe(200);
    expect(
      (await request(req("payout/request", a.token, oldBody))).status,
    ).toBe(409);
    expect(
      (await prisma.payoutRequest.findUniqueOrThrow({ where: { id: p.id } }))
        .amountCents,
    ).toBe(500);
    expect(
      JSON.parse(
        (await prisma.payoutRequest.findUniqueOrThrow({ where: { id: p.id } }))
          .rulesSnapshot!,
      ).rate,
    ).toBe("0.05");
  });
  it("releases rejection exactly once, restores cap room and preserves lifetime XP", async () => {
    const a = await actor(),
      f = await staff();
    await reconcileFixtures();
    const p = await makePayout(a, 500);
    const body = {
      payoutId: p.id,
      action: "reject",
      decisionNote: "Synthetic rejection",
      requestKey: randomUUID(),
    };
    const rows = await Promise.all([
      decide(req("admin/payouts", f.token, body, true)),
      decide(req("admin/payouts", f.token, body, true)),
    ]);
    expect(rows.every((r) => r.ok)).toBe(true);
    expect(await quote(a.token)).toMatchObject({
      availableXp: 1000,
      reservedXp: 0,
      lifetimeXp: 1000,
      weeklyRemaining: 500,
    });
    expect((await decision(f.token, p.id, "reject")).status).toBe(409);
  });
  it("cancels only owned pending requests and releases their reservation once", async () => {
    const a = await actor(),
      b = await actor(),
      f = await staff();
    await reconcileFixtures();
    const p = await makePayout(a);
    const body = { payoutId: p.id, requestKey: randomUUID() };
    expect((await cancel(req("payout/cancel", b.token, body))).status).toBe(
      404,
    );
    expect((await cancel(req("payout/cancel", a.token, body))).ok).toBe(true);
    expect((await cancel(req("payout/cancel", a.token, body))).ok).toBe(true);
    expect((await quote(a.token)).availableXp).toBe(1000);
    const next = await makePayout(a);
    await decision(f.token, next.id, "review");
    expect(
      (
        await cancel(
          req("payout/cancel", a.token, {
            payoutId: next.id,
            requestKey: randomUUID(),
          }),
        )
      ).status,
    ).toBe(409);
  });
  it("enforces role duties and an explicitly configured independent approver", async () => {
    await prisma.payoutConfig.create({
      data: {
        programSlug: "default",
        programName: "Independent",
        separateApprover: true,
      },
    });
    const a = await actor(),
      r = await staff("caseworker"),
      f = await staff("finance"),
      admin = await staff();
    await reconcileFixtures();
    const p = await makePayout(a);
    expect((await decision(f.token, p.id, "review")).status).toBe(403);
    expect((await decision(r.token, p.id, "approve")).status).toBe(403);
    expect((await decision(admin.token, p.id, "review")).ok).toBe(true);
    expect((await decision(admin.token, p.id, "approve")).status).toBe(403);
    expect((await decision(f.token, p.id, "approve")).ok).toBe(true);
    const q = await quote(a.token);
    expect(q.paidCents).toBe("0");
    expect(q.pendingCents).toBe("500");
  });
  it("requires real manual-payment reference/time and adequate bookkeeping funds", async () => {
    const a = await actor(),
      f = await staff();
    await reconcileFixtures();
    const p = await makePayout(a);
    await decision(f.token, p.id, "review");
    await decision(f.token, p.id, "approve");
    expect((await decision(f.token, p.id, "complete")).status).toBe(400);
    const evidence = {
      paymentReference: "synthetic-bank-001",
      paidAt: new Date().toISOString(),
    };
    expect((await decision(f.token, p.id, "complete", evidence)).status).toBe(
      409,
    );
    expect((await quote(a.token)).reservedXp).toBe(100);
    expect(
      (
        await pool(
          req(
            "admin/finance/pool",
            f.token,
            {
              requestKey: randomUUID(),
              amountCents: 1000,
              reason: "Synthetic funding",
            },
            true,
          ),
        )
      ).ok,
    ).toBe(true);
    const body = {
      payoutId: p.id,
      requestKey: randomUUID(),
      action: "complete",
      decisionNote: "Verified synthetic evidence only",
      ...evidence,
    };
    const responses = await Promise.all([
      decide(req("admin/payouts", f.token, body, true)),
      decide(req("admin/payouts", f.token, body, true)),
    ]);
    expect(responses.every((r) => r.ok)).toBe(true);
    expect(await quote(a.token)).toMatchObject({
      paidCents: "500",
      pendingCents: "0",
      reservedXp: 0,
      spentXp: 100,
      lifetimeXp: 1000,
    });
    expect(
      (
        await prisma.poolBalance.findUniqueOrThrow({
          where: { id: "singleton" },
        })
      ).balanceCents,
    ).toBe(500);
    expect(
      await prisma.poolAdjustment.count({ where: { payoutId: p.id } }),
    ).toBe(1);
  });
  it("prevents duplicate external references and parallel pool overspending across learners", async () => {
    const a = await actor(),
      b = await actor(),
      f = await staff();
    await reconcileFixtures();
    const ps = [await makePayout(a), await makePayout(b)];
    for (const p of ps) {
      await decision(f.token, p.id, "review");
      await decision(f.token, p.id, "approve");
    }
    await pool(
      req(
        "admin/finance/pool",
        f.token,
        {
          requestKey: randomUUID(),
          amountCents: 500,
          reason: "One payment only",
        },
        true,
      ),
    );
    const results = await Promise.all(
      ps.map((p, i) =>
        decision(f.token, p.id, "complete", {
          paymentReference: `synthetic-${i}`,
          paidAt: new Date().toISOString(),
        }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (
        await prisma.poolBalance.findUniqueOrThrow({
          where: { id: "singleton" },
        })
      ).balanceCents,
    ).toBe(0);
    await pool(
      req(
        "admin/finance/pool",
        f.token,
        {
          requestKey: randomUUID(),
          amountCents: 500,
          reason: "Another payment",
        },
        true,
      ),
    );
    const paid = await prisma.payoutRequest.findFirstOrThrow({
        where: { status: "completed" },
      }),
      unpaid = await prisma.payoutRequest.findFirstOrThrow({
        where: { status: "approved" },
      });
    expect(
      (
        await decision(f.token, unpaid.id, "complete", {
          paymentReference: paid.paymentReference,
          paidAt: new Date().toISOString(),
        })
      ).status,
    ).toBe(409);
  });
  it("masks handles and notes in lists; private reveal is authorized and audited", async () => {
    const a = await actor(),
      f = await staff(),
      r = await staff("caseworker");
    await reconcileFixtures();
    const p = await makePayout(a);
    const pending = await list(
      req("admin/payouts?status=all", r.token, undefined, true),
    );
    expect(await pending.text()).not.toContain("@synthetic-private");
    expect(JSON.stringify(await quote(a.token))).not.toContain(
      "@synthetic-private",
    );
    expect(
      (
        await details(req("admin/payouts/details", r.token, {}, true), {
          params: Promise.resolve({ payoutId: p.id }),
        })
      ).status,
    ).toBe(403);
    await decision(f.token, p.id, "review");
    await decision(f.token, p.id, "approve");
    const opened = await details(
      req("admin/payouts/details", f.token, {}, true),
      { params: Promise.resolve({ payoutId: p.id }) },
    );
    expect(opened.ok).toBe(true);
    expect((await opened.json()).paymentHandle).toBe("@synthetic-private");
    expect(
      await prisma.auditLog.count({
        where: { action: "PAYOUT_PAYMENT_DETAILS_VIEWED" },
      }),
    ).toBe(1);
  });
  it("supports Zelle only after explicit manual-method configuration", async () => {
    const a = await actor();
    await reconcileFixtures();
    const body = {
      ...(await payload(a.token)),
      paymentMethod: "zelle",
      paymentHandle: "synthetic@example.test",
    };
    expect((await request(req("payout/request", a.token, body))).status).toBe(
      400,
    );
    await prisma.payoutConfig.create({
      data: {
        programSlug: "default",
        programName: "Explicit manual Zelle",
        paymentMethods: '["zelle"]',
      },
    });
    const q = await payload(a.token);
    expect(
      (
        await request(
          req("payout/request", a.token, {
            ...q,
            paymentMethod: "zelle",
            paymentHandle: "invalid",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          req("payout/request", a.token, {
            ...q,
            paymentMethod: "zelle",
            paymentHandle: "synthetic@example.test",
          }),
        )
      ).ok,
    ).toBe(true);
  });
  it("binds program rules through verified staff assignment, not edited city", async () => {
    await prisma.payoutConfig.create({
      data: {
        programSlug: "special",
        programName: "Verified program",
        xpToDollar: 0.2,
      },
    });
    const a = await actor(),
      f = await staff();
    await reconcileFixtures();
    await prisma.user.update({
      where: { id: a.user.id },
      data: { city: "special" },
    });
    expect((await quote(a.token)).rules.rate).toBe("0.05");
    expect(
      (
        await assign(
          req(
            "admin/rewards/program",
            f.token,
            {
              userId: a.user.id,
              programSlug: "special",
              reason: "Synthetic verified invitation",
              requestKey: randomUUID(),
            },
            true,
          ),
        )
      ).ok,
    ).toBe(true);
    expect((await quote(a.token)).rules.rate).toBe("0.2");
  });
  it("keeps corrections separate from lifetime learning and cannot consume reserved funds", async () => {
    const a = await actor(100),
      f = await staff(),
      r = await staff("caseworker");
    await reconcileFixtures();
    const p = await makePayout(a, 80);
    const body = {
      requestKey: randomUUID(),
      xpAdjustment: -30,
      xpReason: "Synthetic correction",
    };
    expect(
      (
        await correct(req("admin/users", f.token, body, true), {
          params: Promise.resolve({ userId: a.user.id }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await correct(
          req("admin/users", r.token, { ...body, xpAdjustment: 10 }, true),
          { params: Promise.resolve({ userId: a.user.id }) },
        )
      ).status,
    ).toBe(403);
    const hashBeforeCorrection = (
      await prisma.$transaction((tx) => reconciliationPlan(tx))
    ).hash;
    const good = { ...body, xpAdjustment: 10 };
    for (let i = 0; i < 2; i++)
      expect(
        (
          await correct(req("admin/users", f.token, good, true), {
            params: Promise.resolve({ userId: a.user.id }),
          })
        ).ok,
      ).toBe(true);
    expect(await quote(a.token)).toMatchObject({
      availableXp: 30,
      reservedXp: 80,
      lifetimeXp: 100,
    });
    expect(
      (await prisma.payoutRequest.findUniqueOrThrow({ where: { id: p.id } }))
        .status,
    ).toBe("pending");
    expect(
      (await prisma.$transaction((tx) => reconciliationPlan(tx))).hash,
    ).not.toBe(hashBeforeCorrection);
  });
  it("rolls back reservation, request and ledger when the mandatory audit fails", async () => {
    const a = await actor();
    await reconcileFixtures();
    const before = await snapshot();
    await assertTestDatabase(prisma);
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$`,
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER test_fail_audit BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION test_fail_audit()',
    );
    try {
      expect(
        (await request(req("payout/request", a.token, await payload(a.token))))
          .status,
      ).toBe(503);
      expect(await snapshot()).toEqual(before);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER test_fail_audit ON "AuditLog"',
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION test_fail_audit()");
    }
  });
  it("imports legacy recorded cents and unknown historic rules without rewriting money/history", async () => {
    const a = await actor(100);
    const old = await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 20,
        dollarAmount: 1.005,
        status: "completed",
        paymentMethod: "zelle",
        paymentHandle: "synthetic@example.test",
      },
    });
    await reconcileFixtures();
    const p = await prisma.payoutRequest.findUniqueOrThrow({
      where: { id: old.id },
    });
    expect(p.dollarAmount).toBe(1.005);
    expect(p.amountCents).toBe(101);
    expect(p.paidAt).toBeNull();
    expect(JSON.parse(p.rulesSnapshot!).rate).toBeNull();
    const report = await prisma.$transaction((tx) => reconciliationPlan(tx));
    expect(report.issues).toEqual([]);
    expect(report.uninitialized).toBe(0);
    expect(report.legacyRequests).toBe(0);
    const finance = await financeData();
    expect(finance.windows.every((w) => w.count === 0)).toBe(true);
    expect(finance.legacyPaid.count).toBe(1);
  });
  it("refuses stale reconciliation hashes, unknown statuses and overspent legacy accounts", async () => {
    const a = await actor(10);
    const plan = await prisma.$transaction((tx) => reconciliationPlan(tx));
    await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 20,
        dollarAmount: 1,
        status: "paid",
      },
    });
    await expect(
      prisma.$transaction((tx) => backfillRewards(tx, plan.hash, true)),
    ).rejects.toThrow();
    const fresh = await prisma.$transaction((tx) => reconciliationPlan(tx));
    expect(fresh.issues).toContain("unknown-status-or-invalid-xp");
    expect(await prisma.rewardAccount.count()).toBe(0);
  });
  it("keeps rolling-window boundaries exact while older reservations remain held", async () => {
    const a = await actor(1000),
      now = new Date();
    await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 500,
        dollarAmount: 25,
        status: "pending",
        paymentMethod: "venmo",
        paymentHandle: "@synthetic",
        createdAt: new Date(now.getTime() - 7 * 86400000 - 1),
      },
    });
    await reconcileFixtures();
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(now);
      const q = await quote(a.token);
      expect(q).toMatchObject({
        availableXp: 500,
        reservedXp: 500,
        weeklyRemaining: 500,
      });
      await makePayout(a, 500);
      expect(await quote(a.token)).toMatchObject({
        availableXp: 0,
        reservedXp: 1000,
        weeklyRemaining: 0,
      });
    } finally {
      vi.useRealTimers();
    }
  });
  it("runs the real operator CLI read-only, then applies and rechecks an acknowledged disposable opening", async () => {
    const a = await actor(30);
    await assertTestDatabase(prisma);
    const name = new URL(process.env.DATABASE_URL_TEST!).pathname.slice(1);
    const command = [
      "node_modules/tsx/dist/cli.mjs",
      "scripts/reconcile-rewards.ts",
      "--confirm-database",
      name,
    ];
    const before = await snapshot();
    const report = JSON.parse(
      execFileSync(process.execPath, command, {
        env: process.env,
        encoding: "utf8",
      }),
    );
    expect(report.mode).toBe("read-only");
    expect(report.complete).toBe(false);
    expect(await snapshot()).toEqual(before);
    const applied = JSON.parse(
      execFileSync(
        process.execPath,
        [
          ...command,
          "--apply",
          "--expected-hash",
          report.hash,
          "--accept-legacy-xp-differences",
        ],
        { env: process.env, encoding: "utf8" },
      ),
    );
    expect(applied.complete).toBe(true);
    expect((await quote(a.token)).availableXp).toBe(30);
    const again = JSON.parse(
      execFileSync(
        process.execPath,
        [...command, "--apply", "--expected-hash", applied.hash],
        { env: process.env, encoding: "utf8" },
      ),
    );
    expect(again.complete).toBe(true);
    expect(await prisma.rewardEntry.count()).toBe(1);
  });
  it("rolls an external payment record, pool debit and settlement back when audit fails", async () => {
    const a = await actor(),
      f = await staff();
    await reconcileFixtures();
    const p = await makePayout(a);
    await decision(f.token, p.id, "review");
    await decision(f.token, p.id, "approve");
    await pool(
      req(
        "admin/finance/pool",
        f.token,
        {
          requestKey: randomUUID(),
          amountCents: 1000,
          reason: "Synthetic funding",
        },
        true,
      ),
    );
    const before = await snapshot();
    await assertTestDatabase(prisma);
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION test_payment_audit_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$`,
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER test_payment_audit_fail BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION test_payment_audit_fail()',
    );
    try {
      expect(
        (
          await decision(f.token, p.id, "complete", {
            paymentReference: "synthetic-rollback-reference",
            paidAt: new Date().toISOString(),
          })
        ).status,
      ).toBe(503);
      expect(await snapshot()).toEqual(before);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER test_payment_audit_fail ON "AuditLog"',
      );
      await prisma.$executeRawUnsafe("DROP FUNCTION test_payment_audit_fail()");
    }
  });
  it("applies the exact additive migration, reconciles legacy totals and enforces immutable SQL evidence", async () => {
    await assertTestDatabase(prisma);
    const a = await actor(100);
    const payer = await staff();
    const old = await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 20,
        dollarAmount: 1.005,
        status: "completed",
        paymentMethod: "zelle",
      },
    });
    const capturedEvidence: Record<string, unknown> = {};
    const beforeUser = await prisma.user.findUniqueOrThrow({
      where: { id: a.user.id },
    });
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(
            'DROP TABLE "RewardEntry", "RewardAccount"',
          );
          await tx.$executeRawUnsafe(
            'ALTER TABLE "PayoutRequest" DROP COLUMN "amountCents", DROP COLUMN "paidAt", DROP COLUMN "paidById", DROP COLUMN "payloadHash", DROP COLUMN "paymentReference", DROP COLUMN "requestKey", DROP COLUMN "rulesSnapshot"',
          );
          await tx.$executeRawUnsafe(
            'ALTER TABLE "PayoutConfig" DROP COLUMN "paymentMethods", DROP COLUMN "rateExact", DROP COLUMN "separateApprover", DROP COLUMN "version"',
          );
          await tx.$executeRawUnsafe(
            'ALTER TABLE "PoolAdjustment" DROP COLUMN "payoutId", DROP COLUMN "requestKey"',
          );
          const sql = readFileSync(
            "prisma/migrations/20261027030000_reward_accounting/migration.sql",
            "utf8",
          );
          const parts = sql.split(/(?=CREATE FUNCTION l2e_immutable_)/);
          for (const statement of parts[0]
            .replace(/^--.*$/gm, "")
            .split(";")
            .filter((s) => s.trim()))
            await tx.$executeRawUnsafe(statement);
          for (const part of parts.slice(1)) {
            const trigger = part.indexOf("CREATE TRIGGER");
            await tx.$executeRawUnsafe(part.slice(0, trigger).trim());
            for (const statement of part
              .slice(trigger)
              .split(";")
              .filter((s) => s.trim()))
              await tx.$executeRawUnsafe(statement);
          }
          expect(
            await tx.user.findUniqueOrThrow({ where: { id: a.user.id } }),
          ).toEqual(beforeUser);
          const original = await tx.payoutRequest.findUniqueOrThrow({
            where: { id: old.id },
          });
          expect(original.dollarAmount).toBe(old.dollarAmount);
          expect(original.amountCents).toBeNull();
          const plan = await reconciliationPlan(tx);
          await backfillRewards(tx, plan.hash, true);
          const done = await reconciliationPlan(tx);
          expect(done.issues).toEqual([]);
          expect(done.uninitialized).toBe(0);
          expect(done.legacyRequests).toBe(0);
          const account = await tx.rewardAccount.findUniqueOrThrow({
            where: { userId: a.user.id },
          });
          expect(account).toMatchObject({
            creditedXp: 100,
            availableXp: 80,
            spentXp: 20,
            reservedXp: 0,
          });
          await tx.$executeRawUnsafe("SAVEPOINT check_ledger");
          await expect(
            tx.rewardEntry.updateMany({ data: { kind: "tampered" } }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT check_ledger");
          await tx.$executeRawUnsafe("SAVEPOINT check_terms");
          await expect(
            tx.payoutRequest.update({
              where: { id: old.id },
              data: { amountCents: 999 },
            }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT check_terms");
          await tx.$executeRawUnsafe("SAVEPOINT check_balance");
          await expect(
            tx.rewardAccount.update({
              where: { userId: a.user.id },
              data: { availableXp: -1 },
            }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT check_balance");
          await tx.$executeRawUnsafe("SAVEPOINT check_payment_evidence");
          await expect(
            tx.payoutRequest.create({
              data: {
                userId: a.user.id,
                xpAmount: 1,
                dollarAmount: 0.05,
                amountCents: 5,
                status: "completed",
                requestKey: randomUUID(),
                paidAt: new Date(),
                paidById: payer.admin.id,
              },
            }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe(
            "ROLLBACK TO SAVEPOINT check_payment_evidence",
          );
          await tx.$executeRawUnsafe("SAVEPOINT check_state_machine");
          const pending = await tx.payoutRequest.create({
            data: {
              userId: a.user.id,
              xpAmount: 1,
              dollarAmount: 0.05,
              amountCents: 5,
              status: "pending",
            },
          });
          await expect(
            tx.payoutRequest.update({
              where: { id: pending.id },
              data: {
                status: "completed",
                paidAt: new Date(),
                paidById: payer.admin.id,
                paymentReference: "synthetic-no-skip",
              },
            }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe(
            "ROLLBACK TO SAVEPOINT check_state_machine",
          );
          await tx.$executeRawUnsafe("SAVEPOINT check_entry_balance");
          await expect(
            tx.rewardEntry.create({
              data: {
                userId: a.user.id,
                sourceKey: "unbalanced",
                kind: "invalid",
                creditedDelta: 1,
              },
            }),
          ).rejects.toThrow();
          await tx.$executeRawUnsafe(
            "ROLLBACK TO SAVEPOINT check_entry_balance",
          );
          Object.assign(capturedEvidence, {
            fixture: "nonce-attested disposable PostgreSQL",
            schemaMigration: "exact additive SQL applied to old shape",
            openingXp: account.creditedXp,
            availableXp: account.availableXp,
            reservedXp: account.reservedXp,
            spentXp: account.spentXp,
            legacyRecordedDollars: original.dollarAmount,
            importedCents: (
              await tx.payoutRequest.findUniqueOrThrow({
                where: { id: old.id },
              })
            ).amountCents,
            paidTimestampInferred: false,
            moneyTotals: done.totals,
            reconciledAccounts: done.users,
            uninitialized: done.uninitialized,
            legacyRequests: done.legacyRequests,
            issues: done.issues,
            appendOnlyCheckPassed: true,
            immutableTermsCheckPassed: true,
            conservationCheckPassed: true,
            immutableStateMachineCheckPassed: true,
            mandatoryPaymentReferenceCheckPassed: true,
            balancedLedgerEntryCheckPassed: true,
          });
          throw new Error("ROLLBACK_SYNTHETIC");
        },
        { timeout: 20000 },
      );
    } catch (e) {
      if (!(e instanceof Error && e.message === "ROLLBACK_SYNTHETIC")) throw e;
    }
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } }),
    ).toEqual(beforeUser);
    expect(
      await prisma.payoutRequest.findUniqueOrThrow({ where: { id: old.id } }),
    ).toEqual(old);
    expect(await prisma.rewardEntry.count()).toBe(0);
    if (process.env.REWARDS_REPORT_EVIDENCE)
      writeFileSync(
        process.env.REWARDS_REPORT_EVIDENCE,
        JSON.stringify(
          {
            ...capturedEvidence,
            transactionRolledBack: true,
            originalRowsPreserved: true,
          },
          null,
          2,
        ),
      );
  });
});
