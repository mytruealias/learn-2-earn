/** Legacy path retained as a READ-ONLY diagnostic. It never repairs migration history. */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const exists = await prisma.$queryRaw<Array<{ present: boolean }>>`
    SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS present`;
  if (!exists[0]?.present) { console.log('No public migration history table. Follow the baseline/recovery runbook.'); return; }
  const rows = await prisma.$queryRaw<Array<{ finished: boolean; rolledBack: boolean }>>`
    SELECT finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS "rolledBack"
    FROM public._prisma_migrations WHERE migration_name = '20260214235843_init_postgresql'`;
  console.log(JSON.stringify({ legacyInitRecords: rows.length, states: rows }));
  console.log('Read-only inspection complete. No history changed. See DEPLOYMENT.md before any migrate resolve operation.');
}
main().catch(() => {
  console.error('Migration inspection failed; no history was changed and no connection details are logged.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
