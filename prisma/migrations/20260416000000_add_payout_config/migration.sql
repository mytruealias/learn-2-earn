-- CreateTable
CREATE TABLE "PayoutConfig" (
    "id" TEXT NOT NULL,
    "programSlug" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "xpToDollar" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "minimumXp" INTEGER NOT NULL DEFAULT 20,
    "weeklyXpCap" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutConfig_programSlug_key" ON "PayoutConfig"("programSlug");
