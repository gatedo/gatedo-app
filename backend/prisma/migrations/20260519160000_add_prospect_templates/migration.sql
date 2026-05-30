CREATE TABLE "ProspectTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "color" TEXT,
    "labelColor" TEXT,
    "bubbleColor" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "message" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProspectTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProspectTemplate_sortOrder_idx" ON "ProspectTemplate"("sortOrder");
CREATE INDEX "ProspectTemplate_active_idx" ON "ProspectTemplate"("active");
