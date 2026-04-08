-- CreateTable
CREATE TABLE "ProductShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductShare_token_key" ON "ProductShare"("token");

-- CreateIndex
CREATE INDEX "ProductShare_userId_idx" ON "ProductShare"("userId");

-- CreateIndex
CREATE INDEX "ProductShare_token_idx" ON "ProductShare"("token");

-- AddForeignKey
ALTER TABLE "ProductShare" ADD CONSTRAINT "ProductShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductShare" ADD CONSTRAINT "ProductShare_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
