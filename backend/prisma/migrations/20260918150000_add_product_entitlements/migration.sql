-- CreateTable
CREATE TABLE "ProductEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'KIWIFY',
    "externalId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingProductEntitlement" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'KIWIFY',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingProductEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductEntitlement_userId_productId_key" ON "ProductEntitlement"("userId", "productId");

-- CreateIndex
CREATE INDEX "ProductEntitlement_userId_idx" ON "ProductEntitlement"("userId");

-- CreateIndex
CREATE INDEX "ProductEntitlement_externalId_idx" ON "ProductEntitlement"("externalId");

-- CreateIndex
CREATE INDEX "PendingProductEntitlement_email_idx" ON "PendingProductEntitlement"("email");

-- AddForeignKey
ALTER TABLE "ProductEntitlement" ADD CONSTRAINT "ProductEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
