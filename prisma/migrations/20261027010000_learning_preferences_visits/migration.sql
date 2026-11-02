-- Additive preferences/activity only. No completion, XP, money or curriculum backfill.
ALTER TABLE "User" ADD COLUMN "dailyGoal" INTEGER;
CREATE TABLE "PathSelection" (
  "userId" TEXT NOT NULL,
  "pathId" TEXT NOT NULL,
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PathSelection_pkey" PRIMARY KEY ("userId", "pathId")
);
CREATE TABLE "LessonVisit" (
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonVisit_pkey" PRIMARY KEY ("userId", "lessonId")
);
CREATE INDEX "LessonVisit_userId_openedAt_idx" ON "LessonVisit"("userId", "openedAt");
ALTER TABLE "PathSelection" ADD CONSTRAINT "PathSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PathSelection" ADD CONSTRAINT "PathSelection_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonVisit" ADD CONSTRAINT "LessonVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonVisit" ADD CONSTRAINT "LessonVisit_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
