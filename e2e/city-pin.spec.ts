import { test, expect } from "@playwright/test";

const SLUG = process.env.E2E_CITY_SLUG || "austin";
// Default to the value the Playwright webServer is spawned with so the
// happy-path test always runs in the dedicated test environment.
const VALID_PIN = process.env.E2E_CITY_PIN || process.env.AUSTIN_ACCESS_PIN || "1234";

// Each test uses its own X-Forwarded-For so the in-memory rate limiter
// (keyed by IP+city) treats them as different clients. This prevents the
// lockout test from polluting the happy-path test.
const LOCKOUT_IP = "10.0.0.1";
const HAPPY_IP = "10.0.0.2";
const LANDING_IP = "10.0.0.3";

test.describe("City PIN gate", () => {
  test("rejects exactly 10 wrong attempts then locks out on the 11th", async ({ request }) => {
    // Warm up Next dev compilation for this route from a *different* IP so
    // it doesn't consume budget against LOCKOUT_IP's bucket.
    await request.post(`/api/city-access/${SLUG}`, {
      headers: { "x-forwarded-for": "10.99.99.99" },
      data: { pin: "000000" },
      failOnStatusCode: false,
    });

    // Attempts 1..10 must each return 401 (allowed-but-wrong).
    for (let i = 1; i <= 10; i++) {
      const res = await request.post(`/api/city-access/${SLUG}`, {
        headers: { "x-forwarded-for": LOCKOUT_IP },
        data: { pin: "000000" },
        failOnStatusCode: false,
      });
      expect(res.status(), `attempt ${i} (of 10 allowed) must be 401`).toBe(401);
    }

    // Attempt 11 must be 429 with rate_limited error code.
    const blocked = await request.post(`/api/city-access/${SLUG}`, {
      headers: { "x-forwarded-for": LOCKOUT_IP },
      data: { pin: "000000" },
      failOnStatusCode: false,
    });
    expect(blocked.status(), "11th attempt must be rate-limited").toBe(429);
    expect(blocked.headers()["retry-after"]).toBeTruthy();
    const blockedBody = await blocked.json();
    expect(blockedBody.error?.code).toBe("rate_limited");
  });

  test("correct PIN returns 200 and sets the city cookie", async ({ request }) => {
    // Uses a separate forwarded IP from the lockout test so this never
    // races into the same bucket. Always runs.
    const res = await request.post(`/api/city-access/${SLUG}`, {
      headers: { "x-forwarded-for": HAPPY_IP },
      data: { pin: VALID_PIN },
      failOnStatusCode: false,
    });
    expect(res.status(), "happy-path PIN must succeed (independent IP)").toBe(200);
    const cookies = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
    expect(
      cookies.some((c) => c.value.includes(`l2e_${SLUG}_access=`)),
      "expected l2e_<slug>_access cookie",
    ).toBe(true);
  });
});

test.describe("Landing page", () => {
  test("partner pilot CTA points to the real inquiry section", async ({ request }) => {
    const landing = await request.get("/", { headers: { "x-forwarded-for": LANDING_IP } });
    expect(landing.status()).toBe(200);
    const html = await landing.text();
    const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const primary = anchors.find(m => m[2].replace(/<[^>]+>/g, "").trim() === "Discuss a pilot");
    expect(primary?.[1]).toBe("/#contact");
    expect(html).toMatch(/id=["']contact["']/);
    // The CTA opens a real form section, without promising a booked meeting.
    expect(html).toContain("Save partner inquiry");
  });

  test("primary navigation links resolve", async ({ request }) => {
    const landing = await request.get("/", {
      headers: { "x-forwarded-for": LANDING_IP },
    });
    expect(landing.status()).toBe(200);
    const html = await landing.text();

    // Pull every internal anchor href from the landing HTML, then probe
    // each unique route-style link to make sure it's actually reachable
    // (200 or a redirect). Skips hash-only fragments, mailto/tel, and
    // external links — those are validated separately above when they
    // happen to be the CTA.
    const internal = new Set<string>();
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const h = m[1];
      if (h.startsWith("/") && !h.startsWith("//")) {
        internal.add(h.split("#")[0]);
      }
    }
    expect(internal.size, "landing page must expose at least one internal nav link").toBeGreaterThan(
      0,
    );

    for (const href of internal) {
      if (!href) continue;
      const probe = await request.get(href, {
        headers: { "x-forwarded-for": LANDING_IP },
        maxRedirects: 0,
      });
      expect(
        [200, 301, 302, 303, 307, 308].includes(probe.status()),
        `nav link ${href} must resolve (got ${probe.status()})`,
      ).toBe(true);
    }
  });
});
