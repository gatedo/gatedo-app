/*
  Warnings:

  - You are about to drop the column `active` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Notice` table. All the data in the column will be lost.
  - Added the required column `content` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Notice_active_priority_idx";

-- DropIndex
DROP INDEX "Notice_expiresAt_idx";

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "active",
DROP COLUMN "message",
DROP COLUMN "priority",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'INFO',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "xpReward" SET DEFAULT 3;

-- CreateTable
CREATE TABLE "notice_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpGranted" BOOLEAN NOT NULL DEFAULT false,
    "xpGrantedAt" TIMESTAMP(3),

    CONSTRAINT "notice_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notice_reads_userId_idx" ON "notice_reads"("userId");

-- CreateIndex
CREATE INDEX "notice_reads_noticeId_idx" ON "notice_reads"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "notice_reads_userId_noticeId_key" ON "notice_reads"("userId", "noticeId");

-- AddForeignKey
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
