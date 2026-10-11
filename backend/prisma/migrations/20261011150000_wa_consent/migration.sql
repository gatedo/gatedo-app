-- Máquina de Prospecção: atendimento com consentimento (opt-in/opt-out,
-- atendimento humano, eventos para métricas). Reversível: ver down.sql.

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "humanHandoffAt" TIMESTAMP(3),
ADD COLUMN     "menuSentAt" TIMESTAMP(3),
ADD COLUMN     "optin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optinAt" TIMESTAMP(3),
ADD COLUMN     "optinSource" TEXT,
ADD COLUMN     "optoutAt" TIMESTAMP(3),
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "senderId" TEXT;

-- CreateTable
CREATE TABLE "ProspectEvent" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectEvent_type_createdAt_idx" ON "ProspectEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ProspectEvent_prospectId_idx" ON "ProspectEvent"("prospectId");

-- CreateIndex
CREATE INDEX "Prospect_optin_idx" ON "Prospect"("optin");

-- AddForeignKey
ALTER TABLE "ProspectEvent" ADD CONSTRAINT "ProspectEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Quem escreveu primeiro já tinha a tag inbound.
UPDATE "Prospect" SET "origin" = 'inbound' WHERE 'inbound' = ANY("tags");

-- Lista antiga (importada de grupos): fora de qualquer disparo até ter opt-in.
UPDATE "Prospect"
  SET "origin" = 'importado',
      "tags" = array_append("tags", 'importado-sem-optin')
  WHERE NOT ('inbound' = ANY("tags")) AND NOT ('importado-sem-optin' = ANY("tags"));
