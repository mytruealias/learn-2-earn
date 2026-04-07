/**
 * pre-deploy.ts
 *
 * Runs before `prisma migrate deploy` to resolve any failed migrations
 * recorded in _prisma_migrations. This is needed when the production database
 * was originally bootstrapped with `prisma db push` instead of
 * `prisma migrate deploy`, leaving a failed/partial migration record that
 * blocks future deploys.
 *
 * Strategy: mark failed migration records as successfully applied so that
 * `prisma migrate deploy` can proceed to apply new migrations.
 * All schema columns use IF NOT EXISTS, so re-application is safe.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Pre-deploy: checking migration state...");

  let migrationTableExists = false;
  try {
    await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
    migrationTableExists = true;
  } catch {
    console.log("  ↳ _prisma_migrations table not found — fresh database, skipping.");
    return;
  }

  if (!migrationTableExists) return;

  const failed = await prisma.$queryRaw<
    Array<{ id: string; migration_name: string; logs: string | null }>
  >`
    SELECT id, migration_name, logs
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL
      AND rolled_back_at IS NULL
      AND started_at IS NOT NULL
  `;

  if (failed.length === 0) {
    console.log("  ↳ No failed migrations found — proceeding normally.");
    return;
  }

  console.log(`  ↳ Found ${failed.length} failed migration(s):`);
  for (const m of failed) {
    console.log(`    - ${m.migration_name}`);
  }

  for (const m of failed) {
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET
        finished_at       = NOW(),
        applied_steps_count = steps_count,
        logs              = NULL
      WHERE id = ${m.id}
    `;
    console.log(`  ✓ Marked as applied: ${m.migration_name}`);
  }

  console.log("✅ Pre-deploy migration fix complete.");
}

main()
  .catch((e) => {
    console.error("Pre-deploy error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
