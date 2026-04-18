import { describe, it, expect, beforeEach } from "vitest";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as sessionPOST } from "@/app/api/auth/session/route";
import { makeRequest, readJson, getSetCookies, readCookie } from "../helpers/request";
import { clearDb, createUser } from "../helpers/factories";
import prisma from "@/lib/prisma";

describe("auth/register", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("creates a new user and sets a session cookie", async () => {
    const req = makeRequest("http://test/api/auth/register", {
      body: {
        email: "new@example.com",
        password: "password123",
        fullName: "New User",
      },
      ip: "10.0.0.1",
    });
    const res = await registerPOST(req);
    expect(res.status).toBe(200);
    const body = (await readJson(res)) as { ok: boolean; user: { email: string } };
    expect(body.ok).toBe(true);
    expect(body.user.email).toBe("new@example.com");

    const cookies = getSetCookies(res);
    expect(readCookie(cookies, "l2e_user_session")).toBeTruthy();

    const inDb = await prisma.user.findUnique({ where: { email: "new@example.com" } });
    expect(inDb).not.toBeNull();
  });

  it("rejects duplicate emails with 409", async () => {
    await createUser({ email: "dupe@example.com" });
    const req = makeRequest("http://test/api/auth/register", {
      body: { email: "dupe@example.com", password: "password123", fullName: "Dup" },
      ip: "10.0.0.2",
    });
    const res = await registerPOST(req);
    expect(res.status).toBe(409);
    const body = (await readJson(res)) as { error: { code: string } };
    expect(body.error.code).toBe("conflict");
  });

  it("rejects malformed email with 400 validation_error", async () => {
    const req = makeRequest("http://test/api/auth/register", {
      body: { email: "not-an-email", password: "password123", fullName: "X" },
      ip: "10.0.0.3",
    });
    const res = await registerPOST(req);
    expect(res.status).toBe(400);
    const body = (await readJson(res)) as { error: { code: string } };
    expect(body.error.code).toBe("validation_error");
  });

  it("rejects invalid JSON body", async () => {
    const req = new Request("http://test/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.4" },
      body: "{not json",
    });
    const res = await registerPOST(req);
    expect(res.status).toBe(400);
    const body = (await readJson(res)) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_json");
  });
});

describe("auth/login", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("returns 401 for unknown email", async () => {
    const req = makeRequest("http://test/api/auth/login", {
      body: { email: "ghost@example.com", password: "anything" },
      ip: "10.0.1.1",
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong password", async () => {
    await createUser({ email: "right@example.com", password: "correct-pw" });
    const req = makeRequest("http://test/api/auth/login", {
      body: { email: "right@example.com", password: "wrong-pw" },
      ip: "10.0.1.2",
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  it("logs in and sets session cookie on success", async () => {
    await createUser({ email: "ok@example.com", password: "good-pw-1" });
    const req = makeRequest("http://test/api/auth/login", {
      body: { email: "ok@example.com", password: "good-pw-1" },
      ip: "10.0.1.3",
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(200);
    const cookies = getSetCookies(res);
    expect(readCookie(cookies, "l2e_user_session")).toBeTruthy();
  });
});

describe("auth/session", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("returns 401 when unauthenticated", async () => {
    const req = makeRequest("http://test/api/auth/session", { body: {} });
    const res = await sessionPOST(req);
    expect(res.status).toBe(401);
    const body = (await readJson(res)) as { error: { code: string } };
    expect(body.error.code).toBe("unauthorized");
  });

  it("rejects a tampered session cookie with 401", async () => {
    const sessReq = makeRequest("http://test/api/auth/session", {
      body: {},
      cookies: { l2e_user_session: "not-a-real-token.deadbeef" },
    });
    const sessRes = await sessionPOST(sessReq);
    expect(sessRes.status).toBe(401);
  });

  it("returns user when given a valid session cookie", async () => {
    const { user } = await createUser({ email: "sess@example.com" });

    // Mint a session cookie by registering, then re-use
    const regReq = makeRequest("http://test/api/auth/register", {
      body: { email: "sess2@example.com", password: "password123", fullName: "S" },
      ip: "10.0.2.1",
    });
    const regRes = await registerPOST(regReq);
    const cookieVal = readCookie(getSetCookies(regRes), "l2e_user_session")!;

    const sessReq = makeRequest("http://test/api/auth/session", {
      body: {},
      cookies: { l2e_user_session: cookieVal },
    });
    const sessRes = await sessionPOST(sessReq);
    expect(sessRes.status).toBe(200);
    const body = (await readJson(sessRes)) as { user: { email: string } | null };
    expect(body.user?.email).toBe("sess2@example.com");

    // Touch unused var so factory result still validates user creation
    expect(user.email).toBe("sess@example.com");
  });
});
