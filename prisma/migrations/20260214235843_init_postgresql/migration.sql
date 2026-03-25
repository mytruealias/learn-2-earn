-- CreateTable
CREATE TABLE "Path" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '📘',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "type" TEXT NOT NULL DEFAULT 'learn',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "body" TEXT,
    "mediaUrl" TEXT,
    "choicesJson" TEXT,
    "answerJson" TEXT,
    "explain" TEXT,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "guestId" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "dateOfBirth" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "caseNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "hearts" INTEGER NOT NULL DEFAULT 5,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "crownLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "dollarAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'caseworker',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Path_slug_key" ON "Path"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Module_pathId_slug_key" ON "Module"("pathId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_guestId_key" ON "User"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
