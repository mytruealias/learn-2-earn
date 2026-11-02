import { beforeEach, describe, it, expect } from "vitest";
import prisma from "@/lib/prisma";
import { clearDb, createAdmin } from "../helpers/factories";
import { makeRequest, getSetCookies, readCookie } from "../helpers/request";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as mfa } from "@/app/api/admin/mfa/route";
import {
  GET as session,
  DELETE as logout,
} from "@/app/api/admin/session/route";
import { authenticator, staffTokenHash } from "@/lib/staff-security";
import { GET as overview } from "@/app/api/admin/overview/route";
async function passwordLogin(email: string, password: string) {
  const r = await login(
    makeRequest("http://test/api/admin/login", { body: { email, password } }),
  );
  expect(r.ok).toBe(true);
  const token = readCookie(getSetCookies(r), "l2e_admin_session")!;
  return { r, token };
}
const req = (token: string, body?: unknown) =>
  makeRequest("http://test/api/admin/mfa", {
    body,
    cookies: { l2e_admin_session: token },
    headers: { "x-l2e-program": "test-program" },
    method: body ? "POST" : "GET",
  });
describe("verified privileged staff MFA and recovery", () => {
  beforeEach(clearDb);
  it("keeps password-only sessions out of all program data; confirms real authenticator enrollment with private single-use recovery", async () => {
    const { admin, password } = await createAdmin();
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { mfaConfirmedAt: null, mfaSecretEncrypted: null },
    });
    const first = await passwordLogin(admin.email, password);
    expect((await overview(req(first.token))).status).toBe(401);
    const cookie = getSetCookies(first.r).join(";");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=strict");
    expect(
      await prisma.adminSession.findUnique({ where: { token: first.token } }),
    ).toBeNull();
    expect(
      await prisma.adminSession.findUnique({
        where: { token: staffTokenHash(first.token) },
      }),
    ).not.toBeNull();
    const setup = await (
      await mfa(req(first.token, { action: "setup" }))
    ).json();
    expect(setup.setupKey).toMatch(/^[A-Z2-7]+$/);
    const code = authenticator(setup.setupKey).generate();
    const confirmed = await mfa(req(first.token, { action: "enroll", code }));
    expect(confirmed.ok).toBe(true);
    const body = await confirmed.json();
    expect(body.recoveryCodes).toHaveLength(10);
    const token = readCookie(getSetCookies(confirmed), "l2e_admin_session")!;
    expect((await overview(req(token))).ok).toBe(true);
    expect((await mfa(req(token, { action: "setup" }))).status).toBe(401);
    const second = await passwordLogin(admin.email, password);
    expect(
      (await mfa(req(second.token, { action: "verify", code }))).status,
    ).toBe(401);
    const recovered = await mfa(
      req(second.token, { action: "recover", code: body.recoveryCodes[0] }),
    );
    expect(recovered.ok).toBe(true);
    expect(
      await prisma.staffRecoveryCode.count({
        where: { adminId: admin.id, usedAt: { not: null } },
      }),
    ).toBe(1);
    const third = await passwordLogin(admin.email, password);
    expect(
      (
        await mfa(
          req(third.token, { action: "recover", code: body.recoveryCodes[0] }),
        )
      ).status,
    ).toBe(401);
    const audits = await prisma.auditLog.findMany();
    expect(JSON.stringify(audits)).not.toContain(setup.setupKey);
    expect(JSON.stringify(audits)).not.toContain(body.recoveryCodes[0]);
  });
  it("requires password replacement for provisioned staff before enrollment and revokes old sessions", async () => {
    const { admin, password } = await createAdmin();
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        mustChangePassword: true,
        mfaConfirmedAt: null,
        mfaSecretEncrypted: null,
      },
    });
    const first = await passwordLogin(admin.email, password);
    expect((await first.r.json()).nextStep).toBe("password");
    expect((await mfa(req(first.token, { action: "setup" }))).status).toBe(401);
    const changed = await mfa(
      req(first.token, {
        action: "password",
        currentPassword: password,
        newPassword: "synthetic-long-new-password",
      }),
    );
    expect(changed.ok).toBe(true);
    expect((await changed.json()).nextStep).toBe("enroll");
    expect((await session(req(first.token))).status).toBe(401);
    expect(
      (await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } }))
        .mustChangePassword,
    ).toBe(false);
  });
  it("rejects bad codes, cross-origin login/logout and expired sessions, and uses persistent account attempt limits", async () => {
    const { admin, password } = await createAdmin();
    const first = await passwordLogin(admin.email, password);
    expect(
      (await mfa(req(first.token, { action: "verify", code: "invalid" })))
        .status,
    ).toBe(401);
    const foreign = makeRequest("http://test/api/admin/login", {
      body: { email: admin.email, password },
      headers: { origin: "https://unrelated.example" },
    });
    expect((await login(foreign)).status).toBe(403);
    expect(
      (
        await logout(
          makeRequest("http://test/api/admin/session", {
            method: "DELETE",
            cookies: { l2e_admin_session: first.token },
            headers: { origin: "https://unrelated.example" },
          }),
        )
      ).status,
    ).toBe(403);
    await prisma.adminSession.updateMany({
      where: { adminId: admin.id },
      data: { expiresAt: new Date(0) },
    });
    expect((await session(req(first.token))).status).toBe(401);
    for (let i = 0; i < 5; i++)
      expect(
        (
          await login(
            makeRequest("http://test/api/admin/login", {
              body: { email: admin.email, password: "incorrect" },
            }),
          )
        ).status,
      ).toBe(401);
    expect(
      (
        await login(
          makeRequest("http://test/api/admin/login", {
            body: { email: admin.email, password },
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } }))
        .lockedUntil,
    ).not.toBeNull();
    expect(await prisma.staffAuthThrottle.count()).toBeGreaterThan(0);
  });
});
