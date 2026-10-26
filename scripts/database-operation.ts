import type { PrismaClient } from '@prisma/client';

export async function assertDatabaseOperation(prisma: PrismaClient, operation: string) {
  let url: URL;
  try { url = new URL(process.env.DATABASE_URL ?? ''); } catch { throw new Error('A database target is required.'); }
  const name = decodeURIComponent(url.pathname.slice(1));
  if (process.env.RELEASE_OPERATION !== operation || !name || process.env.RELEASE_DATABASE_NAME !== name) {
    throw new Error('Use the explicit release command with --confirm-database; direct mutation is refused.');
  }
  const result = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (result[0]?.name !== name) throw new Error('Database identity did not match the confirmed target.');
}
