/*
  Warnings:

  - You are about to drop the column `xpReward` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.
  - Added the required column `ownerType` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AchievementOwnerType" AS ENUM ('TUTOR', 'PET');

-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "xpReward",
ADD COLUMN     "ownerType" "AchievementOwnerType" NOT NULL,
ADD COLUMN     "xpgReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xptReward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "xp",
ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "xpg" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "xp",
ADD COLUMN     "founderBonusMonthsPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "founderGrantedAt" TIMESTAMP(3),
ADD COLUMN     "gatedoPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpt" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PetAchievement" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rarity" TEXT,
    "source" TEXT,
    "meta" JSONB,

    CONSTRAINT "PetAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "action" TEXT NOT NULL,
    "gptsDelta" INTEGER NOT NULL DEFAULT 0,
    "xptDelta" INTEGER NOT NULL DEFAULT 0,
    "xpgDelta" INTEGER NOT NULL DEFAULT 0,
    "badgeGranted" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetAchievement_petId_unlockedAt_idx" ON "PetAchievement"("petId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetAchievement_petId_achievementId_key" ON "PetAchievement"("petId", "achievementId");

-- CreateIndex
CREATE INDEX "RewardEvent_userId_createdAt_idx" ON "RewardEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardEvent_petId_createdAt_idx" ON "RewardEvent"("petId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardEvent_action_idx" ON "RewardEvent"("action");

-- AddForeignKey
ALTER TABLE "PetAchievement" ADD CONSTRAINT "PetAchievement_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAchievement" ADD CONSTRAINT "PetAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAchievement" ADD CONSTRAINT "PetAchievement_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
