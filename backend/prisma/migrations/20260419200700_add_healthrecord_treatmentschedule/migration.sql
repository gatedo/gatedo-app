-- AlterTable
ALTER TABLE "HealthRecord" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appointmentMode" TEXT,
ADD COLUMN     "clinicAddress" TEXT,
ADD COLUMN     "clinicName" TEXT,
ADD COLUMN     "clinicPhone" TEXT,
ADD COLUMN     "isControlled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ongoing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prescription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prescriptionDocId" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "recheckDate" TIMESTAMP(3),
ADD COLUMN     "recommendedRecheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialty" TEXT;

-- AlterTable
ALTER TABLE "TreatmentSchedule" ADD COLUMN     "clinicAddress" TEXT,
ADD COLUMN     "clinicName" TEXT,
ADD COLUMN     "clinicPhone" TEXT,
ADD COLUMN     "originHealthRecordId" TEXT,
ADD COLUMN     "originPrescriptionDocumentId" TEXT,
ADD COLUMN     "veterinarian" TEXT;
