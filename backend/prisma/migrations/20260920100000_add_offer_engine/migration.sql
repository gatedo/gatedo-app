-- Ocorrências estruturadas no diário (ex.: xixi fora da caixa) — usado pelo
-- motor de decisão de oferta pra detectar contexto de dor sem palavra-chave.
ALTER TABLE "DiaryEntry"
ADD COLUMN "occurrences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Tags de perfil do gato em produtos, pra recomendação da Loja.
ALTER TABLE "Product"
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Rastreio de impressão/clique/conversão do motor único de decisão de oferta.
CREATE TABLE "OfferEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "surface" TEXT NOT NULL,
    "offerKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfferEvent_userId_createdAt_idx" ON "OfferEvent"("userId", "createdAt");
CREATE INDEX "OfferEvent_offerKey_action_idx" ON "OfferEvent"("offerKey", "action");
CREATE INDEX "OfferEvent_surface_action_idx" ON "OfferEvent"("surface", "action");

ALTER TABLE "OfferEvent" ADD CONSTRAINT "OfferEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferEvent" ADD CONSTRAINT "OfferEvent_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
