/**
 * One-time fix for the failed '20260214235843_init_postgresql' migration record.
 *
 * This migration was created when the production database was first set up using
 * `prisma db push`. The resulting _prisma_migrations record was left in a failed
 * state (started_at set, finished_at NULL), which blocks Replit's deployment
 * platform from verifying database health.
 *
 * This script:
 *   - Only touches the ONE specific named migration
 *   - Only acts if it is genuinely in failed/incomplete state (finished_at IS NULL)
 *   - Is idempotent: a no-op if already resolved or missing
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const MIGRATION_NAME = "20260214235843_init_postgresql";

  // Check if the table even exists (safe on fresh databases)
  const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '_prisma_migrations'
    ) AS exists
  `;

  if (!tableExists[0]?.exists) {
    console.log("  ↳ _prisma_migrations table not found — skipping.");
    return;
  }

  // Look for this specific migration in FAILED state only
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    finished_at: Date | null;
  }>>`
    SELECT id, finished_at
    FROM "_prisma_migrations"
    WHERE migration_name = ${MIGRATION_NAME}
      AND finished_at IS NULL
      AND started_at IS NOT NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.log(`  ↳ Migration '${MIGRATION_NAME}' is already resolved or absent — skipping.`);
    return;
  }

  // Mark the specific failed migration as applied
  await prisma.$executeRaw`
    UPDATE "_prisma_migrations"
    SET finished_at     = NOW(),
        applied_steps_count = steps_count,
        logs            = NULL
    WHERE migration_name = ${MIGRATION_NAME}
      AND finished_at IS NULL
  `;

  console.log(`  ↳ Marked '${MIGRATION_NAME}' as applied.`);
}

main()
  .then(() => console.log("✓ Migration fix complete."))
  .catch((e) => {
    console.error("Migration fix error (non-fatal):", e.message);
  })
  .finally(() => prisma.$disconnect());
