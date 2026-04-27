-- Add missing subscription renewal flag expected by the Prisma schema.
ALTER TABLE "Subscription"
ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
