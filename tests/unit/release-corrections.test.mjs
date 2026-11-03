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
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  });
  return module.exports;
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
