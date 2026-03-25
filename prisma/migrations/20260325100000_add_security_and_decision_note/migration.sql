-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "loginFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN "decisionNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
