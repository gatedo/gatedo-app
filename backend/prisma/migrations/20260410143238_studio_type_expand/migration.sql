/*
  Warnings:

  - The values [MAGAZINE] on the enum `StudioType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,achievementId]` on the table `UserAchievement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudioType_new" AS ENUM ('PORTRAIT', 'STICKER', 'ID_CARD', 'MIND_READER', 'TUTOR_CAT', 'DANCE', 'CAT_VOICE', 'ANIMATED_STORY', 'MEME_MAKER', 'VOGUE_CAT');
ALTER TABLE "StudioCreation" ALTER COLUMN "type" TYPE "StudioType_new" USING ("type"::text::"StudioType_new");
ALTER TYPE "StudioType" RENAME TO "StudioType_old";
ALTER TYPE "StudioType_new" RENAME TO "StudioType";
DROP TYPE "StudioType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_userId_fkey";

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "pointReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rarity" TEXT DEFAULT 'common',
ALTER COLUMN "iconUrl" DROP NOT NULL,
ALTER COLUMN "xpReward" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "UserAchievement" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "rarity" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
