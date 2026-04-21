-- AlterTable
ALTER TABLE "MemorialTribute" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "arrivalNotes" TEXT,
ADD COLUMN     "arrivalType" TEXT,
ADD COLUMN     "coatType" TEXT,
ADD COLUMN     "coexistsWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "feedFrequencyMode" TEXT,
ADD COLUMN     "feedFrequencyNotes" TEXT,
ADD COLUMN     "hasBehaviorIssues" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTraumaHistory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preExistingConditions" TEXT[] DEFAULT ARRAY[]::TEXT[];
