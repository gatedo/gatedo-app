/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[ownerId]` on the table `VetPartner` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "foodAmount" TEXT,
ADD COLUMN     "pedigreeUrl" TEXT,
ADD COLUMN     "skillAgility" INTEGER NOT NULL DEFAULT 85,
ADD COLUMN     "skillCuriosity" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "skillDocile" INTEGER NOT NULL DEFAULT 95,
ADD COLUMN     "skillEnergy" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "skillIndep" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "skillSocial" INTEGER NOT NULL DEFAULT 80;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpires" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "VetPartner" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "VetPartner_ownerId_key" ON "VetPartner"("ownerId");

-- AddForeignKey
ALTER TABLE "VetPartner" ADD CONSTRAINT "VetPartner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
