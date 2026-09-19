-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProtocolStepKind" AS ENUM ('TRIAGE', 'DAY', 'CLOSING');

-- CreateEnum
CREATE TYPE "ProtocolEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "GuideEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "requiresFounder" BOOLEAN NOT NULL DEFAULT true,
    "totalDays" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolStep" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "kind" "ProtocolStepKind" NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "taskShort" TEXT,
    "whyText" TEXT,
    "asksRating" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProtocolStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolEnrollment" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "status" "ProtocolEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "resolved" BOOLEAN,

    CONSTRAINT "ProtocolEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolDayLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "severityScore" INTEGER,
    "advancedEarly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProtocolDayLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuideEntry_slug_key" ON "GuideEntry"("slug");

-- CreateIndex
CREATE INDEX "GuideEntry_theme_idx" ON "GuideEntry"("theme");

-- CreateIndex
CREATE INDEX "GuideEntry_status_idx" ON "GuideEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_slug_key" ON "Protocol"("slug");

-- CreateIndex
CREATE INDEX "Protocol_status_idx" ON "Protocol"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolStep_protocolId_dayNumber_key" ON "ProtocolStep"("protocolId", "dayNumber");

-- CreateIndex
CREATE INDEX "ProtocolEnrollment_userId_idx" ON "ProtocolEnrollment"("userId");

-- CreateIndex
CREATE INDEX "ProtocolEnrollment_petId_idx" ON "ProtocolEnrollment"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolDayLog_enrollmentId_dayNumber_key" ON "ProtocolDayLog"("enrollmentId", "dayNumber");

-- AddForeignKey
ALTER TABLE "ProtocolStep" ADD CONSTRAINT "ProtocolStep_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolEnrollment" ADD CONSTRAINT "ProtocolEnrollment_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolEnrollment" ADD CONSTRAINT "ProtocolEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolEnrollment" ADD CONSTRAINT "ProtocolEnrollment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolDayLog" ADD CONSTRAINT "ProtocolDayLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProtocolEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
