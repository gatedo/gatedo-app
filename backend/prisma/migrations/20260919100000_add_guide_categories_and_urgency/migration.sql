-- CreateEnum
CREATE TYPE "GuideUrgency" AS ENUM ('ROTINA', 'ATENCAO', 'EMERGENCIA');

-- CreateTable
CREATE TABLE "GuideCategory" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GuideEntry"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "urgency" "GuideUrgency",
ADD COLUMN "vejaTambem" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "perguntaIgentvet" TEXT;

-- CreateIndex
CREATE INDEX "GuideEntry_categoryId_idx" ON "GuideEntry"("categoryId");

-- AddForeignKey
ALTER TABLE "GuideEntry" ADD CONSTRAINT "GuideEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GuideCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
