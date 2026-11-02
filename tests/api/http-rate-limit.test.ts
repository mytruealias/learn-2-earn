import { beforeEach, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { assertTestDatabase, getTestDatabaseUrl } from "@/lib/test-database-safety";
import { consumeRateLimit } from "@/lib/reliability/rate-limit";
import { clearDb } from "../helpers/factories";
beforeEach(clearDb);
it("admits exactly the cap across independent clients and resets only after expiry", async () => {
    await assertTestDatabase(prisma);
    const second = new PrismaClient({ datasources: { db: { url: getTestDatabaseUrl() } } });
    try {
        await assertTestDatabase(second);
        const results = await Promise.all(Array.from({ length: 24 }, (_, n) => consumeRateLimit("access", "192.0.2.20", 5, 60000, n % 2 ? second : prisma)));
        expect(results.filter(r => r.allowed)).toHaveLength(5);
        const row = await prisma.httpRateLimit.findFirstOrThrow();
        expect(row.count).toBe(5);
        expect(row.key).not.toContain("192.0.2.20");
        await prisma.httpRateLimit.updateMany({ data: { resetAt: new Date(0) } });
        expect((await consumeRateLimit("access", "192.0.2.20", 5, 60000, second)).allowed).toBe(true);
        expect((await prisma.httpRateLimit.findFirstOrThrow()).count).toBe(1);
    }
    finally {
        await second.$disconnect();
    }
});
it("refunds only one successful admission and never a newer window", async () => {
    const first = await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma);
    await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma);
    await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma);
    expect(first.allowed).toBe(true);
    expect((await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma)).allowed).toBe(false);
    await first.release?.();
    expect((await prisma.httpRateLimit.findFirstOrThrow()).count).toBe(2);
    await first.release?.();
    expect((await prisma.httpRateLimit.findFirstOrThrow()).count).toBe(2);
    const oldWindow = await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma);
    expect(oldWindow.allowed).toBe(true);
    await prisma.httpRateLimit.updateMany({ data: { resetAt: new Date(0) } });
    const current = await consumeRateLimit("access", "192.0.2.21", 3, 60000, prisma);
    expect(current.allowed).toBe(true);
    await oldWindow.release?.();
    expect((await prisma.httpRateLimit.findFirstOrThrow()).count).toBe(1);
    await current.release?.();
    expect(await prisma.httpRateLimit.count()).toBe(0);
});
