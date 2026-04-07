/**
 * One-time fix for the failed '20260214235843_init_postgresql' migration record.
 *
 * This migration was created when the production database was first set up using
 * `prisma db push`. The resulting _prisma_migrations record was left in a failed
 * state (started_at set, finished_at NULL), which blocks `prisma migrate deploy`
 * from applying any new migrations.
 *
 * This script:
 *   - Only touches the ONE specific named migration by exact name
 *   - Only acts if it is genuinely in failed/incomplete state (finished_at IS NULL)
 *   - Is idempotent: a no-op if already resolved or absent
 *   - After the first successful deployment this script does nothing on every
 *     subsequent run
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const MIGRATION_NAME = "20260214235843_init_postgresql";

  const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '_prisma_migrations'
    ) AS exists
  `;

  if (!tableCheck[0]?.exists) {
    console.log("  ↳ _prisma_migrations not found — skipping.");
    return;
  }

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "_prisma_migrations"
    WHERE migration_name = ${MIGRATION_NAME}
      AND finished_at IS NULL
      AND started_at  IS NOT NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.log(`  ↳ '${MIGRATION_NAME}' already resolved or absent — no-op.`);
    return;
  }

  await prisma.$executeRaw`
    UPDATE "_prisma_migrations"
    SET finished_at         = NOW(),
        applied_steps_count = 1,
        logs                = NULL
    WHERE migration_name = ${MIGRATION_NAME}
      AND finished_at IS NULL
  `;

  console.log(`  ↳ Marked '${MIGRATION_NAME}' as applied.`);
}

main()
  .then(() => console.log("✓ Migration fix complete."))
  .catch((e) => console.error("Migration fix error:", e.message))
  .finally(() => prisma.$disconnect());
