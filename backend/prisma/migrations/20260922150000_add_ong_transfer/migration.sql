-- Contas ONG + transferência de tutoria de gatos.

-- Novos valores de enum (statements isolados, sem depender de nada nesta mesma migration).
ALTER TYPE "Role" ADD VALUE 'ONG';
ALTER TYPE "HealthType" ADD VALUE 'ADOPTION';

-- Campos novos em Pet.
ALTER TABLE "Pet" ADD COLUMN "adoptionStatus" TEXT;
ALTER TABLE "Pet" ADD COLUMN "ongInternalNotes" TEXT;

-- Perfil da ONG (1:1 com User).
CREATE TABLE "OngProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpjOuResponsavel" TEXT NOT NULL,
    "city" TEXT,
    "instagram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "OngProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OngProfile_userId_key" ON "OngProfile"("userId");
CREATE INDEX "OngProfile_status_idx" ON "OngProfile"("status");

ALTER TABLE "OngProfile" ADD CONSTRAINT "OngProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convite de transferência de tutoria.
CREATE TABLE "PetTransferInvite" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "ongUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "ongSnapshot" JSONB,

    CONSTRAINT "PetTransferInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PetTransferInvite_token_key" ON "PetTransferInvite"("token");
CREATE INDEX "PetTransferInvite_petId_idx" ON "PetTransferInvite"("petId");
CREATE INDEX "PetTransferInvite_ongUserId_idx" ON "PetTransferInvite"("ongUserId");
CREATE INDEX "PetTransferInvite_status_idx" ON "PetTransferInvite"("status");

ALTER TABLE "PetTransferInvite" ADD CONSTRAINT "PetTransferInvite_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PetTransferInvite" ADD CONSTRAINT "PetTransferInvite_ongUserId_fkey"
    FOREIGN KEY ("ongUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PetTransferInvite" ADD CONSTRAINT "PetTransferInvite_acceptedByUserId_fkey"
    FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
