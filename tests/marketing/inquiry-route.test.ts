import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const storage = vi.hoisted(() => ({ database: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/marketing/inquiries", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/marketing/inquiries")>();
  return {
    ...actual,
    inquiryDatabase: storage.database,
    saveInquiry: storage.save,
  };
});
import { POST, GET } from "@/app/api/partner-inquiries/route";
import { InquiryIssue } from "@/lib/marketing/inquiries";
const input = () => ({
  requestKey: crypto.randomUUID(),
  fullName: "Synthetic contact",
  organization: "Synthetic partner",
  email: "contact@example.test",
  interest: "pilot",
  consent: true,
});
const request = (data: unknown, headers: Record<string, string> = {}) =>
  new Request("http://test/api/partner-inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
function configured() {
  for (const [k, v] of Object.entries({
    SESSION_SECRET: "synthetic-private-test-key",
    PARTNER_INQUIRY_PROGRAM_ID: "synthetic-program",
    PARTNER_INQUIRY_TEAM_NAME: "Synthetic intake team",
    PARTNER_INQUIRY_MONITORING_NOTICE:
      "Weekdays 09:00–17:00 UTC; no response guarantee",
    PARTNER_INQUIRY_REVIEW_REFERENCE: "synthetic-reviewed-test",
  }))
    vi.stubEnv(k, v);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PARTNER_INQUIRY_PROGRAM_ID", "");
  storage.database.mockResolvedValue({ synthetic: true });
});
afterEach(() => vi.unstubAllEnvs());
describe("real inquiry route with mocked persistence — no delivery/provider", () => {
  it("reports unconfigured intake honestly without private configuration or storage", async () => {
    const get = await (await GET()).json();
    expect(get.configured).toBe(false);
    expect(get.programId).toBeUndefined();
    expect((await POST(request(input()))).status).toBe(503);
    expect(storage.database).not.toHaveBeenCalled();
  });
  it("validates roles/extra routing, consent, fields and byte limit before persistence", async () => {
    configured();
    for (const d of [
      { ...input(), programId: "foreign" },
      { ...input(), consent: false },
      { ...input(), email: "bad" },
      { ...input(), fullName: " " },
    ])
      expect((await POST(request(d))).status).toBe(400);
    expect(
      (await POST(request({ ...input(), message: "x".repeat(9000) }))).status,
    ).toBe(413);
    expect(storage.database).not.toHaveBeenCalled();
  });
  it("rejects foreign origins before storage", async () => {
    configured();
    expect(
      (await POST(request(input(), { origin: "https://foreign.example" })))
        .status,
    ).toBe(403);
    expect(storage.database).not.toHaveBeenCalled();
  });
  it("returns only a server-confirmed stored receipt, without email or booking claims", async () => {
    configured();
    storage.save.mockResolvedValue({
      receipt: {
        reference: "synthetic-reference",
        savedAt: "2026-11-01T12:00:00.000Z",
        state: "saved",
        notificationSent: false,
        bookingCreated: false,
      },
      replayed: false,
    });
    const r = await POST(request(input()));
    expect(r.ok).toBe(true);
    const d = await r.json();
    expect(d.receipt).toMatchObject({
      state: "saved",
      notificationSent: false,
      bookingCreated: false,
    });
    expect(d.email).toBeUndefined();
    expect(storage.save.mock.calls[0][2].programId).toBe("synthetic-program");
    expect(r.headers.get("Cache-Control")).toContain("no-store");
  });
  it("exposes rate/conflict errors and never turns uncertain persistence into fake success or raw logs", async () => {
    configured();
    storage.save.mockRejectedValue(
      new InquiryIssue("rate_limited", "Synthetic rate limit", 429),
    );
    const limited = await POST(request(input()));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("3600");
    storage.save.mockRejectedValue(
      new InquiryIssue("conflict", "Synthetic intent mismatch", 409),
    );
    expect((await POST(request(input()))).status).toBe(409);
    storage.save.mockRejectedValue(
      new Error("synthetic private persistence details"),
    );
    const r = await POST(request(input()));
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("private persistence");
  });
});
