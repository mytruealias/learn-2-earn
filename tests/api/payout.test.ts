import { describe, it, expect, beforeEach } from "vitest";
import { POST as payoutPOST } from "@/app/api/payout/request/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { makeRequest, readJson, getSetCookies, readCookie } from "../helpers/request";
import { clearDb, createUser } from "../helpers/factories";
import prisma from "@/lib/prisma";

async function loggedInCookie(email: string): Promise<string> {
  const res = await registerPOST(
    makeRequest("http://test/api/auth/register", {
      body: { email, password: "password123", fullName: "P User" },
      ip: "10.5.0.1",
    })
  );
  return readCookie(getSetCookies(res), "l2e_user_session")!;
}

describe("payout/request", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("requires a session", async () => {
    const req = makeRequest("http://test/api/payout/request", {
      body: { xpAmount: 100, paymentMethod: "venmo", paymentHandle: "@me" },
    });
    const res = await payoutPOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects unsupported paymentMethod (e.g. zelle)", async () => {
    const cookie = await loggedInCookie("zelle@example.com");
    const req = makeRequest("http://test/api/payout/request", {
      body: { xpAmount: 100, paymentMethod: "zelle", paymentHandle: "x" },
      cookies: { l2e_user_session: cookie },
    });
    const res = await payoutPOST(req);
    expect(res.status).toBe(400);
    const body = (await readJson(res)) as { error: { code: string } };
    expect(body.error.code).toBe("validation_error");
  });

  it("rejects when XP balance is too low", async () => {
    const cookie = await loggedInCookie("broke@example.com");
    const req = makeRequest("http://test/api/payout/request", {
      body: { xpAmount: 100, paymentMethod: "venmo", paymentHandle: "@me" },
      cookies: { l2e_user_session: cookie },
    });
    const res = await payoutPOST(req);
    expect(res.status).toBe(400);
    const body = (await readJson(res)) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("bad_request");
  });

  it("creates a pending payout when balance is sufficient", async () => {
    const cookie = await loggedInCookie("rich@example.com");
    await prisma.user.update({
      where: { email: "rich@example.com" },
      data: { totalXp: 500 },
    });

    const req = makeRequest("http://test/api/payout/request", {
      body: { xpAmount: 100, paymentMethod: "venmo", paymentHandle: "@richy" },
      cookies: { l2e_user_session: cookie },
    });
    const res = await payoutPOST(req);
    expect(res.status).toBe(200);
    const body = (await readJson(res)) as { payout: { status: string; xpAmount: number } };
    expect(body.payout.status).toBe("pending");
    expect(body.payout.xpAmount).toBe(100);

    const inDb = await prisma.payoutRequest.count({ where: { status: "pending" } });
    expect(inDb).toBe(1);
  });

  it("enforces the weekly XP cap across multiple requests", async () => {
    const cookie = await loggedInCookie("weekly@example.com");
    await prisma.user.update({
      where: { email: "weekly@example.com" },
      data: { totalXp: 10000 },
    });

    // Default weeklyXpCap = 500. First request for 400 should succeed,
    // second for 200 should be rejected (would bring weekly total to 600).
    const first = await payoutPOST(
      makeRequest("http://test/api/payout/request", {
        body: { xpAmount: 400, paymentMethod: "venmo", paymentHandle: "@w" },
        cookies: { l2e_user_session: cookie },
      })
    );
    expect(first.status).toBe(200);

    const second = await payoutPOST(
      makeRequest("http://test/api/payout/request", {
        body: { xpAmount: 200, paymentMethod: "venmo", paymentHandle: "@w" },
        cookies: { l2e_user_session: cookie },
      })
    );
    expect(second.status).toBe(400);
    const body = (await readJson(second)) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("bad_request");
    expect(body.error.message.toLowerCase()).toContain("weekly");
  });

  it("rejects body userId mismatches session userId", async () => {
    const cookie = await loggedInCookie("a@example.com");
    const { user: other } = await createUser({ email: "b@example.com", totalXp: 1000 });
    const req = makeRequest("http://test/api/payout/request", {
      body: {
        userId: other.id,
        xpAmount: 100,
        paymentMethod: "venmo",
        paymentHandle: "@x",
      },
      cookies: { l2e_user_session: cookie },
    });
    const res = await payoutPOST(req);
    expect(res.status).toBe(403);
  });
});
