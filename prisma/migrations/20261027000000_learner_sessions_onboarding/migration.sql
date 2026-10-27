-- Additive only. Existing accounts, progress, balances and history are preserved.
ALTER TABLE "User" ADD COLUMN "onboardingState" TEXT,
                   ADD COLUMN "learningGoal" TEXT;
CREATE TABLE "LearnerSession" (
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "LearnerSession_pkey" PRIMARY KEY ("tokenHash")
);
CREATE INDEX "LearnerSession_userId_idx" ON "LearnerSession"("userId");
CREATE INDEX "LearnerSession_expiresAt_idx" ON "LearnerSession"("expiresAt");
ALTER TABLE "LearnerSession" ADD CONSTRAINT "LearnerSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
