import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../../", import.meta.url));
// Execute the real TypeScript functions with bounded database doubles. These
// tests never connect to a database or award rewards.
function load(relative, mocks) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule, exports: loadedModule.exports,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  });
  return loadedModule.exports;
}

function lessonHarness() {
  const rows = [];
  const lesson = { id: "lesson", xpReward: 10, cards: [{ id: "card", body: "Original" }] };
  const engine = load("lib/lesson/engine.ts", {
    "../rewards/accounting": {}, "../prisma": {}, "../learning-data": { activeLessonWhere: {} },
    "../user-session": {}, "../api-helpers": {}, "./rules": {},
    "./cards": { adaptCard: (card) => ({ ok: true, card: {
      public: { id: card.id, kind: "info" }, explanation: card.body, answerIndex: null,
    } }) },
  });
  const tx = {
    lesson: { findFirst: async () => lesson },
    progress: { findUnique: async () => null },
    lessonVisit: { upsert: async () => ({}) },
    lessonAttempt: {
      findFirst: async ({ where }) => [...rows].reverse().find((row) =>
        Object.entries(where).every(([key, value]) =>
          value && typeof value === "object" && "not" in value
            ? row[key] !== value.not : row[key] === value)) ?? null,
      create: async ({ data }) => {
        const row = { ...data, id: `attempt-${rows.length}`, position: 0,
          completedAt: null, resultJson: null, answers: [] };
        rows.push(row);
        return row;
      },
    },
  };
  return { rows, lesson, tx, engine };
}

test("changed content creates a fresh attempt, retains evidence, and reuses the new attempt", async () => {
  const h = lessonHarness();
  const first = await h.engine.startAttempt(h.tx, "user", "lesson", false);
  h.rows[0].answers.push({ ordinal: 0, choice: null, correct: true });
  h.lesson.cards[0].body = "Corrected wording";
  const restarted = await h.engine.startAttempt(h.tx, "user", "lesson", false);
  assert.notEqual(restarted.attempt.id, first.attempt.id);
  assert.equal(h.rows[0].answers.length, 1);
  assert.equal(h.rows[0].completedAt, null);
  const retry = await h.engine.startAttempt(h.tx, "user", "lesson", false);
  assert.equal(retry.attempt.id, restarted.attempt.id);
  assert.equal(h.rows.length, 2);
});

test("a completed first attempt stays authoritative after content changes", async () => {
  const h = lessonHarness();
  const first = await h.engine.startAttempt(h.tx, "user", "lesson", false);
  h.rows[0].completedAt = new Date();
  h.rows[0].resultJson = JSON.stringify({ xpAwarded: 10 });
  h.lesson.cards[0].body = "Corrected wording";
  const retry = await h.engine.startAttempt(h.tx, "user", "lesson", false);
  assert.equal(retry.attempt.id, first.attempt.id);
  assert.equal(h.rows.length, 1);
});

function correctionHarness(entityId, payloadUserId) {
  const data = { requestKey: "key", expectedVersion: 0, xpAdjustment: 10, xpReason: "Correction" };
  class RewardIssue extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }
  const tx = {
    user: { findUnique: async () => ({ id: "target", staffVersion: 0 }) },
    staffActionReceipt: { findUnique: async () => ({
      payloadHash: JSON.stringify({ userId: payloadUserId, data }),
      adminId: "staff", entity: "User", entityId, action: "update",
    }) },
  };
  return load("app/api/admin/users/[userId]/route.ts", {
    "@/lib/rewards/http": { staffWrite: (_req, _schema, _roles, handler) =>
      handler(tx, { id: "staff", programId: "program", role: "admin" }, data) },
    "@/lib/rewards/accounting": { RewardIssue, hash: JSON.stringify,
      financialLock: async () => {}, userLock: async () => {} },
    "@/lib/admin-auth": {}, "@/lib/audit": {}, "@/lib/program-scope": {}, "@/lib/api-helpers": {},
  });
}

test("matching correction receipt replays for the same learner", async () => {
  const route = correctionHarness("target", "target");
  const result = await route.PATCH({}, { params: Promise.resolve({ userId: "target" }) });
  assert.equal(result.replayed, true);
});

for (const [entityId, payloadUserId] of [["other", "target"], ["target", "other"]]) {
  test(`correction rejects mismatched learner evidence: ${entityId}/${payloadUserId}`, async () => {
    const route = correctionHarness(entityId, payloadUserId);
    await assert.rejects(route.PATCH({}, { params: Promise.resolve({ userId: "target" }) }),
      (error) => error.code === "conflict");
  });
}

function validationHarness() {
  return load("lib/api-helpers.ts", {
    "./reliability/read-json": {
      readRequestJson: async (request) => ({ ok: true, data: await request.json() }),
    },
    "./scope-error": { ScopeError: class extends Error {} },
    "next/server": { NextResponse: {
      json: (body, init) => ({ status: init?.status ?? 200, body }),
    } },
    "next/headers": {}, "./reliability/correlation": {},
    "./reliability/events": {}, "./reliability/rate-limit": {},
  });
}

test("validation keeps the 400 envelope, nested field paths and authored messages", async () => {
  const { z } = require("zod");
  const api = validationHarness();
  const schema = z.object({
    profile: z.object({ name: z.string().min(2, "Enter your full name.") }),
    answers: z.array(z.string().min(1, "Choose an answer.")),
  });
  const result = await api.parseJson({ json: async () => ({
    profile: { name: "" }, answers: [""],
  }) }, schema);
  assert.equal(result.ok, false);
  assert.equal(result.response.status, 400);
  const { error } = result.response.body;
  assert.equal(error.code, "validation_error");
  assert.equal(error.message, "Enter your full name.");
  assert.equal(error.fields["profile.name"][0], "Enter your full name.");
  assert.equal(error.fields["answers.0"][0], "Choose an answer.");
});

test("validation keeps transforms, defaults, partial updates and record answers", async () => {
  const { z } = require("zod");
  const api = validationHarness();
  const schema = z.object({
    name: z.string().trim().min(1),
    answers: z.record(z.string().max(120), z.string().max(4000)).default({}),
    enabled: z.boolean().default(false),
  });
  const result = await api.parseJson({ json: async () => ({ name: " Learner " }) }, schema);
  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Learner");
  assert.equal(result.data.enabled, false);
  assert.equal(Object.keys(result.data.answers).length, 0);
  const update = api.parseQuery({}, schema.partial());
  assert.equal(update.ok, true);
  assert.equal(Object.hasOwn(update.data, "name"), false);
  assert.equal(schema.safeParse({ name: "Learner", answers: { card: 12 } }).success, false);
});

test("validation still rejects invalid IDs and oversized bounded collections", () => {
  const { z } = require("zod");
  const api = validationHarness();
  const invalid = api.parseParam("../invalid", api.idParamSchema, "userId");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.response.body.error.code, "validation_error");
  assert.ok(invalid.response.body.error.fields.userId.length);
  assert.equal(api.parseParam("valid-id_1", api.idParamSchema).ok, true);
  assert.equal(z.array(z.string()).max(2).safeParse(Array(1000).fill("x")).success, false);
});
