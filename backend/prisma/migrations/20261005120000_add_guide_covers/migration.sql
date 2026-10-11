-- Aditiva: só cria colunas opcionais de imagem. Não altera nem apaga nada.
ALTER TABLE "GuideCategory" ADD COLUMN "coverUrl" TEXT;
ALTER TABLE "GuideEntry" ADD COLUMN "coverUrl" TEXT;
