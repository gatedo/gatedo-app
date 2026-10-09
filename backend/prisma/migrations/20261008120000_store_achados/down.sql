-- Desfaz 20261008120000_store_achados. Rodar manualmente e depois:
--   npx prisma migrate resolve --rolled-back 20261008120000_store_achados
-- externalLink nunca foi apagado, então o link antigo continua lá.
-- As categorias criadas ficam (podem ter produtos); apague à mão se quiser.
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "priceCheckedAt",
  DROP COLUMN IF EXISTS "linkApp",
  DROP COLUMN IF EXISTS "linkGroup",
  DROP COLUMN IF EXISTS "subid",
  DROP COLUMN IF EXISTS "role",
  DROP COLUMN IF EXISTS "commissionPct",
  DROP COLUMN IF EXISTS "gancho",
  DROP COLUMN IF EXISTS "featured";
