import { it, expect, vi, beforeEach } from "vitest";
const query = vi.hoisted(() => ({
  paths: vi.fn(),
  countPaths: vi.fn(),
  countLessons: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    path: { findMany: query.paths, count: query.countPaths },
    lesson: { count: query.countLessons },
    $transaction: query.transaction,
  },
}));
import { publishedCatalog } from "@/lib/marketing/catalog";
beforeEach(() => {
  vi.clearAllMocks();
  query.transaction.mockImplementation(async (operations) =>
    Promise.all(operations),
  );
  query.paths.mockResolvedValue([
    {
      slug: "synthetic-active",
      title: "Synthetic published path",
      description: "Synthetic curriculum",
      modules: [{ _count: { lessons: 3 } }, { _count: { lessons: 2 } }],
    },
  ]);
  query.countPaths.mockResolvedValue(2);
  query.countLessons.mockResolvedValue(7);
});
it("derives claims from active published curriculum only, without any participant relations", async () => {
  const c = await publishedCatalog();
  expect(c).toMatchObject({
    available: true,
    pathCount: 2,
    lessonCount: 7,
    paths: [{ lessons: 5 }],
  });
  const fields = query.paths.mock.calls[0][0];
  expect(fields.where.isActive).toBe(true);
  expect(fields.where.modules.some).toMatchObject({
    isActive: true,
    lessons: { some: { isActive: true, cards: { some: {} } } },
  });
  expect(query.countLessons.mock.calls[0][0].where.module).toEqual({
    isActive: true,
    path: { isActive: true },
  });
  const keys = JSON.stringify(fields.select);
  for (const privateField of [
    "progress",
    "user",
    "attempt",
    "answerJson",
    "case",
    "payout",
  ])
    expect(keys).not.toContain(privateField);
});
it("does not replace a failed publication query with invented zeroes or seed totals", async () => {
  query.transaction.mockRejectedValueOnce(
    new Error("Synthetic database unavailable"),
  );
  expect(await publishedCatalog()).toEqual({ available: false, paths: [] });
});
