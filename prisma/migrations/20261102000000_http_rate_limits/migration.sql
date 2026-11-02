-- Additive. No participant, credential, curriculum or financial record is changed.
CREATE TABLE "HttpRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HttpRateLimit_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "HttpRateLimit_count_check" CHECK ("count" >= 1)
);
