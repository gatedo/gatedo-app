-- Desfaz 20261011120000_store_affiliate_sync. Rodar manualmente e depois:
--   npx prisma migrate resolve --rolled-back 20261011120000_store_affiliate_sync
DROP INDEX IF EXISTS "Product_externalId_key";
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "commissionExtra",
  DROP COLUMN IF EXISTS "commissionValue",
  DROP COLUMN IF EXISTS "externalId",
  DROP COLUMN IF EXISTS "rating",
  DROP COLUMN IF EXISTS "salesCount",
  DROP COLUMN IF EXISTS "shopOfficial",
  DROP COLUMN IF EXISTS "syncAlerts",
  DROP COLUMN IF EXISTS "syncedAt";
