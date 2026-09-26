ALTER TABLE "IgentUsageLog" ADD COLUMN "model" TEXT;
ALTER TABLE "IgentUsageLog" ADD COLUMN "tokensIn" INTEGER;
ALTER TABLE "IgentUsageLog" ADD COLUMN "tokensOut" INTEGER;
ALTER TABLE "IgentUsageLog" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'QUOTA';

CREATE TABLE "ai_credit_packs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 30,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credit_packs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_credit_packs_userId_status_expiresAt_idx" ON "ai_credit_packs"("userId", "status", "expiresAt");

ALTER TABLE "ai_credit_packs" ADD CONSTRAINT "ai_credit_packs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pending_ai_credit_packs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 30,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_ai_credit_packs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pending_ai_credit_packs_email_idx" ON "pending_ai_credit_packs"("email");
