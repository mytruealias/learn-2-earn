import { test, expect } from "@playwright/test";

const SLUG = process.env.E2E_CITY_SLUG || "austin";
const VALID_PIN = process.env.E2E_CITY_PIN || process.env.AUSTIN_ACCESS_PIN || "";
const HAS_VALID_PIN = VALID_PIN.length > 0;

test.describe("City PIN gate", () => {
  test("locks out after 10 wrong attempts from the same client", async ({ request }) => {
    // Hits the real running server. Each request from this Playwright worker
    // shares one source IP, which is what the in-memory rate limiter buckets on.
    for (let i = 0; i < 10; i++) {
      const res = await request.post(`/api/city-access/${SLUG}`, {
        data: { pin: "000000" },
        failOnStatusCode: false,
      });
      // Any of the first 10 may already 429 if a previous run polluted state;
      // both 401 and 429 are acceptable here. The hard assertion is that the
      // 11th attempt is definitively locked out.
      expect([401, 429]).toContain(res.status());
    }

    const blocked = await request.post(`/api/city-access/${SLUG}`, {
      data: { pin: "000000" },
      failOnStatusCode: false,
    });
    expect(blocked.status()).toBe(429);
    const body = await blocked.json();
    expect(body.error?.code).toBe("rate_limited");
  });

  test("correct PIN returns 200 and sets the city cookie", async ({ request }) => {
    test.skip(!HAS_VALID_PIN, "AUSTIN_ACCESS_PIN / E2E_CITY_PIN not set");
    const res = await request.post(`/api/city-access/${SLUG}`, {
      data: { pin: VALID_PIN },
      failOnStatusCode: false,
    });
    if (res.status() === 429) {
      test.skip(true, "rate-limited by previous test; restart dev server to retry");
    }
    expect(res.status()).toBe(200);
    const cookies = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
    expect(cookies.some((c) => c.value.includes(`l2e_${SLUG}_access=`))).toBe(true);
  });
});

test.describe("Landing page", () => {
  test("server-rendered HTML contains a Book-a-Demo / contact CTA", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const html = (await res.text()).toLowerCase();
    expect(html).toMatch(/book a demo|request demo|contact/);
  });
});
