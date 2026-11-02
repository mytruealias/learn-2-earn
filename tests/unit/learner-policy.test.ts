import { describe, expect, it } from "vitest";
import { safeLearnerDestination } from "../../lib/learner-navigation";
import { parseSessionPayload } from "../../lib/session-policy";
describe("learner redirect policy", () => {
  it.each([
    "https://untrusted.example/",
    "//untrusted.example",
    "/\\untrusted.example",
    "/%2f%2funtrusted.example",
    "/api/auth/session",
    "/admin",
    "/login",
    "/access",
    "/app?next=https://untrusted.example",
    "/app\n",
    "/profile\n",
    "/profile\t",
    "/\u0000profile",
    ["/profile"],
    undefined,
  ])("rejects unsafe next destinations %#", (value) => {
    expect(safeLearnerDestination(value)).toBe("/app");
  });
  it.each([
    "/app",
    "/profile",
    "/profile?tab=earnings",
    "/lifeline",
    "/paths/stability",
    "/lesson/abc_123",
  ])("retains supported destinations %s", (value) => {
    expect(safeLearnerDestination(value)).toBe(value);
  });
});
describe("server session timestamp policy", () => {
  const now = 1800000000000;
  it("accepts current sessions and expiring legacy guests only within the original window", () => {
    expect(
      parseSessionPayload(`user:abc:${now}:${"a".repeat(64)}`, now)?.legacy,
    ).toBe(false);
    expect(parseSessionPayload(`abc:${now}`, now)?.legacy).toBe(true);
    expect(parseSessionPayload(`abc:${now - 30 * 86400000}`, now)).toBeNull();
    expect(parseSessionPayload(`abc:${now + 120000}`, now)).toBeNull();
    expect(parseSessionPayload(`abc:${now}junk`, now)).toBeNull();
    expect(parseSessionPayload(`abc:${now}:unrecognized`, now)).toBeNull();
  });
});
