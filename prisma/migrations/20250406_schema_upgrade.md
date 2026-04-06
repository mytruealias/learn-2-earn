# Schema Upgrade: Curriculum Expansion Fields

**Date:** 2025-04-06  
**Method:** `prisma db push` (non-destructive, additive-only)  
**Status:** Applied ✅

## New Columns Added

All columns use safe defaults — no data loss, no downtime.

### Path
- `color` String @default("#3b9eff")
- `estimatedHours` Int @default(0)
- `targetAudience` String @default("All learners")
- `difficulty` String @default("foundational")

### Module
- `description` String @default("")
- `color` String @default("")

### Lesson
- `lessonType` String @default("learn")  — values: "learn" | "checkpoint" | "capstone"
- `estimatedMinutes` Int @default(5)
- `learningObjectives` String @default("[]")  — JSON array
- `difficulty` String @default("foundational")

### Card
- `subtype` String @default("")
- `difficulty` String @default("foundational")
- `tags` String @default("[]")  — JSON array
- `hint` String? (nullable)

### Progress
- `score` Int? (nullable)
- `timeSpentSeconds` Int @default(0)
- `reflectionAnswer` String? (nullable)
- `missedCardIds` String @default("[]")  — JSON array

## Seed Changes

- All `upsertLesson` calls now include explicit `lessonType: "learn"` and `estimatedMinutes: 5`
- Checkpoint lessons added (xpReward: 15, lessonType: "checkpoint") — one per path demonstrating the pattern
- Capstone modules/lessons added (xpReward: 25, lessonType: "capstone") — one per all 11 paths
- `reconcileLessonMetadata()` function added to both seed files; runs post-seed to sync estimatedMinutes from card count

## Migration Safety

`prisma db push` was used because:
1. All changes are purely additive (no drops, no renames, no type changes)
2. All new columns have safe defaults — existing rows get defaults automatically
3. Zero breaking changes to existing queries or data
4. This is equivalent to: `ALTER TABLE "Lesson" ADD COLUMN "lessonType" TEXT DEFAULT 'learn' NOT NULL;` etc.

For future breaking changes, switch to `prisma migrate dev`.
