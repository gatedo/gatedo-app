-- CreateTable
CREATE TABLE "IgentSession" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symptomId" TEXT NOT NULL,
    "symptomLabel" TEXT NOT NULL,
    "isUrgent" BOOLEAN NOT NULL,
    "analysisText" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "clinicalSnapshot" JSONB NOT NULL,
    "ownerResponse" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "severity" TEXT,

    CONSTRAINT "IgentSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IgentSession" ADD CONSTRAINT "IgentSession_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
