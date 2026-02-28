-- CreateTable
CREATE TABLE "TreatmentSchedule" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "intervalHours" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentDose" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreatmentDose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreatmentSchedule_petId_idx" ON "TreatmentSchedule"("petId");

-- CreateIndex
CREATE INDEX "TreatmentSchedule_userId_idx" ON "TreatmentSchedule"("userId");

-- CreateIndex
CREATE INDEX "TreatmentSchedule_active_idx" ON "TreatmentSchedule"("active");

-- CreateIndex
CREATE INDEX "TreatmentDose_scheduleId_idx" ON "TreatmentDose"("scheduleId");

-- CreateIndex
CREATE INDEX "TreatmentDose_scheduledAt_idx" ON "TreatmentDose"("scheduledAt");

-- AddForeignKey
ALTER TABLE "TreatmentSchedule" ADD CONSTRAINT "TreatmentSchedule_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentDose" ADD CONSTRAINT "TreatmentDose_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TreatmentSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
