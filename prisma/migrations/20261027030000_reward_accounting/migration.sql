-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "amountCents" INTEGER,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidById" TEXT,
ADD COLUMN     "payloadHash" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "requestKey" TEXT,
ADD COLUMN     "rulesSnapshot" TEXT;

-- AlterTable
ALTER TABLE "PayoutConfig" ADD COLUMN     "paymentMethods" TEXT,
ADD COLUMN     "rateExact" TEXT,
ADD COLUMN     "separateApprover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PoolAdjustment" ADD COLUMN     "payoutId" TEXT,
ADD COLUMN     "requestKey" TEXT;

-- CreateTable
CREATE TABLE "RewardAccount" (
    "userId" TEXT NOT NULL,
    "learningXp" INTEGER NOT NULL DEFAULT 0,
    "programSlug" TEXT,
    "creditedXp" INTEGER NOT NULL,
    "availableXp" INTEGER NOT NULL,
    "reservedXp" INTEGER NOT NULL DEFAULT 0,
    "spentXp" INTEGER NOT NULL DEFAULT 0,
    "openingAdjustmentXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RewardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payoutId" TEXT,
    "adminId" TEXT,
    "availableDelta" INTEGER NOT NULL DEFAULT 0,
    "reservedDelta" INTEGER NOT NULL DEFAULT 0,
    "spentDelta" INTEGER NOT NULL DEFAULT 0,
    "creditedDelta" INTEGER NOT NULL DEFAULT 0,
    "amountCents" INTEGER,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardEntry_payoutId_createdAt_idx" ON "RewardEntry"("payoutId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEntry_userId_sourceKey_key" ON "RewardEntry"("userId", "sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRequest_userId_requestKey_key" ON "PayoutRequest"("userId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRequest_paymentMethod_paymentReference_key" ON "PayoutRequest"("paymentMethod", "paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "PoolAdjustment_requestKey_key" ON "PoolAdjustment"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "PoolAdjustment_payoutId_key" ON "PoolAdjustment"("payoutId");

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardAccount" ADD CONSTRAINT "RewardAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEntry" ADD CONSTRAINT "RewardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEntry" ADD CONSTRAINT "RewardEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "PayoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEntry" ADD CONSTRAINT "RewardEntry_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Additive only; explicit reviewed backfill is a separate operation.
ALTER TABLE "RewardAccount" ADD CONSTRAINT "RewardAccount_nonnegative" CHECK ("creditedXp" >= 0 AND "availableXp" >= 0 AND "reservedXp" >= 0 AND "spentXp" >= 0);
ALTER TABLE "RewardAccount" ADD CONSTRAINT "RewardAccount_conservation" CHECK ("creditedXp"::bigint = "availableXp"::bigint + "reservedXp"::bigint + "spentXp"::bigint);
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_exact_amount" CHECK ("amountCents" IS NULL OR "amountCents" >= 0);
CREATE FUNCTION l2e_immutable_reward_entry() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Reward entries are append only'; END $$;
CREATE TRIGGER "RewardEntry_immutable" BEFORE UPDATE OR DELETE ON "RewardEntry" FOR EACH ROW EXECUTE FUNCTION l2e_immutable_reward_entry();
CREATE FUNCTION l2e_immutable_payout_terms() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD."amountCents" IS NOT NULL AND (NEW."amountCents" IS DISTINCT FROM OLD."amountCents" OR NEW."xpAmount" IS DISTINCT FROM OLD."xpAmount" OR NEW."rulesSnapshot" IS DISTINCT FROM OLD."rulesSnapshot" OR NEW."userId" IS DISTINCT FROM OLD."userId" OR NEW."paymentMethod" IS DISTINCT FROM OLD."paymentMethod" OR NEW."paymentHandle" IS DISTINCT FROM OLD."paymentHandle" OR NEW."dollarAmount" IS DISTINCT FROM OLD."dollarAmount" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt") THEN RAISE EXCEPTION 'Accepted payout terms are immutable'; END IF;
 IF OLD."status" = 'completed' AND (NEW."status" IS DISTINCT FROM OLD."status" OR NEW."paidAt" IS DISTINCT FROM OLD."paidAt" OR NEW."paymentReference" IS DISTINCT FROM OLD."paymentReference" OR NEW."paidById" IS DISTINCT FROM OLD."paidById") THEN RAISE EXCEPTION 'Recorded payment evidence is immutable'; END IF;
 IF OLD."status" IS DISTINCT FROM NEW."status" AND NOT ((OLD."status" = 'pending' AND NEW."status" IN ('reviewed','rejected','cancelled')) OR (OLD."status" = 'reviewed' AND NEW."status" IN ('approved','rejected')) OR (OLD."status" = 'approved' AND NEW."status" = 'completed')) THEN RAISE EXCEPTION 'Invalid payout state transition'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER "PayoutRequest_immutable_terms" BEFORE UPDATE ON "PayoutRequest" FOR EACH ROW EXECUTE FUNCTION l2e_immutable_payout_terms();

ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_new_payment_evidence" CHECK ("requestKey" IS NULL OR "status" <> 'completed' OR ("paidAt" IS NOT NULL AND "paidById" IS NOT NULL AND "paymentReference" IS NOT NULL AND length("paymentReference") >= 3));

ALTER TABLE "RewardEntry" ADD CONSTRAINT "RewardEntry_balanced_deltas" CHECK ("creditedDelta"::bigint = "availableDelta"::bigint + "reservedDelta"::bigint + "spentDelta"::bigint);
