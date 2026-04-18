import { describe, it, expect, beforeEach } from "vitest";
import { POST as accessPOST } from "@/app/api/access/route";
import { makeRequest, readJson, getSetCookies, readCookie } from "../helpers/request";
import { clearDb } from "../helpers/factories";

describe("access (demo gate)", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("rejects wrong code with 401", async () => {
    const res = await accessPOST(
      makeRequest("http://test/api/access", { body: { code: "WRONG" }, ip: "10.9.0.1" })
    );
    expect(res.status).toBe(401);
  });

  it("accepts correct code (case-insensitive) and sets demo cookie", async () => {
    const res = await accessPOST(
      makeRequest("http://test/api/access", {
        body: { code: process.env.DEMO_ACCESS_CODE!.toLowerCase() },
        ip: "10.9.0.2",
      })
    );
    expect(res.status).toBe(200);
    expect(readCookie(getSetCookies(res), "l2e_demo_access")).toBeTruthy();
  });

  it("locks out after 15 wrong attempts from the same IP", async () => {
    for (let i = 0; i < 15; i++) {
      await accessPOST(
        makeRequest("http://test/api/access", { body: { code: "BAD" }, ip: "10.9.0.3" })
      );
    }
    const blocked = await accessPOST(
      makeRequest("http://test/api/access", { body: { code: "BAD" }, ip: "10.9.0.3" })
    );
    expect(blocked.status).toBe(429);
    const body = (await readJson(blocked)) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
  });
});
