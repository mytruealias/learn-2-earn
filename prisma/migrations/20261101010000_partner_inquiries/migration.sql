-- Additive; no existing participant, curriculum, financial or staff record is changed.
CREATE TABLE "PartnerInquiry" (
 "id" TEXT NOT NULL, "requestKey" TEXT NOT NULL, "payloadHash" TEXT NOT NULL,
 "programId" TEXT NOT NULL, "fullName" TEXT NOT NULL, "organization" TEXT NOT NULL,
 "email" TEXT NOT NULL, "interest" TEXT NOT NULL, "region" TEXT, "message" TEXT,
 "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "noticeSnapshot" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PartnerInquiry_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "PartnerInquiry_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PartnerInquiry_requestKey_key" ON "PartnerInquiry"("requestKey");
CREATE INDEX "PartnerInquiry_programId_createdAt_id_idx" ON "PartnerInquiry"("programId","createdAt","id");
CREATE TABLE "PartnerInquiryRate" ("key" TEXT NOT NULL,"windowAt" TIMESTAMP(3) NOT NULL,"count" INTEGER NOT NULL,CONSTRAINT "PartnerInquiryRate_pkey" PRIMARY KEY ("key"));
CREATE FUNCTION l2e_partner_inquiry_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."programId" IS DISTINCT FROM OLD."programId" OR NEW."requestKey" IS DISTINCT FROM OLD."requestKey" OR NEW."payloadHash" IS DISTINCT FROM OLD."payloadHash" THEN RAISE EXCEPTION 'Partner inquiry ownership and receipt evidence are immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER l2e_partner_inquiry_owner_guard BEFORE UPDATE ON "PartnerInquiry" FOR EACH ROW EXECUTE FUNCTION l2e_partner_inquiry_owner();
