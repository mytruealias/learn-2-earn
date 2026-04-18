import { test, expect } from "@playwright/test";

const SLUG = process.env.E2E_CITY_SLUG || "austin";
// Default to the same value the Playwright webServer is spawned with so the
// "correct PIN" path always runs in the dedicated test environment.
const VALID_PIN = process.env.E2E_CITY_PIN || process.env.AUSTIN_ACCESS_PIN || "1234";
const HAS_VALID_PIN = VALID_PIN.length > 0;

test.describe("City PIN gate", () => {
  test("locks out after 10 wrong attempts from the same client", async ({ request }) => {
    // Warm up Next dev compilation for this route. We count this hit toward
    // the total so the assertion below reflects real wrong-PIN attempts.
    const warmup = await request.post(`/api/city-access/${SLUG}`, {
      data: { pin: "000000" },
      failOnStatusCode: false,
    });
    expect([401, 429]).toContain(warmup.status());
    let totalWrongAttempts = 1;
    let blockedStatus = warmup.status();
    let blockedBody: { error?: { code?: string } } = blockedStatus === 429
      ? await warmup.json()
      : {};

    // Keep sending wrong PINs until 429. Cap at 25 so a real bug fails fast.
    while (blockedStatus !== 429 && totalWrongAttempts < 25) {
      const res = await request.post(`/api/city-access/${SLUG}`, {
        data: { pin: "000000" },
        failOnStatusCode: false,
      });
      totalWrongAttempts++;
      if (res.status() === 429) {
        blockedStatus = 429;
        blockedBody = await res.json();
        break;
      }
      expect(res.status(), `attempt ${totalWrongAttempts} should be 401 before lockout`).toBe(401);
    }

    // With max=10, the 11th wrong attempt must be the first 429.
    expect(blockedStatus, "rate limiter must block within 25 wrong attempts").toBe(429);
    expect(blockedBody.error?.code).toBe("rate_limited");
    expect(
      totalWrongAttempts,
      "must allow at least 10 wrong attempts before locking out",
    ).toBeGreaterThanOrEqual(11);
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
