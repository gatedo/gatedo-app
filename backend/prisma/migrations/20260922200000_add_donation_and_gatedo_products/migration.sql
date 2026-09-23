-- Bloco "Apoie o GATEDO" (Perfil + pós-PDF).
ALTER TABLE "User" ADD COLUMN "donationPromptSeenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "donationDismissedAt" TIMESTAMP(3);

-- Bloco "Do GATEDO" da Loja — produtos digitais próprios com entitlement.
ALTER TABLE "Product" ADD COLUMN "entitlementProductId" TEXT;
