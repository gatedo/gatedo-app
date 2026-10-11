-- Loja: cadastro automático por API de afiliados (Shopee/ML) e rotina diária
-- de preço/comissão. Só adiciona colunas nulas; reversível: ver down.sql.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "commissionExtra" BOOLEAN,
ADD COLUMN     "commissionValue" DECIMAL(10,2),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "salesCount" INTEGER,
ADD COLUMN     "shopOfficial" BOOLEAN,
ADD COLUMN     "syncAlerts" JSONB,
ADD COLUMN     "syncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
