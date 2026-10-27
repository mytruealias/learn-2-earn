import { beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { POST as ensure } from "@/app/api/user/ensure/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import {
  GET as identity,
  DELETE as logout,
  POST as profile,
} from "@/app/api/auth/session/route";
import { POST as onboarding } from "@/app/api/user/onboarding/route";
import { POST as complete } from "@/app/api/progress/complete/route";
import { getUserIdFromRequest, setUserSessionCookie } from "@/lib/user-session";
import { assertTestDatabase } from "@/lib/test-database-safety";
import { apiOk } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { clearDb, createLesson, createUser } from "../helpers/factories";
import {
  getSetCookies,
  makeInvitedRequest,
  makeRequest,
  readCookie,
} from "../helpers/request";
let ip = 100;
const body = (email = "new@identity.test") => ({
  fullName: "Synthetic learner",
  email,
  password: "disposable-password",
});
const cookie = (response: Response) =>
  readCookie(getSetCookies(response), "l2e_user_session")!;
const request = (path: string, token?: string, data: object = {}) =>
  makeRequest(`http://test/api/${path}`, {
    body: data,
    cookies: token ? { l2e_user_session: token } : {},
    ip: `10.11.0.${ip++}`,
  });
async function guest() {
  const response = await ensure(
    makeInvitedRequest("http://test/api/user/ensure", {
      body: {},
      ip: `10.12.0.${ip++}`,
    }),
  );
  expect(response.status).toBe(200);
  return {
    token: cookie(response),
    id: (await response.json()).actualUserId as string,
  };
}
function legacy(
  id: string,
  time = Date.now(),
  key = process.env.SESSION_SECRET!,
) {
  const payload = `${id}:${time}`;
  return `${Buffer.from(payload).toString("base64")}.${createHmac("sha256", key).update(payload).digest("hex")}`;
}
describe("learner identity boundary and account continuity", () => {
  beforeEach(clearDb);
  it("requires invitation for new guests and registration", async () => {
    expect((await ensure(request("user/ensure"))).status).toBe(403);
    expect(
      (await register(request("auth/register", undefined, body()))).status,
    ).toBe(403);
    expect(await prisma.user.count()).toBe(0);
  });
  it("never mints an identity from a client ID, including an existing account or guest", async () => {
    const { user } = await createUser();
    const g = await guest();
    for (const id of [user.id, g.id, "arbitrary-client-id"]) {
      const response = await ensure(
        makeInvitedRequest("http://test/api/user/ensure", {
          body: { userId: id },
        }),
      );
      expect(response.status).toBe(400);
      expect(getSetCookies(response)).toEqual([]);
    }
    expect(await prisma.user.count()).toBe(2);
  });
  it("issues one server identity and resumes it using only its cookie", async () => {
    const g = await guest();
    const response = await ensure(request("user/ensure", g.token));
    expect((await response.json()).actualUserId).toBe(g.id);
    expect(await prisma.user.count()).toBe(1);
    expect(await getUserIdFromRequest(request("auth/session", g.token))).toBe(
      g.id,
    );
    expect(await prisma.learnerSession.count()).toBe(1);
  });
  it("rejects arbitrary guest association without altering the target", async () => {
    const g = await guest();
    const before = await prisma.user.findUnique({ where: { id: g.id } });
    const response = await register(
      makeInvitedRequest("http://test/api/auth/register", {
        body: { ...body(), guestId: g.id },
      }),
    );
    expect(response.status).toBe(400);
    expect(await prisma.user.findUnique({ where: { id: g.id } })).toEqual(
      before,
    );
  });
  it("promotes the proven guest in place, preserving progress, XP, history, details and consent", async () => {
    const g = await guest();
    const { lesson } = await createLesson({ xpReward: 13 });
    expect(
      (
        await complete(
          request("progress/complete", g.token, { lessonId: lesson.id }),
        )
      ).status,
    ).toBe(200);
    await prisma.user.update({
      where: { id: g.id },
      data: {
        city: "Existing synthetic city",
        phone: "Synthetic retained value",
      },
    });
    await prisma.payoutRequest.create({
      data: {
        userId: g.id,
        xpAmount: 3,
        dollarAmount: 0.15,
        status: "completed",
      },
    });
    await prisma.consentRecord.create({
      data: { userId: g.id, consentType: "existing-test-record" },
    });
    const progress = await prisma.progress.findMany(),
      payouts = await prisma.payoutRequest.findMany(),
      consents = await prisma.consentRecord.findMany();
    const response = await register(request("auth/register", g.token, body()));
    expect(response.status).toBe(200);
    expect((await response.json()).user.id).toBe(g.id);
    expect(await prisma.user.count()).toBe(1);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: g.id } });
    expect(user.totalXp).toBe(13);
    expect(user.city).toBe("Existing synthetic city");
    expect(user.phone).toBe("Synthetic retained value");
    expect(user.onboardingState).toBe("pending-v1");
    expect(await prisma.progress.findMany()).toEqual(progress);
    expect(await prisma.payoutRequest.findMany()).toEqual(payouts);
    expect(await prisma.consentRecord.findMany()).toEqual(consents);
    expect(
      await getUserIdFromRequest(request("auth/session", g.token)),
    ).toBeNull();
    expect(
      await getUserIdFromRequest(request("auth/session", cookie(response))),
    ).toBe(g.id);
  });
  it("serializes concurrent guest account creation without overwriting credentials", async () => {
    const g = await guest();
    const responses = await Promise.all([
      register(request("auth/register", g.token, body("first@identity.test"))),
      register(request("auth/register", g.token, body("second@identity.test"))),
    ]);
    expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
    expect(responses.some((r) => [401, 409].includes(r.status))).toBe(true);
    expect(await prisma.user.count()).toBe(1);
    expect(
      await prisma.auditLog.count({ where: { action: "USER_REGISTERED" } }),
    ).toBe(1);
  });
  it("makes a committed signup retry safe, without changing password or creating another account", async () => {
    const first = await register(
      makeInvitedRequest("http://test/api/auth/register", {
        body: body(),
        ip: `10.13.0.${ip++}`,
      }),
    );
    const token = cookie(first);
    const before = await prisma.user.findFirstOrThrow();
    const retry = await register(
      request("auth/register", token, {
        ...body(),
        password: "replacement-password",
        fullName: "Changed name",
      }),
    );
    expect(retry.status).toBe(200);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.user.findFirst()).toEqual(before);
    expect(
      (
        await register(
          request("auth/register", token, body("another@identity.test")),
        )
      ).status,
    ).toBe(409);
  });
  it("rejects duplicate concurrent anonymous registrations with a recoverable conflict", async () => {
    const responses = await Promise.all(
      [1, 2].map(() =>
        register(
          makeInvitedRequest("http://test/api/auth/register", {
            body: body(),
            ip: `10.14.0.${ip++}`,
          }),
        ),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.user.count()).toBe(1);
  });
  it("revokes a copied token on logout while preserving another device's session and all data", async () => {
    const { user } = await createUser({
      email: "logout@identity.test",
      password: "valid-password",
    });
    const first = await login(
      request("auth/login", undefined, {
        email: user.email,
        password: "valid-password",
      }),
    );
    const second = await login(
      request("auth/login", undefined, {
        email: user.email,
        password: "valid-password",
      }),
    );
    expect((await logout(request("auth/session", cookie(first)))).status).toBe(
      200,
    );
    expect((await profile(request("auth/session", cookie(first)))).status).toBe(
      401,
    );
    expect(
      (await profile(request("auth/session", cookie(second)))).status,
    ).toBe(200);
    expect(await prisma.user.count()).toBe(1);
  });
  it("enforces server expiry, rejects forged flags, and never replaces an expired session with a new guest", async () => {
    const g = await guest();
    await prisma.learnerSession.updateMany({
      data: { expiresAt: new Date(0) },
    });
    expect(
      await getUserIdFromRequest(request("auth/session", g.token)),
    ).toBeNull();
    expect(
      (
        await ensure(
          makeInvitedRequest("http://test/api/user/ensure", {
            body: {},
            cookies: { l2e_user_session: g.token },
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await profile(
          request("auth/session", legacy(g.id, Date.now() - 31 * 86400000)),
        )
      ).status,
    ).toBe(401);
    expect(
      await getUserIdFromRequest(
        request(
          "auth/session",
          legacy(g.id, Date.now(), process.env.DEMO_ACCESS_CODE),
        ),
      ),
    ).toBeNull();
    expect(await prisma.user.count()).toBe(1);
  });
  it("preserves a valid legacy guest, rejects legacy registered tokens, and revokes upgraded legacy cookies", async () => {
    const guestUser = await prisma.user.create({
      data: { guestId: "old-browser-guest", totalXp: 9 },
    });
    const old = legacy(guestUser.id);
    expect(await getUserIdFromRequest(request("auth/session", old))).toBe(
      guestUser.id,
    );
    const response = await register(request("auth/register", old, body()));
    expect(response.status).toBe(200);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: guestUser.id } }))
        .totalXp,
    ).toBe(9);
    expect(await getUserIdFromRequest(request("auth/session", old))).toBeNull();
    expect(
      await getUserIdFromRequest(request("auth/session", legacy(guestUser.id))),
    ).toBeNull();
  });
  it("cannot bypass legacy guest logout with an equivalent cookie encoding", async () => {
    const user = await prisma.user.create({
      data: { id: "legacy-guest", guestId: "old-device" },
    });
    const original = legacy(user.id);
    const [encoded, signature] = original.split(".");
    const alternate = `${Buffer.from(encoded, "base64").toString("base64url")}.${signature}`;
    expect(await getUserIdFromRequest(request("auth/session", encodeURIComponent(original + "\n")))).toBeNull();
    expect(
      await getUserIdFromRequest(
        request("auth/session", encodeURIComponent(original)),
      ),
    ).toBe(user.id);
    expect((await logout(request("auth/session", original))).status).toBe(200);
    expect(
      await getUserIdFromRequest(request("auth/session", alternate)),
    ).toBeNull();
  });
  it("checks the incoming host and TLS proxy origin instead of an internal framework URL", async () => {
    const response = await ensure(
      makeInvitedRequest("http://internal:5000/api/user/ensure", {
        body: {},
        ip: `10.16.0.${ip++}`,
        headers: {
          host: "app.example.test",
          "x-forwarded-proto": "https",
          origin: "https://app.example.test",
        },
      }),
    );
    expect(response.status).toBe(200);
    const denied = await ensure(
      makeInvitedRequest("http://internal:5000/api/user/ensure", {
        body: {},
        headers: {
          host: "app.example.test",
          "x-forwarded-proto": "https",
          origin: "https://other.example.test",
        },
      }),
    );
    expect(denied.status).toBe(403);
  });
  it("does not accept disabled accounts through login or an existing session", async () => {
    const { user } = await createUser({
      email: "disabled@identity.test",
      password: "valid-password",
    });
    const res = apiOk();
    await setUserSessionCookie(res, user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });
    expect(
      await getUserIdFromRequest(request("auth/session", cookie(res))),
    ).toBeNull();
    expect(
      (
        await login(
          request("auth/login", undefined, {
            email: user.email,
            password: "valid-password",
          }),
        )
      ).status,
    ).toBe(401);
  });
  it("returns a minimal private no-store identity description and no profile to anonymous visitors", async () => {
    expect(await (await identity(request("auth/session"))).json()).toEqual({
      ok: true,
      user: null,
    });
    const g = await guest();
    const response = await identity(request("auth/session", g.token));
    const data = await response.json();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(data.user.kind).toBe("guest");
    for (const key of [
      "email",
      "fullName",
      "dateOfBirth",
      "phone",
      "payoutRequests",
      "availableBalance",
    ])
      expect(data.user).not.toHaveProperty(key);
  });
  it("saves optional onboarding once and safely resumes after reload/retry", async () => {
    const response = await register(
      makeInvitedRequest("http://test/api/auth/register", {
        body: body(),
        ip: `10.15.0.${ip++}`,
      }),
    );
    const token = cookie(response);
    expect(
      (await onboarding(request("user/onboarding", token, { goal: "short" })))
        .status,
    ).toBe(200);
    expect(
      (await onboarding(request("user/onboarding", token, { goal: "routine" })))
        .status,
    ).toBe(200);
    const user = await prisma.user.findFirstOrThrow();
    expect(user.learningGoal).toBe("short");
    expect(user.onboardingState).toBe("complete-v1");
    expect(
      (
        await onboarding(
          request("user/onboarding", token, { goal: "sensitive-free-text" }),
        )
      ).status,
    ).toBe(400);
  });
  it("rejects cross-origin auth and bootstrap mutations", async () => {
    for (const handler of [ensure, register, login, logout, onboarding]) {
      const response = await handler(
        makeInvitedRequest("http://test/api/auth", {
          body: body(),
          headers: { origin: "https://untrusted.example" },
        }),
      );
      expect(response.status).toBe(403);
    }
    expect(await prisma.user.count()).toBe(0);
  });
  it("applies the additive migration to an existing schema without changing accounts or money/history", async () => {
    await assertTestDatabase(prisma);
    const { user } = await createUser({ totalXp: 17 });
    const { lesson } = await createLesson();
    await prisma.progress.create({
      data: { userId: user.id, lessonId: lesson.id, xpEarned: 17 },
    });
    await prisma.payoutRequest.create({
      data: {
        userId: user.id,
        xpAmount: 5,
        dollarAmount: 0.25,
        status: "completed",
      },
    });
    const before = {
      user: await prisma.user.findUnique({ where: { id: user.id } }),
      progress: await prisma.progress.findMany(),
      payout: await prisma.payoutRequest.findMany(),
    };
    const rollback = new Error(
      "verified rollback of disposable migration exercise",
    );
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('DROP TABLE "LearnerSession"');
        await tx.$executeRawUnsafe(
          'ALTER TABLE "User" DROP COLUMN "onboardingState", DROP COLUMN "learningGoal"',
        );
        const sql = readFileSync(
          "prisma/migrations/20261027000000_learner_sessions_onboarding/migration.sql",
          "utf8",
        );
        for (const statement of sql
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean))
          await tx.$executeRawUnsafe(statement);
        expect({
          user: await tx.user.findUnique({ where: { id: user.id } }),
          progress: await tx.progress.findMany(),
          payout: await tx.payoutRequest.findMany(),
        }).toEqual(before);
        expect(await tx.learnerSession.count()).toBe(0);
        throw rollback;
      }),
    ).rejects.toThrow(rollback);
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toEqual(
      before.user,
    );
  });
});
