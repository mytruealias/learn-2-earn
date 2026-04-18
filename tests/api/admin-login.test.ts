import { describe, it, expect, beforeEach } from "vitest";
import { POST as adminLoginPOST } from "@/app/api/admin/login/route";
import { makeRequest, readJson } from "../helpers/request";
import { clearDb, createAdmin } from "../helpers/factories";
import prisma from "@/lib/prisma";

describe("admin/login", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("rejects unknown email with 401", async () => {
    const req = makeRequest("http://test/api/admin/login", {
      body: { email: "nobody@admin.test", password: "x" },
      ip: "10.7.0.1",
    });
    const res = await adminLoginPOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects wrong password and writes a LOGIN_FAILED audit log", async () => {
    await createAdmin({ email: "admin1@test.com", password: "right-pw" });
    const req = makeRequest("http://test/api/admin/login", {
      body: { email: "admin1@test.com", password: "WRONG" },
      ip: "10.7.0.2",
    });
    const res = await adminLoginPOST(req);
    expect(res.status).toBe(401);

    const log = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_FAILED", entity: "AdminUser" },
    });
    expect(log).not.toBeNull();
  });

  it("logs in successfully and writes a LOGIN_SUCCESS audit log", async () => {
    await createAdmin({ email: "admin2@test.com", password: "good-pw" });
    const req = makeRequest("http://test/api/admin/login", {
      body: { email: "admin2@test.com", password: "good-pw" },
      ip: "10.7.0.3",
    });
    const res = await adminLoginPOST(req);
    expect(res.status).toBe(200);
    const body = (await readJson(res)) as { ok: boolean; admin: { email: string } };
    expect(body.ok).toBe(true);
    expect(body.admin.email).toBe("admin2@test.com");

    const log = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_SUCCESS", entity: "AdminUser" },
    });
    expect(log).not.toBeNull();
  });
});
