-- AlterTable: Protocol ganha o conteúdo "rico" (spec) e o gate por produto
ALTER TABLE "Protocol"
ADD COLUMN "spec" JSONB,
ADD COLUMN "entitlementProductId" TEXT;

-- Migração segura do enum de status (nomes novos, sem perder dado existente)
ALTER TABLE "ProtocolEnrollment" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "ProtocolEnrollmentStatus_new" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'INTERROMPIDO_EMERGENCIA');

ALTER TABLE "ProtocolEnrollment" ALTER COLUMN "status" TYPE "ProtocolEnrollmentStatus_new" USING (
  CASE "status"::text
    WHEN 'ACTIVE' THEN 'EM_ANDAMENTO'
    WHEN 'COMPLETED' THEN 'CONCLUIDO'
    WHEN 'ABANDONED' THEN 'INTERROMPIDO_EMERGENCIA'
    ELSE 'EM_ANDAMENTO'
  END::"ProtocolEnrollmentStatus_new"
);

DROP TYPE "ProtocolEnrollmentStatus";
ALTER TYPE "ProtocolEnrollmentStatus_new" RENAME TO "ProtocolEnrollmentStatus";

ALTER TABLE "ProtocolEnrollment" ALTER COLUMN "status" SET DEFAULT 'EM_ANDAMENTO';

-- AlterTable: ProtocolEnrollment ganha respostas da triagem e a tarefa fixa
ALTER TABLE "ProtocolEnrollment"
ADD COLUMN "triageAnswers" JSONB,
ADD COLUMN "fixedTaskDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: ProtocolDayLog ganha o checklist marcado
ALTER TABLE "ProtocolDayLog"
ADD COLUMN "checklist" JSONB;

-- CreateTable: uma linha por registro salvo (cobre "repetivel")
CREATE TABLE "ProtocolDayEntry" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolDayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProtocolDayEntry_dayLogId_idx" ON "ProtocolDayEntry"("dayLogId");

-- AddForeignKey
ALTER TABLE "ProtocolDayEntry" ADD CONSTRAINT "ProtocolDayEntry_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "ProtocolDayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
