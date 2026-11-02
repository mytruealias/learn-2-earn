import { beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import prisma from '../../lib/prisma';
import { clearDb, createUser } from '../helpers/factories';
import { getTestDatabaseUrl, assertTestDatabase } from '../../lib/test-database-safety';
const name = new URL(getTestDatabaseUrl()).pathname.slice(1);
function release(operation: string, extra: Record<string, string> = {}, confirm = name) {
  return spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/release.ts', operation, '--confirm-database', confirm], {
    env: { ...process.env, ...extra }, encoding: 'utf8', timeout: 120000,
  });
}
async function contentDigest() {
  const tables = await Promise.all([
    prisma.path.findMany({ orderBy: { id: 'asc' } }), prisma.module.findMany({ orderBy: { id: 'asc' } }),
    prisma.lesson.findMany({ orderBy: { id: 'asc' } }), prisma.card.findMany({ orderBy: { id: 'asc' } }),
    prisma.user.findMany({ orderBy: { id: 'asc' } }), prisma.progress.findMany({ orderBy: { id: 'asc' } }),
    prisma.payoutRequest.findMany({ orderBy: { id: 'asc' } }), prisma.adminUser.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return createHash('sha256').update(JSON.stringify(tables)).digest('hex');
}
beforeEach(clearDb);
describe('explicit release operations', () => {
  it('refuses wrong database confirmation before writing', async () => {
    expect(release('content-sync', {}, 'unreviewed').status).not.toBe(0);
    expect(await prisma.path.count()).toBe(0);
    const direct = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], { env: { ...process.env, RELEASE_OPERATION: '' }, encoding: 'utf8' });
    expect(direct.status).not.toBe(0);
    expect(await prisma.path.count()).toBe(0);
  });
  it('fills curriculum gaps while preserving IDs, edits, rewards and financial history on rerun', async () => {
    expect(release('content-sync').status).toBe(0);
    const lesson = await prisma.lesson.findFirstOrThrow();
    const card = await prisma.card.findFirstOrThrow({ where: { lessonId: lesson.id } });
    await prisma.lesson.update({ where: { id: lesson.id }, data: { xpReward: 777, title: 'Preserved local curriculum edit', isActive: false } });
    await prisma.card.update({ where: { id: card.id }, data: { body: 'Preserved authored edit' } });
    const { user } = await createUser({ totalXp: 150 });
    await prisma.progress.create({ data: { userId: user.id, lessonId: lesson.id, xpEarned: 10 } });
    await prisma.payoutRequest.create({ data: { userId: user.id, xpAmount: 20, dollarAmount: 1, status: 'completed' } });
    const before = await contentDigest();
    expect(release('content-sync').status).toBe(0);
    expect(await contentDigest()).toBe(before);
    expect(await prisma.adminUser.count()).toBe(0);
  }, 180000);
  it('bootstraps exactly once and never resets or recreates existing staff', async () => {
    const vars = { ADMIN_BOOTSTRAP_EMAIL: 'bootstrap@example.test', ADMIN_DEFAULT_PASSWORD: randomBytes(24).toString('hex') };
    expect(release('bootstrap-admin', vars).status).toBe(0);
    const before = await prisma.adminUser.findMany();
    expect(before).toHaveLength(1);
    expect(release('bootstrap-admin', { ...vars, ADMIN_DEFAULT_PASSWORD: randomBytes(24).toString('hex') }).status).not.toBe(0);
    expect(await prisma.adminUser.findMany()).toEqual(before);
    await prisma.adminUser.updateMany({ data: { isActive: false, role: 'caseworker' } });
    expect(release('bootstrap-admin', vars).status).not.toBe(0);
    expect(await prisma.adminUser.count()).toBe(1);
  }, 60000);
  it('legacy migration inspection never marks a failed migration applied', async () => {
    await assertTestDatabase(prisma);
    await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)');
    await prisma.$executeRaw`INSERT INTO public._prisma_migrations (migration_name) VALUES ('20260214235843_init_postgresql')`;
    const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/fix-migration.ts'], { env: process.env, encoding: 'utf8' });
    expect(result.status).toBe(0);
    const rows = await prisma.$queryRaw<Array<{ finished_at: Date | null }>>`SELECT finished_at FROM public._prisma_migrations`;
    expect(rows.every(row => row.finished_at === null)).toBe(true);
  });
});
