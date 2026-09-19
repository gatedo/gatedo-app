-- CreateTable
CREATE TABLE "IgentUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "action" TEXT NOT NULL DEFAULT 'QUESTION',
    "provider" TEXT,
    "tokensUsed" INTEGER,
    "costEstimate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IgentUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IgentUsageLog_userId_createdAt_idx" ON "IgentUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "IgentUsageLog_petId_createdAt_idx" ON "IgentUsageLog"("petId", "createdAt");

-- AddForeignKey
ALTER TABLE "IgentUsageLog" ADD CONSTRAINT "IgentUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgentUsageLog" ADD CONSTRAINT "IgentUsageLog_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
