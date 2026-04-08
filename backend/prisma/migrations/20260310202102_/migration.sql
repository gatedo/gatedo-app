/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetPasswordToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "IgentSession" DROP CONSTRAINT "IgentSession_petId_fkey";

-- DropIndex
DROP INDEX "TreatmentDose_scheduleId_idx";

-- DropIndex
DROP INDEX "TreatmentDose_scheduledAt_idx";

-- DropIndex
DROP INDEX "TreatmentSchedule_active_idx";

-- DropIndex
DROP INDEX "TreatmentSchedule_petId_idx";

-- DropIndex
DROP INDEX "TreatmentSchedule_userId_idx";

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "pedigreeBackUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- AddForeignKey
ALTER TABLE "IgentSession" ADD CONSTRAINT "IgentSession_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
