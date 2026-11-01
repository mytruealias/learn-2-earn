-- Old unassigned accounts cannot self-claim legacy history using a new invitation.
ALTER TABLE "User" ADD COLUMN "programEnrollmentState" TEXT NOT NULL DEFAULT 'legacy_quarantine';

-- CreateEnum
CREATE TYPE "StaffProgramRole" AS ENUM ('program_admin', 'caseworker', 'finance');

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "mfaConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "mfaLastStep" BIGINT,
ADD COLUMN     "mfaSecretEncrypted" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "ServiceDirectory" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "AdminSession" ADD COLUMN     "activeProgramId" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mfaVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "PayoutConfig" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "PoolBalance" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "PoolAdjustment" ADD COLUMN     "programId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultConfigSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMembership" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "role" "StaffProgramRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StaffMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantEnrollment" (
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,

    CONSTRAINT "ParticipantEnrollment_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ProgramInvitation" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRecoveryCode" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAuthThrottle" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "StaffAuthThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE INDEX "StaffMembership_programId_isActive_idx" ON "StaffMembership"("programId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMembership_adminId_programId_key" ON "StaffMembership"("adminId", "programId");

-- CreateIndex
CREATE INDEX "ParticipantEnrollment_programId_status_idx" ON "ParticipantEnrollment"("programId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramInvitation_tokenHash_key" ON "ProgramInvitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRecoveryCode_codeHash_key" ON "StaffRecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "StaffRecoveryCode_adminId_idx" ON "StaffRecoveryCode"("adminId");

-- CreateIndex
CREATE INDEX "PayoutRequest_programId_idx" ON "PayoutRequest"("programId");

-- CreateIndex
CREATE INDEX "Case_programId_idx" ON "Case"("programId");

-- CreateIndex
CREATE INDEX "ServiceDirectory_programId_idx" ON "ServiceDirectory"("programId");

-- CreateIndex
CREATE INDEX "AuditLog_programId_idx" ON "AuditLog"("programId");

-- CreateIndex
CREATE INDEX "PayoutConfig_programId_idx" ON "PayoutConfig"("programId");

-- CreateIndex
CREATE INDEX "PoolBalance_programId_idx" ON "PoolBalance"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolBalance_programId_key" ON "PoolBalance"("programId");

-- CreateIndex
CREATE INDEX "PoolAdjustment_programId_idx" ON "PoolAdjustment"("programId");

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDirectory" ADD CONSTRAINT "ServiceDirectory_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_activeProgramId_fkey" FOREIGN KEY ("activeProgramId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutConfig" ADD CONSTRAINT "PayoutConfig_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBalance" ADD CONSTRAINT "PoolBalance_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAdjustment" ADD CONSTRAINT "PoolAdjustment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMembership" ADD CONSTRAINT "StaffMembership_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMembership" ADD CONSTRAINT "StaffMembership_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantEnrollment" ADD CONSTRAINT "ParticipantEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantEnrollment" ADD CONSTRAINT "ParticipantEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramInvitation" ADD CONSTRAINT "ProgramInvitation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRecoveryCode" ADD CONSTRAINT "StaffRecoveryCode_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Existing NULL ownership is quarantined. No automatic membership or city-based grants.
ALTER TABLE "ParticipantEnrollment" ADD CONSTRAINT "enrollment_status" CHECK ("status" IN ('active','quarantined','closed'));
CREATE FUNCTION l2e_program_owner_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."programId" IS NOT NULL AND NEW."programId" IS DISTINCT FROM OLD."programId" THEN
    RAISE EXCEPTION 'Program ownership is immutable; reviewed transfer required';
  END IF;
  IF TG_TABLE_NAME = 'ParticipantEnrollment' THEN RETURN NEW; END IF;
  IF NEW."programId" IS NOT NULL AND TG_TABLE_NAME IN ('PayoutRequest','Case') THEN
    IF NOT EXISTS (SELECT 1 FROM "ParticipantEnrollment" e WHERE e."userId" = NEW."userId" AND e."programId" = NEW."programId") THEN
      RAISE EXCEPTION 'Participant enrollment and record owner differ';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER l2e_enrollment_owner BEFORE UPDATE ON "ParticipantEnrollment" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_payout_owner BEFORE INSERT OR UPDATE ON "PayoutRequest" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_case_owner BEFORE INSERT OR UPDATE ON "Case" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_service_owner BEFORE UPDATE ON "ServiceDirectory" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_config_owner BEFORE UPDATE ON "PayoutConfig" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_pool_owner BEFORE UPDATE ON "PoolBalance" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();
CREATE TRIGGER l2e_adjustment_owner BEFORE UPDATE ON "PoolAdjustment" FOR EACH ROW EXECUTE FUNCTION l2e_program_owner_guard();

-- Preserve original records while making reference/intent uniqueness program-local.
CREATE UNIQUE INDEX "PayoutRequest_programId_paymentMethod_paymentReference_key" ON "PayoutRequest"("programId","paymentMethod","paymentReference");
DROP INDEX "PayoutRequest_paymentMethod_paymentReference_key";
CREATE UNIQUE INDEX "PoolAdjustment_programId_requestKey_key" ON "PoolAdjustment"("programId","requestKey");
DROP INDEX "PoolAdjustment_requestKey_key";
