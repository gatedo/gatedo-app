-- Desfaz 20261012120000_store_categories_petshop em parte: devolve os
-- produtos às categorias antigas pelo nome novo (as correções por nome de
-- produto não voltam). Rodar manualmente e depois:
--   npx prisma migrate resolve --rolled-back 20261012120000_store_categories_petshop
INSERT INTO "Category" ("id", "name")
SELECT gen_random_uuid()::text, n
FROM unnest(ARRAY['Alimentação','Petisco','Higiene','Hidratação','Enriquecimento','Conforto','Pelagem','Transporte']) AS n
WHERE NOT EXISTS (SELECT 1 FROM "Category" c WHERE c."name" = n);

UPDATE "Product" p
SET "categoryId" = (SELECT o."id" FROM "Category" o WHERE o."name" = m.antigo LIMIT 1)
FROM "Category" c,
     (VALUES ('Ração', 'Alimentação'), ('Petiscos', 'Petisco'), ('Areias e Banheiros', 'Higiene'),
             ('Acessórios de Alimentação', 'Hidratação'), ('Arranhadores e Brinquedos', 'Enriquecimento'),
             ('Camas, Almofadas e Tocas', 'Conforto'), ('Beleza e Limpeza', 'Pelagem'),
             ('Acessórios de Transporte', 'Transporte'), ('Coleiras e Peitorais', 'Conforto'),
             ('Roupas', 'Conforto')) AS m(novo, antigo)
WHERE c."id" = p."categoryId" AND c."name" = m.novo;
