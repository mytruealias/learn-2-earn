import type { PrismaClient } from "@prisma/client";

type Environment = Record<string, string | undefined>;

/** Only the harness may provision resettable databases. Never fall back to DATABASE_URL. */
export function getTestDatabaseUrl(env: Environment = process.env): string {
  const value = env.DATABASE_URL_TEST;
  if (!value || value !== env.DATABASE_URL || !/^[a-f0-9]{64}$/.test(env.TEST_DATABASE_NONCE ?? "")) {
    throw new Error("Tests require an isolated database provisioned by npm test (no database URL fallback).");
  }
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Invalid disposable test database configuration."); }
  const name = url.pathname.slice(1);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !/^l2e_test_[a-f0-9]{24}$/.test(name) || url.username !== name ||
      !url.password || url.searchParams.get('schema') !== 'public') {
    throw new Error("Refusing a database outside the isolated local test harness.");
  }
  return value;
}

/** Verify a server-side nonce AND ownership/least privilege, before resets or fixtures. */
export async function assertTestDatabase(prisma: PrismaClient): Promise<void> {
  const url = new URL(getTestDatabaseUrl());
  try {
    const rows = await prisma.$queryRaw<Array<{
      database: string; username: string; owner: string; privileged: boolean;
    }>>`SELECT current_database() AS database, current_user AS username,
      r.rolname AS owner, (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole) AS privileged
      FROM pg_database d JOIN pg_roles r ON r.oid = d.datdba
      WHERE d.datname = current_database()`;
    const row = rows[0];
    if (!row || row.database !== url.pathname.slice(1) || row.username !== url.username ||
        row.owner !== row.username || row.privileged) throw new Error();
    const capability = await prisma.$queryRaw<Array<{ nonce: string }>>`
      SELECT nonce FROM l2e_test_guard.capability WHERE nonce = ${process.env.TEST_DATABASE_NONCE}`;
    if (capability.length !== 1) throw new Error();
  } catch {
    // Do not include database errors, connection URLs or passwords in test failures.
    throw new Error("Disposable database ownership/capability verification failed; no reset or fixtures allowed.");
  }
}
