/** Disposable PostgreSQL integration gates; not replaced by public-only mocked tests. */
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { clearDb, createAdmin } from "../helpers/factories";
import { makeRequest } from "../helpers/request";
import { staffFixture, staffRequest, boundaryFixture } from "../helpers/staff";
import { createStaffSession } from "@/lib/admin-auth";
import { POST } from "@/app/api/partner-inquiries/route";
import { GET as queue } from "@/app/api/admin/inquiries/route";
const data = () => ({
  requestKey: randomUUID(),
  fullName: "Synthetic contact",
  organization: "Synthetic organization",
  email: "synthetic-inquiry@example.test",
  interest: "pilot",
  consent: true,
});
const send = (d: unknown) =>
  POST(
    makeRequest("http://test/api/partner-inquiries", {
      body: d,
      ip: "192.0.2.80",
    }),
  );
beforeEach(async () => {
  await clearDb();
  await createAdmin();
  for (const [k, v] of Object.entries({
    PARTNER_INQUIRY_PROGRAM_ID: "test-program",
    PARTNER_INQUIRY_TEAM_NAME: "Synthetic intake team",
    PARTNER_INQUIRY_MONITORING_NOTICE: "Weekdays 09:00–17:00 UTC; no guarantee",
    PARTNER_INQUIRY_REVIEW_REFERENCE: "synthetic-review",
  }))
    vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());
describe("scoped partner inquiry receipts and atomic abuse controls", () => {
  it("saves parallel unchanged retries once and refuses changed intent details", async () => {
    const d = data(),
      r = await Promise.all([send(d), send(d)]);
    expect(r.every((x) => x.ok)).toBe(true);
    const receipts = await Promise.all(r.map((x) => x.json()));
    expect(receipts[0].receipt.reference).toBe(receipts[1].receipt.reference);
    expect(await prisma.partnerInquiry.count()).toBe(1);
    expect(
      await prisma.auditLog.count({
        where: { action: "PARTNER_INQUIRY_SAVED" },
      }),
    ).toBe(1);
    expect((await send({ ...d, organization: "Changed details" })).status).toBe(
      409,
    );
    const row = await prisma.partnerInquiry.findFirstOrThrow();
    expect(row.programId).toBe("test-program");
    expect(row.consentAt).toBeTruthy();
    expect(JSON.stringify(await prisma.auditLog.findMany())).not.toContain(
      d.email,
    );
  });
  it("enforces a durable rate cap, permits replay at the cap, and does not leak to wrong roles/programs", async () => {
    const first = data();
    expect((await send(first)).ok).toBe(true);
    for (let i = 0; i < 4; i++) expect((await send(data())).ok).toBe(true);
    expect((await send(data())).status).toBe(429);
    expect((await send(first)).ok).toBe(true);
    expect(await prisma.partnerInquiry.count()).toBe(5);
    for (const role of ["finance", "caseworker"]) {
      const f = await staffFixture(role);
      expect((await queue(staffRequest(f.token, "inquiries"))).status).toBe(
        403,
      );
    }
    const f = await staffFixture("admin");
    expect(
      (await (await queue(staffRequest(f.token, "inquiries"))).json()).total,
    ).toBe(5);
    await boundaryFixture();
    await prisma.staffMembership.create({
      data: {
        adminId: f.admin.id,
        programId: "other-program",
        role: "program_admin",
      },
    });
    const token = await prisma.$transaction((tx) =>
      createStaffSession(tx, f.admin.id, true, "other-program"),
    );
    expect(
      (
        await (
          await queue(
            staffRequest(token, "inquiries", undefined, "GET", "other-program"),
          )
        ).json()
      ).items,
    ).toEqual([]);
    expect(
      (
        await queue(
          staffRequest(
            token,
            "inquiries?programId=test-program",
            undefined,
            "GET",
            "other-program",
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("rolls inquiry/counters back when mandatory audit fails, with no false receipt", async () => {
    await assertTestDatabase(prisma);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AuditLog" ADD CONSTRAINT synthetic_partner_audit_failure CHECK (action <> 'PARTNER_INQUIRY_SAVED')`,
    );
    try {
      const r = await send(data());
      expect(r.status).toBe(503);
      expect(await prisma.partnerInquiry.count()).toBe(0);
      expect(await prisma.partnerInquiryRate.count()).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "AuditLog" DROP CONSTRAINT synthetic_partner_audit_failure`,
      );
    }
  });
});
