-- Loja "Achados do Gatedo": status, links app/grupo, subid, papel, comissão,
-- gancho, data do preço e destaque na home. Reversível: ver down.sql.

ALTER TABLE "Product"
  ADD COLUMN "status"         TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN "priceCheckedAt" TIMESTAMP(3),
  ADD COLUMN "linkApp"        TEXT,
  ADD COLUMN "linkGroup"      TEXT,
  ADD COLUMN "subid"          TEXT,
  ADD COLUMN "role"           TEXT,
  ADD COLUMN "commissionPct"  DOUBLE PRECISION,
  ADD COLUMN "gancho"         VARCHAR(120),
  ADD COLUMN "featured"       BOOLEAN NOT NULL DEFAULT false;

-- externalLink continua existindo; linkApp nasce com o valor dele.
UPDATE "Product" SET "linkApp" = "externalLink" WHERE "externalLink" IS NOT NULL AND "externalLink" <> '';

-- Produtos em Saúde/Medicamento ficam rascunho até recategorizar.
UPDATE "Product" p SET "status" = 'draft'
  FROM "Category" c WHERE c."id" = p."categoryId" AND c."name" IN ('Saúde', 'Medicamento');

-- Categorias da loja (só cria as que faltam; IDs existentes ficam).
INSERT INTO "Category" ("id", "name")
SELECT gen_random_uuid()::text, n
FROM unnest(ARRAY['Alimentação','Petisco','Higiene','Hidratação','Enriquecimento','Conforto','Pelagem','Transporte']) AS n
WHERE NOT EXISTS (SELECT 1 FROM "Category" c WHERE c."name" = n);
