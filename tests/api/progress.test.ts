import { describe, it, expect, beforeEach } from "vitest";
import { POST as progressPOST } from "@/app/api/progress/complete/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { makeRequest, readJson, getSetCookies, readCookie } from "../helpers/request";
import { clearDb, createLesson } from "../helpers/factories";
import prisma from "@/lib/prisma";

async function signupAndGet(email: string): Promise<{ cookie: string; userId: string }> {
  const res = await registerPOST(
    makeRequest("http://test/api/auth/register", {
      body: { email, password: "password123", fullName: "PG" },
      ip: "10.8.0.1",
    })
  );
  const cookie = readCookie(getSetCookies(res), "l2e_user_session")!;
  const body = (await readJson(res)) as { user: { id: string } };
  return { cookie, userId: body.user.id };
}

describe("progress/complete", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("requires a session", async () => {
    const req = makeRequest("http://test/api/progress/complete", {
      body: { userId: "x", lessonId: "y" },
    });
    const res = await progressPOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects when body userId mismatches session", async () => {
    const { cookie } = await signupAndGet("p1@example.com");
    const req = makeRequest("http://test/api/progress/complete", {
      body: { userId: "someone-else", lessonId: "doesnt-matter" },
      cookies: { l2e_user_session: cookie },
    });
    const res = await progressPOST(req);
    expect(res.status).toBe(403);
  });

  it("404s for unknown lesson", async () => {
    const { cookie, userId } = await signupAndGet("p2@example.com");
    const req = makeRequest("http://test/api/progress/complete", {
      body: { userId, lessonId: "nope" },
      cookies: { l2e_user_session: cookie },
    });
    const res = await progressPOST(req);
    expect(res.status).toBe(404);
  });

  it("awards XP for a real lesson and updates totalXp", async () => {
    const { cookie, userId } = await signupAndGet("p3@example.com");
    const { lesson } = await createLesson({ xpReward: 25 });

    const req = makeRequest("http://test/api/progress/complete", {
      body: { userId, lessonId: lesson.id },
      cookies: { l2e_user_session: cookie },
    });
    const res = await progressPOST(req);
    expect(res.status).toBe(200);
    const body = (await readJson(res)) as { xpAwarded: number };
    expect(body.xpAwarded).toBe(25);

    const after = await prisma.user.findUnique({ where: { id: userId } });
    expect(after?.totalXp).toBe(25);
  });

  it("is idempotent — second completion returns alreadyCompleted", async () => {
    const { cookie, userId } = await signupAndGet("p4@example.com");
    const { lesson } = await createLesson({ xpReward: 10 });

    const body = { userId, lessonId: lesson.id };
    const opts = { body, cookies: { l2e_user_session: cookie } };
    const first = await progressPOST(makeRequest("http://test/api/progress/complete", opts));
    expect(first.status).toBe(200);

    const second = await progressPOST(makeRequest("http://test/api/progress/complete", opts));
    expect(second.status).toBe(200);
    const data = (await readJson(second)) as { alreadyCompleted: boolean };
    expect(data.alreadyCompleted).toBe(true);

    const after = await prisma.user.findUnique({ where: { id: userId } });
    expect(after?.totalXp).toBe(10);
  });
});
