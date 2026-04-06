-- Migration: curriculum_schema_upgrade
-- Applied via prisma db push; this file serves as the migration record.
-- All changes are additive (no data loss, no type changes).

-- Path: new metadata columns
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#3b9eff';
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "estimatedHours" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT NOT NULL DEFAULT 'All learners';
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'foundational';

-- Module: new metadata columns
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '';

-- Lesson: new metadata columns
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "lessonType" TEXT NOT NULL DEFAULT 'learn';
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "learningObjectives" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'foundational';

-- Card: new metadata columns
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "subtype" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'foundational';
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "hint" TEXT;

-- Progress: new tracking columns
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "score" INTEGER;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "reflectionAnswer" TEXT;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "missedCardIds" TEXT NOT NULL DEFAULT '[]';
