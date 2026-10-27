import { beforeEach, describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { POST as ensure } from "@/app/api/user/ensure/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as open } from "@/app/api/progress/open/route";
import { GET as plan, POST as save } from "@/app/api/user/learning-plan/route";
import { POST as complete } from "@/app/api/progress/complete/route";
import { GET as identity } from "@/app/api/auth/session/route";
import { apiOk } from "@/lib/api-helpers";
import { setUserSessionCookie } from "@/lib/user-session";
import { publishedPaths } from "@/lib/learning-data";
import { assertTestDatabase } from "@/lib/test-database-safety";
import prisma from "@/lib/prisma";
import { clearDb, createUser, createLesson } from "../helpers/factories";
import {
  makeInvitedRequest,
  makeRequest,
  readCookie,
  getSetCookies,
} from "../helpers/request";
async function actor() {
  const { user } = await createUser();
  const res = apiOk();
  await setUserSessionCookie(res, user.id);
  return { user, token: readCookie(getSetCookies(res), "l2e_user_session")! };
}
const req = (path: string, token?: string, body?: object) =>
  makeRequest(`http://test/api/${path}`, {
    method: body ? "POST" : "GET",
    body,
    cookies: token ? { l2e_user_session: token } : {},
  });
describe("learning choices and real opened state", () => {
  beforeEach(clearDb);
  it("requires a server session and rejects client identity fields", async () => {
    expect(
      (await open(req("progress/open", undefined, { lessonId: "x" }))).status,
    ).toBe(401);
    expect((await plan(req("user/learning-plan"))).status).toBe(401);
    expect(
      (
        await save(
          req("user/learning-plan", undefined, { type: "goal", target: 1 }),
        )
      ).status,
    ).toBe(401);
    const a = await actor();
    expect(
      (
        await save(
          req("user/learning-plan", a.token, {
            type: "goal",
            target: 1,
            userId: "another",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("opening and reopening a lesson records activity but no XP, completion or payout change", async () => {
    const a = await actor(),
      { lesson } = await createLesson();
    const before = await prisma.user.findUnique({ where: { id: a.user.id } });
    for (let i = 0; i < 2; i++)
      expect(
        (await open(req("progress/open", a.token, { lessonId: lesson.id })))
          .status,
      ).toBe(200);
    expect(await prisma.lessonVisit.count()).toBe(1);
    expect(await prisma.progress.count()).toBe(0);
    expect(await prisma.payoutRequest.count()).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: a.user.id } })).toEqual(
      before,
    );
  });
  it("does not create sequence locks; any actually published lesson can be opened", async () => {
    const a = await actor(),
      first = await createLesson(),
      last = await createLesson();
    expect(
      (await open(req("progress/open", a.token, { lessonId: last.lesson.id })))
        .status,
    ).toBe(200);
    expect(
      await prisma.progress.count({ where: { lessonId: first.lesson.id } }),
    ).toBe(0);
  });
  it("rejects inactive paths, units, lessons and empty content at open and completion boundaries", async () => {
    const a = await actor();
    for (const level of ["path", "module", "lesson", "empty"]) {
      const f = await createLesson();
      if (level === "path")
        await prisma.path.update({
          where: { id: f.path.id },
          data: { isActive: false },
        });
      if (level === "module")
        await prisma.module.update({
          where: { id: f.module.id },
          data: { isActive: false },
        });
      if (level === "lesson")
        await prisma.lesson.update({
          where: { id: f.lesson.id },
          data: { isActive: false },
        });
      if (level === "empty")
        await prisma.card.deleteMany({ where: { lessonId: f.lesson.id } });
      expect(
        (await open(req("progress/open", a.token, { lessonId: f.lesson.id })))
          .status,
      ).toBe(404);
      expect(
        (
          await complete(
            req("progress/complete", a.token, { lessonId: f.lesson.id }),
          )
        ).status,
      ).toBe(404);
    }
    expect(await prisma.progress.count()).toBe(0);
  });
  it("filters inactive curriculum and marks only genuinely empty published content unavailable", async () => {
    const first = await createLesson(),
      hidden = await createLesson(),
      empty = await createLesson();
    await prisma.path.update({
      where: { id: hidden.path.id },
      data: { isActive: false },
    });
    await prisma.card.deleteMany({ where: { lessonId: empty.lesson.id } });
    const paths = await publishedPaths();
    expect(paths.map((p) => p.id)).not.toContain(hidden.path.id);
    expect(
      paths.find((p) => p.id === first.path.id)?.modules[0].lessons[0]
        .available,
    ).toBe(true);
    expect(
      paths.find((p) => p.id === empty.path.id)?.modules[0].lessons[0]
        .available,
    ).toBe(false);
  });
  it("stores only the current learner’s selected pathways and never changes access or money", async () => {
    const a = await actor(),
      b = await actor(),
      f = await createLesson();
    expect(
      (
        await save(
          req("user/learning-plan", a.token, {
            type: "path",
            pathId: f.path.id,
            selected: true,
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      await prisma.pathSelection.count({ where: { userId: a.user.id } }),
    ).toBe(1);
    expect(
      await prisma.pathSelection.count({ where: { userId: b.user.id } }),
    ).toBe(0);
    expect(
      (await open(req("progress/open", b.token, { lessonId: f.lesson.id })))
        .status,
    ).toBe(200);
    await save(
      req("user/learning-plan", a.token, {
        type: "path",
        pathId: f.path.id,
        selected: false,
      }),
    );
    expect(await prisma.pathSelection.count()).toBe(0);
    expect((await publishedPaths()).map((p) => p.id)).toContain(f.path.id);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } }))
        .totalXp,
    ).toBe(0);
  });
  it("persists an optional daily goal and uses actual completion dates without rewarding preferences", async () => {
    const a = await actor(),
      { lesson } = await createLesson();
    await save(req("user/learning-plan", a.token, { type: "goal", target: 1 }));
    let data = await (
      await plan(req("user/learning-plan?zone=UTC", a.token))
    ).json();
    expect(data).toMatchObject({ target: 1, completedToday: 0 });
    await complete(req("progress/complete", a.token, { lessonId: lesson.id }));
    data = await (
      await plan(req("user/learning-plan?zone=UTC", a.token))
    ).json();
    expect(data.completedToday).toBe(1);
    await save(
      req("user/learning-plan", a.token, { type: "goal", target: null }),
    );
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } }))
        .dailyGoal,
    ).toBeNull();
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } }))
        .totalXp,
    ).toBe(lesson.xpReward);
    expect(
      (await plan(req("user/learning-plan?zone=invalid/time", a.token))).status,
    ).toBe(400);
    expect(
      (
        await save(
          req("user/learning-plan", a.token, { type: "goal", target: 100 }),
        )
      ).status,
    ).toBe(400);
  });
  it("rejects cross-origin writes and keeps the navigation identity description minimal", async () => {
    const a = await actor();
    expect(
      (
        await save(
          makeRequest("http://test/api/user/learning-plan", {
            body: { type: "goal", target: 1 },
            cookies: { l2e_user_session: a.token },
            headers: { origin: "https://untrusted.example" },
          }),
        )
      ).status,
    ).toBe(403);
    const data = await (await identity(req("auth/session", a.token))).json();
    expect(Object.keys(data.user).sort()).toEqual(["id", "kind"]);
  });
  it("keeps guest choices and opened lessons on the same row through account creation", async () => {
    const g = await ensure(
      makeInvitedRequest("http://test/api/user/ensure", {
        body: {},
        ip: "10.67.1.1",
      }),
    );
    const token = readCookie(getSetCookies(g), "l2e_user_session")!,
      id = (await g.json()).actualUserId;
    const f = await createLesson();
    await open(req("progress/open", token, { lessonId: f.lesson.id }));
    await save(req("user/learning-plan", token, { type: "goal", target: 1 }));
    await save(
      req("user/learning-plan", token, {
        type: "path",
        pathId: f.path.id,
        selected: true,
      }),
    );
    const visits = await prisma.lessonVisit.findMany(),
      selected = await prisma.pathSelection.findMany();
    const response = await register(
      makeRequest("http://test/api/auth/register", {
        body: {
          email: "guest-plan@example.test",
          password: "synthetic-password",
          fullName: "Synthetic guest",
        },
        cookies: { l2e_user_session: token },
        ip: "10.67.1.2",
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).user.id).toBe(id);
    expect(await prisma.lessonVisit.findMany()).toEqual(visits);
    expect(await prisma.pathSelection.findMany()).toEqual(selected);
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(user.dailyGoal).toBe(1);
    expect(user.totalXp).toBe(0);
  });
  it("applies additive learning SQL to an existing schema without changing saved money or progress", async () => {
    await assertTestDatabase(prisma);
    const a = await actor(),
      { lesson } = await createLesson();
    await prisma.progress.create({
      data: { userId: a.user.id, lessonId: lesson.id, xpEarned: 9 },
    });
    await prisma.payoutRequest.create({
      data: {
        userId: a.user.id,
        xpAmount: 4,
        dollarAmount: 0.2,
        status: "completed",
      },
    });
    const before = {
      user: await prisma.user.findUnique({ where: { id: a.user.id } }),
      progress: await prisma.progress.findMany(),
      payout: await prisma.payoutRequest.findMany(),
    };
    const rollback = new Error(
      "rollback disposable learning migration exercise",
    );
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('DROP TABLE "LessonVisit"');
        await tx.$executeRawUnsafe('DROP TABLE "PathSelection"');
        await tx.$executeRawUnsafe(
          'ALTER TABLE "User" DROP COLUMN "dailyGoal"',
        );
        for (const statement of readFileSync(
          "prisma/migrations/20261027010000_learning_preferences_visits/migration.sql",
          "utf8",
        )
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean))
          await tx.$executeRawUnsafe(statement);
        expect({
          user: await tx.user.findUnique({ where: { id: a.user.id } }),
          progress: await tx.progress.findMany(),
          payout: await tx.payoutRequest.findMany(),
        }).toEqual(before);
        throw rollback;
      }),
    ).rejects.toThrow(rollback);
  });
});
