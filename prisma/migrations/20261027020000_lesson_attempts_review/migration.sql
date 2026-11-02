ALTER TABLE "User" ADD COLUMN "learningTimezone" TEXT, ADD COLUMN "lastLearningAt" TIMESTAMP(3);
CREATE TABLE "LessonAttempt" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "lessonId" TEXT NOT NULL, "mode" TEXT NOT NULL,
 "contentHash" TEXT NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), "resultJson" TEXT,
 CONSTRAINT "LessonAttempt_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "LessonAttempt_mode_check" CHECK ("mode" IN ('first', 'practice')),
 CONSTRAINT "LessonAttempt_position_check" CHECK ("position" >= 0)
);
CREATE TABLE "LessonAnswer" (
 "attemptId" TEXT NOT NULL, "cardId" TEXT NOT NULL, "ordinal" INTEGER NOT NULL,
 "choice" INTEGER, "correct" BOOLEAN, "skipped" BOOLEAN NOT NULL DEFAULT false,
 "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LessonAnswer_pkey" PRIMARY KEY ("attemptId", "cardId")
);
CREATE TABLE "LessonReview" (
 "userId" TEXT NOT NULL, "lessonId" TEXT NOT NULL, "successes" INTEGER NOT NULL DEFAULT 0,
 "missedCardIds" TEXT NOT NULL DEFAULT '[]', "dueAt" TIMESTAMP(3) NOT NULL, "lastReviewedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "LessonReview_pkey" PRIMARY KEY ("userId", "lessonId")
);
CREATE INDEX "LessonAttempt_userId_lessonId_createdAt_idx" ON "LessonAttempt"("userId", "lessonId", "createdAt");
CREATE UNIQUE INDEX "LessonAnswer_attemptId_ordinal_key" ON "LessonAnswer"("attemptId", "ordinal");
CREATE INDEX "LessonReview_userId_dueAt_idx" ON "LessonReview"("userId", "dueAt");
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonAnswer" ADD CONSTRAINT "LessonAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LessonAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonReview" ADD CONSTRAINT "LessonReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonReview" ADD CONSTRAINT "LessonReview_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
