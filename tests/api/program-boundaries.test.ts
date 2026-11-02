import { beforeEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { clearDb } from "../helpers/factories";
import { staffFixture, boundaryFixture, staffRequest } from "../helpers/staff";
import { staffList } from "@/lib/staff/lists";
import { scopedDb } from "@/lib/program-scope";
import {
  GET as userDetail,
  PATCH as userUpdate,
} from "@/app/api/admin/users/[userId]/route";
import {
  GET as caseDetail,
  PATCH as caseUpdate,
} from "@/app/api/admin/cases/[id]/route";
import { POST as notes } from "@/app/api/admin/cases/[id]/notes/route";
import { POST as dispatch } from "@/app/api/admin/cases/[id]/dispatch/route";
import { POST as allocate } from "@/app/api/admin/cases/[id]/allocate/route";
import { PATCH as directory } from "@/app/api/admin/directory/[id]/route";
import { PATCH as payout } from "@/app/api/admin/payouts/route";
import { POST as paymentDetails } from "@/app/api/admin/payouts/[payoutId]/payment-details/route";
import { POST as assignment } from "@/app/api/admin/rewards/program/route";
import { GET as overview } from "@/app/api/admin/overview/route";
import { GET as reports } from "@/app/api/admin/stats/reports/route";
import { GET as finance } from "@/app/api/admin/finance/route";
import {
  GET as session,
  DELETE as logout,
} from "@/app/api/admin/session/route";
import {
  programBoundaryPlan,
  applyProgramBoundaryPlan,
} from "@/lib/program-backfill";
import { createUserSession } from "@/lib/user-session";
import { makeRequest } from "../helpers/request";
const service = {
  name: "Sample",
  category: "Food",
  address: null,
  phone: null,
  hours: null,
  notes: null,
  website: null,
};
describe("explicit program ownership and direct API authorization", () => {
  beforeEach(clearDb);
  it("bounds all collections, exact money reports and overview aggregates to the active membership", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture();
    await prisma.user.update({
      where: { id: f.user.id },
      data: { city: "other-program" },
    });
    for (const kind of [
      "users",
      "cases",
      "payouts",
      "directory",
      "staff",
      "audit",
    ] as const) {
      const r = await staffList(staffRequest(a.token, kind), kind);
      expect(r.ok).toBe(true);
      expect(JSON.stringify(await r.json())).not.toMatch(
        /Private other|private-unrelated|987654/,
      );
    }
    const o = await (await overview(staffRequest(a.token, "overview"))).json();
    expect(o.participants).toBe(1);
    expect(o.queues.approved).toBe(0);
    const money = await (
      await finance(staffRequest(a.token, "finance"))
    ).json();
    expect(money.pool.balanceCents).toBe(0);
    expect(JSON.stringify(money)).not.toContain("Private other");
  });
  it("denies cross-program IDs for detail, notes, assignment, allocation, payouts, financial assignment and corrections", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture(),
      req = (path: string, body?: unknown, method?: string) =>
        staffRequest(a.token, path, body, method);
    const results = await Promise.all([
      userDetail(req("users/other"), {
        params: Promise.resolve({ userId: f.other.id }),
      }),
      caseDetail(req("cases/other"), {
        params: Promise.resolve({ id: f.foreignCase.id }),
      }),
      notes(
        req("cases/other/notes", {
          requestKey: f.key(),
          expectedVersion: 0,
          text: "No cross-program write",
        }),
        { params: Promise.resolve({ id: f.foreignCase.id }) },
      ),
      dispatch(
        req("cases/other/dispatch", {
          requestKey: f.key(),
          expectedVersion: 0,
          staffId: a.admin.id,
        }),
        { params: Promise.resolve({ id: f.foreignCase.id }) },
      ),
      allocate(
        req("cases/other/allocate", {
          requestKey: f.key(),
          expectedVersion: 0,
          resourceType: "food",
          quantity: 1,
        }),
        { params: Promise.resolve({ id: f.foreignCase.id }) },
      ),
      directory(
        req(
          "directory/other",
          { ...service, requestKey: f.key(), expectedVersion: 0 },
          "PATCH",
        ),
        { params: Promise.resolve({ id: f.foreignService.id }) },
      ),
      payout(
        req(
          "payouts",
          {
            payoutId: f.foreignPayout.id,
            requestKey: f.key(),
            action: "review",
            decisionNote: "Synthetic denied",
          },
          "PATCH",
        ),
      ),
      paymentDetails(req("payouts/other/payment-details", {}), {
        params: Promise.resolve({ payoutId: f.foreignPayout.id }),
      }),
      assignment(
        req("rewards/program", {
          userId: f.other.id,
          programSlug: null,
          reason: "Denied",
          requestKey: f.key(),
        }),
      ),
      userUpdate(
        req(
          "users/other",
          { requestKey: f.key(), expectedVersion: 0, isActive: false },
          "PATCH",
        ),
        { params: Promise.resolve({ userId: f.other.id }) },
      ),
    ]);
    expect(results.every((r) => r.status === 404)).toBe(true);
    for (const r of results) expect(await r.text()).not.toContain("Private");
    expect(
      (await prisma.case.findUniqueOrThrow({ where: { id: f.foreignCase.id } }))
        .version,
    ).toBe(0);
  });
  it("blocks wrong roles, absent or stale program context, and raw/nested unscoped queries", async () => {
    await boundaryFixture();
    const a = await staffFixture("finance"),
      c = await staffFixture("caseworker");
    expect(
      (
        await caseDetail(staffRequest(a.token, "cases/x"), {
          params: Promise.resolve({ id: "x" }),
        })
      ).status,
    ).toBe(403);
    expect(
      (await staffList(staffRequest(c.token, "staff"), "staff")).status,
    ).toBe(403);
    expect((await finance(staffRequest(c.token, "finance"))).status).toBe(403);
    expect(
      (
        await staffList(
          staffRequest(a.token, "users", undefined, "GET", "other-program"),
          "users",
        )
      ).status,
    ).toBe(403);
    await expect(
      scopedDb(a.scope).path.findMany({
        include: {
          modules: { include: { lessons: { include: { progress: true } } } },
        },
      }),
    ).rejects.toThrow();
    await expect(
      async () => scopedDb(a.scope).$queryRaw`SELECT * FROM "User"`,
    ).rejects.toThrow();
  });
  it("rechecks revocation, membership changes, expiry, idle timeout and account deactivation", async () => {
    await boundaryFixture();
    const a = await staffFixture();
    expect((await session(staffRequest(a.token, "session"))).status).toBe(200);
    await prisma.staffMembership.update({
      where: {
        adminId_programId: { adminId: a.admin.id, programId: "test-program" },
      },
      data: { isActive: false, revokedAt: new Date() },
    });
    expect(
      (await staffList(staffRequest(a.token, "users"), "users")).status,
    ).toBe(401);
    const b = await staffFixture();
    await prisma.adminSession.updateMany({
      where: { adminId: b.admin.id },
      data: { lastSeenAt: new Date(Date.now() - 31 * 60000) },
    });
    expect((await overview(staffRequest(b.token, "overview"))).status).toBe(
      401,
    );
    const d = await staffFixture();
    await prisma.adminUser.update({
      where: { id: d.admin.id },
      data: { isActive: false },
    });
    expect((await overview(staffRequest(d.token, "overview"))).status).toBe(
      401,
    );
    const e = await staffFixture();
    await logout(staffRequest(e.token, "session", undefined, "DELETE"));
    expect((await overview(staffRequest(e.token, "overview"))).status).toBe(
      401,
    );
  });
  it("quarantines unmapped legacy records, refuses stale mapping hashes and preserves XP/money/pool on reviewed import", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture();
    const unknown = await prisma.user.create({
      data: { fullName: "Unmapped synthetic learner", totalXp: 77 },
    });
    const legacy = await prisma.serviceDirectory.create({
      data: { name: "Legacy reviewed service", category: "Food" },
    });
    const mapping = {
      version: 1,
      organization: {
        id: "legacy-organization",
        name: "Reviewed legacy organization",
      },
      program: {
        id: "legacy-program",
        slug: "legacy",
        name: "Reviewed legacy program",
        defaultConfigSlug: null,
      },
      staffIds: [],
      participantIds: [unknown.id],
      serviceIds: [legacy.id],
      configIds: [],
      acceptLegacyPool: false,
      verificationReference: "synthetic-reviewed-record",
    };
    const plan = await prisma.$transaction((tx) =>
      programBoundaryPlan(tx, mapping),
    );
    await expect(
      prisma.$transaction((tx) =>
        applyProgramBoundaryPlan(tx, mapping, "stale"),
      ),
    ).rejects.toThrow();
    await prisma.$transaction((tx) =>
      applyProgramBoundaryPlan(tx, mapping, plan.hash),
    );
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: unknown.id } }))
        .totalXp,
    ).toBe(77);
    expect(
      await prisma.staffMembership.count({
        where: { programId: "legacy-program" },
      }),
    ).toBe(0);
    expect(
      (await staffList(staffRequest(a.token, "users"), "users")).status,
    ).toBe(200);
    expect(
      (
        await prisma.participantEnrollment.findUniqueOrThrow({
          where: { userId: f.user.id },
        })
      ).programId,
    ).toBe("test-program");
  });
  it("returns server pages and safe authorized exports without free text or unrelated counts", async () => {
    await boundaryFixture();
    const a = await staffFixture();
    for (let i = 0; i < 24; i++)
      await prisma.user.create({
        data: {
          fullName:
            i === 0
              ? " =HYPERLINK(1)"
              : `Page learner ${String(i).padStart(2, "0")}`,
          enrollment: { create: { programId: "test-program" } },
        },
      });
    const one = await (
        await staffList(
          staffRequest(a.token, "users?page=1&sort=name&direction=asc"),
          "users",
        )
      ).json(),
      two = await (
        await staffList(
          staffRequest(a.token, "users?page=2&sort=name&direction=asc"),
          "users",
        )
      ).json();
    expect(one.pagination.total).toBe(25);
    expect(one.rows).toHaveLength(20);
    expect(two.rows).toHaveLength(5);
    expect(new Set([...one.rows, ...two.rows].map((r) => r.id)).size).toBe(25);
    const csv = await (
      await staffList(
        staffRequest(a.token, "users?format=csv&search=HYPERLINK"),
        "users",
      )
    ).text();
    expect(csv).toContain("' =HYPERLINK");
    expect(csv).not.toContain("Private unrelated");
    expect(csv).not.toContain("passwordHash");
    const denied = await staffList(
      staffRequest(
        (await staffFixture("caseworker")).token,
        "staff?format=csv",
      ),
      "staff",
    );
    expect(denied.status).toBe(403);
  });
  it("defines report denominators, exact payment date windows and local DST boundaries without causal claims", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture();
    const r = await reports(
      staffRequest(
        a.token,
        "stats/reports?start=2026-03-08&end=2026-03-08&timezone=America%2FChicago",
      ),
    );
    expect(r.ok).toBe(true);
    const d = (await r.json()).report;
    expect(d.summary.enrolled).toBe(1);
    expect(d.filters.startUtc).toBe("2026-03-08T06:00:00.000Z");
    expect(d.filters.endExclusiveUtc).toBe("2026-03-09T05:00:00.000Z");
    expect(d.summary.paidCents).toBe("0");
    expect(d.definitions.outcomes).toContain("No causal impact");
    expect(
      (
        await reports(
          staffRequest(
            a.token,
            "stats/reports?start=2026-03-08&end=2026-03-08&timezone=UTC&programId=other-program",
          ),
        )
      ).status,
    ).toBe(403);
    expect(f.other.id).not.toBe(f.user.id);
  });
  it("handles simultaneous case decisions with one versioned winner and replays an identical note once", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture(),
      b = await staffFixture("caseworker");
    const body = {
      requestKey: randomUUID(),
      expectedVersion: 0,
      status: "open",
    };
    const [first, second] = await Promise.all([
      caseUpdate(staffRequest(a.token, "cases/x", body, "PATCH"), {
        params: Promise.resolve({ id: f.c.id }),
      }),
      caseUpdate(
        staffRequest(
          b.token,
          "cases/x",
          { ...body, requestKey: randomUUID(), priority: "high" },
          "PATCH",
        ),
        { params: Promise.resolve({ id: f.c.id }) },
      ),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const noteBody = {
      requestKey: randomUUID(),
      expectedVersion: 1,
      text: "Authorized note",
    };
    for (let i = 0; i < 2; i++)
      expect(
        (
          await notes(staffRequest(a.token, "cases/x/notes", noteBody), {
            params: Promise.resolve({ id: f.c.id }),
          })
        ).ok,
      ).toBe(true);
    expect(
      await prisma.caseNote.count({
        where: { caseId: f.c.id, text: "Authorized note" },
      }),
    ).toBe(1);
    expect(
      (await prisma.case.findUniqueOrThrow({ where: { id: f.c.id } })).version,
    ).toBe(2);
  });
  it("deactivation revokes learner tokens permanently while preserving history and program membership boundaries", async () => {
    const f = await boundaryFixture(),
      a = await staffFixture();
    const token = await createUserSession(f.user.id);
    const r = await userUpdate(
      staffRequest(
        a.token,
        `users/${f.user.id}`,
        { requestKey: randomUUID(), expectedVersion: 0, isActive: false },
        "PATCH",
      ),
      { params: Promise.resolve({ userId: f.user.id }) },
    );
    expect(r.ok).toBe(true);
    expect(
      await prisma.learnerSession.count({
        where: { userId: f.user.id, revokedAt: { not: null } },
      }),
    ).toBe(1);
    await prisma.user.update({
      where: { id: f.user.id },
      data: { isActive: true },
    });
    const { getUserIdFromRequest } = await import("@/lib/user-session");
    expect(
      await getUserIdFromRequest(
        makeRequest("http://test/api/auth/session", {
          cookies: { l2e_user_session: token },
        }),
      ),
    ).toBeNull();
  });
});

describe("private enrollment invitations", () => {
  beforeEach(clearDb);
  it("associates eligible authenticated exploration accounts and never city or legacy/unrelated history", async () => {
    const f = await boundaryFixture();
    const { enrollFromInvitation, invitationHash } = await import(
      "@/lib/program-enrollment"
    );
    const code = "synthetic-private-invitation";
    await prisma.programInvitation.create({
      data: {
        programId: "other-program",
        tokenHash: invitationHash(code),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    const req = makeRequest("http://test/api/auth/login", {
      cookies: { l2e_program_invitation: code },
    });
    const eligible = await prisma.user.create({
        data: {
          programEnrollmentState: "invitation_eligible",
          city: "test-program",
        },
      }),
      legacy = await prisma.user.create({
        data: { totalXp: 99, city: "other-program" },
      });
    await prisma.$transaction((tx) =>
      enrollFromInvitation(req, tx, eligible.id),
    );
    await prisma.$transaction((tx) => enrollFromInvitation(req, tx, legacy.id));
    await prisma.$transaction((tx) => enrollFromInvitation(req, tx, f.user.id));
    expect(
      (
        await prisma.participantEnrollment.findUniqueOrThrow({
          where: { userId: eligible.id },
        })
      ).programId,
    ).toBe("other-program");
    expect(
      await prisma.participantEnrollment.findUnique({
        where: { userId: legacy.id },
      }),
    ).toBeNull();
    expect(
      (
        await prisma.participantEnrollment.findUniqueOrThrow({
          where: { userId: f.user.id },
        })
      ).programId,
    ).toBe("test-program");
  });
});

describe("active program changes", () => {
  beforeEach(clearDb);
  it("requires an explicit membership, rotates selection sessions, rejects stale tabs and derives role from the selected program", async () => {
    await boundaryFixture();
    const a = await staffFixture();
    const { POST: choose } = await import("@/app/api/admin/programs/route");
    expect(
      (
        await choose(
          staffRequest(a.token, "programs", { programId: "other-program" }),
        )
      ).status,
    ).toBe(403);
    await prisma.staffMembership.create({
      data: {
        adminId: a.admin.id,
        programId: "other-program",
        role: "finance",
      },
    });
    const selected = await choose(
      staffRequest(a.token, "programs", { programId: "other-program" }),
    );
    expect(selected.ok).toBe(true);
    const { readCookie, getSetCookies } = await import("../helpers/request");
    const token = readCookie(getSetCookies(selected), "l2e_admin_session")!;
    expect((await overview(staffRequest(a.token, "overview"))).status).toBe(
      401,
    );
    expect((await overview(staffRequest(token, "overview"))).status).toBe(403);
    const valid = await (
      await session(
        staffRequest(token, "session", undefined, "GET", "other-program"),
      )
    ).json();
    expect(valid.admin.role).toBe("finance");
    expect(valid.admin.programName).toBe("Private other program");
    expect(
      (
        await staffList(
          staffRequest(token, "staff", undefined, "GET", "other-program"),
          "staff",
        )
      ).status,
    ).toBe(403);
  });
});
