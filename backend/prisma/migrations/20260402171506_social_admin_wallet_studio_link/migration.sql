-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "studioCreationId" TEXT;

-- AlterTable
ALTER TABLE "StudioCreation" ADD COLUMN     "petId" TEXT;

-- CreateTable
CREATE TABLE "BalanceAdjustmentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "walletDelta" INTEGER NOT NULL DEFAULT 0,
    "xpDelta" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceAdjustmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceAdjustmentLog_userId_createdAt_idx" ON "BalanceAdjustmentLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceAdjustmentLog_actorId_createdAt_idx" ON "BalanceAdjustmentLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_studioCreationId_idx" ON "Post"("studioCreationId");

-- CreateIndex
CREATE INDEX "StudioCreation_userId_petId_createdAt_idx" ON "StudioCreation"("userId", "petId", "createdAt");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_studioCreationId_fkey" FOREIGN KEY ("studioCreationId") REFERENCES "StudioCreation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioCreation" ADD CONSTRAINT "StudioCreation_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceAdjustmentLog" ADD CONSTRAINT "BalanceAdjustmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceAdjustmentLog" ADD CONSTRAINT "BalanceAdjustmentLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
