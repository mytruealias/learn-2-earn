import { describe, it, expect, beforeEach } from "vitest";
import { POST as cityPOST } from "@/app/api/city-access/[slug]/route";
import { makeRequest, readJson, getSetCookies, readCookie } from "../helpers/request";
import { clearDb } from "../helpers/factories";

function call(slug: string, pin: string, ip: string) {
  const req = makeRequest(`http://test/api/city-access/${slug}`, {
    body: { pin },
    ip,
  });
  return cityPOST(req, { params: Promise.resolve({ slug }) });
}

describe("city-access/[slug]", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("404s for an unknown city", async () => {
    const res = await call("nowhere", "1234", "10.6.0.1");
    expect(res.status).toBe(404);
  });

  it("401s for a wrong PIN and sets no cookie", async () => {
    const res = await call("austin", "0000", "10.6.0.2");
    expect(res.status).toBe(401);
    expect(readCookie(getSetCookies(res), "l2e_austin_access")).toBeNull();
  });

  it("200s for the correct PIN and sets the city cookie", async () => {
    const res = await call("austin", "1234", "10.6.0.3");
    expect(res.status).toBe(200);
    expect(readCookie(getSetCookies(res), "l2e_austin_access")).toBeTruthy();
  });

  it("locks out after 10 wrong PINs from the same IP", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await call("austin", "0000", "10.6.0.4");
      expect(res.status).toBe(401);
    }
    const locked = await call("austin", "0000", "10.6.0.4");
    expect(locked.status).toBe(429);
    const body = (await readJson(locked)) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
  });

  it("rate limit is per IP+city — different IP still allowed", async () => {
    for (let i = 0; i < 10; i++) {
      await call("austin", "0000", "10.6.0.5");
    }
    const otherIp = await call("austin", "1234", "10.6.0.6");
    expect(otherIp.status).toBe(200);
  });
});
