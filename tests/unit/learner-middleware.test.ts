import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { middleware } from "../../middleware";
const originalDomain = process.env.ROOT_DOMAIN,
  originalSecret = process.env.SESSION_SECRET;
afterEach(() => {
  if (originalDomain === undefined) delete process.env.ROOT_DOMAIN;
  else process.env.ROOT_DOMAIN = originalDomain;
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});
const signingKey = "isolated-middleware-signing-key";
function token(time: number) {
  const payload = `user:synthetic-learner:${time}:${"a".repeat(64)}`;
  return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", signingKey).update(payload).digest("hex")}`;
}
describe("learner middleware gate", () => {
  it("keeps privacy and terms reachable on the public, learner and staff hosts", async () => {
    process.env.ROOT_DOMAIN = "example.test";
    for (const host of [
      "example.test",
      "app.example.test",
      "admin.example.test",
    ]) {
      for (const path of ["/privacy", "/terms"]) {
        const response = await middleware(
          new NextRequest(`https://${host}${path}`, { headers: { host } }),
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("x-robots-tag")).toBeNull();
      }
    }
  });
  it("does not accept cookie presence, an expired signature or a future timestamp as a bypass", async () => {
    delete process.env.ROOT_DOMAIN;
    process.env.SESSION_SECRET = signingKey;
    for (const value of [
      "arbitrary-cookie-value",
      token(Date.now() - 31 * 86400000),
      token(Date.now() + 120000),
    ]) {
      const response = await middleware(
        new NextRequest("http://local.test/profile", {
          headers: { cookie: `l2e_user_session=${value}` },
        }),
      );
      const destination = new URL(response.headers.get("location")!);
      expect(destination.pathname).toBe("/login");
      expect(destination.searchParams.get("reason")).toBe("expired");
      expect(destination.searchParams.get("next")).toBe("/profile");
    }
  });
  it("lets a current signed token reach server DB authorization and marks private pages no-store", async () => {
    delete process.env.ROOT_DOMAIN;
    process.env.SESSION_SECRET = signingKey;
    const response = await middleware(
      new NextRequest("http://local.test/app", {
        headers: { cookie: `l2e_user_session=${token(Date.now())}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
});
