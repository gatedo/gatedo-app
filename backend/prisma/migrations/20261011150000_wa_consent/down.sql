-- Desfaz 20261011150000_wa_consent. Rodar manualmente e depois:
--   npx prisma migrate resolve --rolled-back 20261011150000_wa_consent
UPDATE "Prospect" SET "tags" = array_remove("tags", 'importado-sem-optin');
DROP TABLE IF EXISTS "ProspectEvent";
DROP INDEX IF EXISTS "Prospect_optin_idx";
ALTER TABLE "Prospect"
  DROP COLUMN IF EXISTS "humanHandoffAt",
  DROP COLUMN IF EXISTS "menuSentAt",
  DROP COLUMN IF EXISTS "optin",
  DROP COLUMN IF EXISTS "optinAt",
  DROP COLUMN IF EXISTS "optinSource",
  DROP COLUMN IF EXISTS "optoutAt",
  DROP COLUMN IF EXISTS "origin",
  DROP COLUMN IF EXISTS "senderId";
