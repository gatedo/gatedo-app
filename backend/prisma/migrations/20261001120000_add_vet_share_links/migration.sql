-- Aditiva: só cria a tabela da Pasta do Vet. Não altera nem apaga nada.
CREATE TABLE "vet_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vet_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vet_share_links_token_key" ON "vet_share_links"("token");
CREATE INDEX "vet_share_links_petId_idx" ON "vet_share_links"("petId");
CREATE INDEX "vet_share_links_ownerId_idx" ON "vet_share_links"("ownerId");

ALTER TABLE "vet_share_links" ADD CONSTRAINT "vet_share_links_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vet_share_links" ADD CONSTRAINT "vet_share_links_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
