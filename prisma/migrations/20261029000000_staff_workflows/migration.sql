-- AlterTable
ALTER TABLE "User" ADD COLUMN     "staffVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceDirectory" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StaffMembership" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StaffActionReceipt" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActionReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffActionReceipt_programId_entity_entityId_createdAt_idx" ON "StaffActionReceipt"("programId", "entity", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffActionReceipt_programId_requestKey_key" ON "StaffActionReceipt"("programId", "requestKey");

-- AddForeignKey
ALTER TABLE "StaffActionReceipt" ADD CONSTRAINT "StaffActionReceipt_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffActionReceipt" ADD CONSTRAINT "StaffActionReceipt_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE INDEX "Case_programId_status_createdAt_idx" ON "Case"("programId", "status", "createdAt");
CREATE INDEX "Case_programId_followUpAt_idx" ON "Case"("programId", "followUpAt");
CREATE INDEX "PayoutRequest_programId_status_createdAt_idx" ON "PayoutRequest"("programId", "status", "createdAt");
CREATE INDEX "ServiceDirectory_programId_isActive_name_idx" ON "ServiceDirectory"("programId", "isActive", "name");
CREATE INDEX "AuditLog_programId_createdAt_idx" ON "AuditLog"("programId", "createdAt");
