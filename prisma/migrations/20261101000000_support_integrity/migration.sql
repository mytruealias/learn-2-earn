-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedById" TEXT,
ADD COLUMN     "intakeKey" TEXT,
ADD COLUMN     "intakePayloadHash" TEXT,
ADD COLUMN     "intakeSnapshot" TEXT,
ADD COLUMN     "locationConsentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "supportEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportMonitoring" TEXT,
ADD COLUMN     "supportReviewReference" TEXT,
ADD COLUMN     "supportTeamName" TEXT,
ADD COLUMN     "supportVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SupportUsage" (
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "windowAt" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 0,
    "policyVersion" TEXT,

    CONSTRAINT "SupportUsage_pkey" PRIMARY KEY ("userId","kind")
);

-- CreateTable
CREATE TABLE "SupportLease" (
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportLease_pkey" PRIMARY KEY ("userId","kind")
);

-- CreateIndex
CREATE INDEX "Case_programId_acknowledgedAt_idx" ON "Case"("programId", "acknowledgedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Case_userId_intakeKey_key" ON "Case"("userId", "intakeKey");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportUsage" ADD CONSTRAINT "SupportUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportLease" ADD CONSTRAINT "SupportLease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Program" ADD COLUMN "supportRegion" TEXT;
ALTER TABLE "Case" ADD CONSTRAINT "case_ack_evidence" CHECK (("acknowledgedAt" IS NULL) = ("acknowledgedById" IS NULL));
CREATE FUNCTION l2e_support_intake_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD."intakeKey" IS NOT NULL AND ROW(NEW."userId",NEW."intakeKey",NEW."intakePayloadHash",NEW."intakeSnapshot",NEW."message",NEW."location",NEW."locationConsentAt",NEW."createdAt") IS DISTINCT FROM ROW(OLD."userId",OLD."intakeKey",OLD."intakePayloadHash",OLD."intakeSnapshot",OLD."message",OLD."location",OLD."locationConsentAt",OLD."createdAt") THEN RAISE EXCEPTION 'Original support request evidence is immutable'; END IF;
 IF TG_OP='UPDATE' AND OLD."acknowledgedAt" IS NOT NULL AND ROW(NEW."acknowledgedAt",NEW."acknowledgedById") IS DISTINCT FROM ROW(OLD."acknowledgedAt",OLD."acknowledgedById") THEN RAISE EXCEPTION 'Recorded acknowledgment evidence is immutable'; END IF;
 IF NEW."acknowledgedAt" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "StaffMembership" m JOIN "AdminUser" a ON a.id=m."adminId" WHERE m."programId"=NEW."programId" AND m."adminId"=NEW."acknowledgedById" AND m."isActive" AND m."revokedAt" IS NULL AND a."isActive" AND m.role IN ('program_admin','caseworker')) AND (TG_OP='INSERT' OR OLD."acknowledgedAt" IS NULL) THEN RAISE EXCEPTION 'Authorized support staff acknowledgment required'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER l2e_support_intake BEFORE INSERT OR UPDATE ON "Case" FOR EACH ROW EXECUTE FUNCTION l2e_support_intake_evidence();
