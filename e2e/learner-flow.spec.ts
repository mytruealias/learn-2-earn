import { test, expect } from "@playwright/test";
import {
  findAnyLessonId,
  deleteUserByEmail,
  uniqEmail,
  disconnect,
} from "./helpers/seed";

const DEMO_CODE = process.env.DEMO_ACCESS_CODE || "LEARN2EARN";

test.describe.serial("Learner: signup → complete lesson → XP visible in profile", () => {
  let email: string;

  test.beforeAll(async () => {
    email = uniqEmail("learner");
  });

  test.afterAll(async () => {
    await deleteUserByEmail(email);
    await disconnect();
  });

  test("end-to-end learner XP flow", async ({ request }) => {
    // 1. Pass the demo gate so middleware allows access to /app and /profile.
    const access = await request.post("/api/access", { data: { code: DEMO_CODE } });
    expect(access.status(), "demo access code accepted").toBe(200);

    // 2. Register the learner. This is the same endpoint the multi-step UI
    //    form ultimately calls when the learner clicks Submit.
    const password = "test-password-1";
    const reg = await request.post("/api/auth/register", {
      data: { email, password, fullName: "E2E Learner" },
    });
    expect(reg.status(), "registration succeeded").toBe(200);
    const regBody = await reg.json();
    const userId = regBody.user.id as string;
    expect(regBody.user.totalXp).toBe(0);

    // 3. Complete a real seeded lesson through the same endpoint the
    //    LessonPlayer hits when the learner finishes the cards.
    const lessonId = await findAnyLessonId();
    const complete = await request.post("/api/progress/complete", {
      data: { userId, lessonId },
    });
    expect(complete.status(), "lesson completion succeeded").toBe(200);
    const completeBody = await complete.json();
    const xpAwarded = completeBody.xpAwarded as number;
    expect(xpAwarded).toBeGreaterThan(0);

    // 4. Profile API (the same call /profile makes on render) must reflect
    //    the new XP total. This proves the XP is actually surfaced to the
    //    learner, not just stored in the DB.
    const sess = await request.post("/api/auth/session", { data: {} });
    expect(sess.status()).toBe(200);
    const sessBody = await sess.json();
    expect(sessBody.user.totalXp).toBe(xpAwarded);
  });
});
