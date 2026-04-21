/*
  Warnings:

  - You are about to drop the column `resultUrl` on the `StudioCreation` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `StudioCreation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StudioCreationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PUBLISHED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'FOUNDER';
ALTER TYPE "Role" ADD VALUE 'TESTER_VIP';

-- DropForeignKey
ALTER TABLE "StudioCreation" DROP CONSTRAINT "StudioCreation_userId_fkey";

-- DropIndex
DROP INDEX "StudioCreation_userId_petId_createdAt_idx";

-- AlterTable
ALTER TABLE "StudioCreation" DROP COLUMN "resultUrl",
ADD COLUMN     "addedToPetGalleryAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "moduleKey" TEXT,
ADD COLUMN     "moduleLabel" TEXT,
ADD COLUMN     "outputImageUrl" TEXT,
ADD COLUMN     "outputVideoUrl" TEXT,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "StudioCreationStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "StudioCreation_userId_createdAt_idx" ON "StudioCreation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StudioCreation_userId_status_createdAt_idx" ON "StudioCreation"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "StudioCreation_petId_createdAt_idx" ON "StudioCreation"("petId", "createdAt");

-- CreateIndex
CREATE INDEX "StudioCreation_type_createdAt_idx" ON "StudioCreation"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "StudioCreation" ADD CONSTRAINT "StudioCreation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
