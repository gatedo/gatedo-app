-- AlterTable
ALTER TABLE "IgentSession" 
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- CreateIndex
CREATE INDEX "IgentSession_petId_idx" ON "IgentSession"("petId");