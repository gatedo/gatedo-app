-- Loja: categorias no padrão de pet shop. Só dados (sem mudança de schema).
-- Farmácia fica de fora (medicamento não entra na loja); Raças/Marcas são
-- filtros, não categorias. Reversível em parte: ver down.sql.

-- 1. Categorias novas (só cria as que faltam).
INSERT INTO "Category" ("id", "name")
SELECT gen_random_uuid()::text, n
FROM unnest(ARRAY[
  'Ração', 'Petiscos', 'Areias e Banheiros', 'Arranhadores e Brinquedos',
  'Beleza e Limpeza', 'Coleiras e Peitorais', 'Acessórios de Alimentação',
  'Acessórios de Transporte', 'Camas, Almofadas e Tocas', 'Roupas'
]) AS n
WHERE NOT EXISTS (SELECT 1 FROM "Category" c WHERE c."name" = n);

-- 2. Nome antigo → novo (inclui as categorias duplicadas pelo import).
UPDATE "Product" p
SET "categoryId" = (SELECT n."id" FROM "Category" n WHERE n."name" = m.novo LIMIT 1)
FROM "Category" c,
     (VALUES ('Alimentação', 'Ração'), ('Petisco', 'Petiscos'), ('Higiene', 'Areias e Banheiros'),
             ('Hidratação', 'Acessórios de Alimentação'), ('Enriquecimento', 'Arranhadores e Brinquedos'),
             ('Conforto', 'Camas, Almofadas e Tocas'), ('Pelagem', 'Beleza e Limpeza'),
             ('Transporte', 'Acessórios de Transporte')) AS m(antigo, novo)
WHERE c."id" = p."categoryId" AND c."name" = m.antigo;

-- 3. Correções pelo nome do produto (estavam na categoria errada). A ordem
--    importa: "Casinha Toca Arranhador" termina em Camas e Tocas.
UPDATE "Product" p
SET "categoryId" = (SELECT n."id" FROM "Category" n WHERE n."name" = 'Arranhadores e Brinquedos' LIMIT 1)
FROM "Category" c
WHERE c."id" = p."categoryId" AND c."name" <> 'Medicamento'
  AND p."name" ~* '(^|[^[:alpha:]])(arranhador|arranhadores|brinquedo|brinquedos|varinha|bola interativa|playground|gatificação)([^[:alpha:]]|$)';

UPDATE "Product" p
SET "categoryId" = (SELECT n."id" FROM "Category" n WHERE n."name" = 'Acessórios de Alimentação' LIMIT 1)
FROM "Category" c
WHERE c."id" = p."categoryId" AND c."name" <> 'Medicamento'
  AND p."name" ~* '(^|[^[:alpha:]])(alimentador|comedouro|fonte|bebedouro)([^[:alpha:]]|$)';

UPDATE "Product" p
SET "categoryId" = (SELECT n."id" FROM "Category" n WHERE n."name" = 'Camas, Almofadas e Tocas' LIMIT 1)
FROM "Category" c
WHERE c."id" = p."categoryId" AND c."name" <> 'Medicamento'
  AND p."name" ~* '(^|[^[:alpha:]])(cama|camas|toca|tocas|almofada|nicho)([^[:alpha:]]|$)';

-- 4. Remove as categorias antigas que ficaram vazias (Saúde e Medicamento
--    continuam: são as categorias bloqueadas/legado).
DELETE FROM "Category" c
WHERE c."name" IN ('Alimentação', 'Petisco', 'Higiene', 'Hidratação', 'Enriquecimento', 'Conforto', 'Pelagem', 'Transporte')
  AND NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."categoryId" = c."id");
