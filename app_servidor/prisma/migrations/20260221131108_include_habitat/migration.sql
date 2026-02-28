-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "habitat" TEXT,
ADD COLUMN     "riskAreaAccess" BOOLEAN NOT NULL DEFAULT false;
