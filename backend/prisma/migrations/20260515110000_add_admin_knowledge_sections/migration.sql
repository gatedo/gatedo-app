CREATE TABLE IF NOT EXISTS "AdminKnowledgeSection" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'IGENT_FELINE_ALMANAC',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "source" TEXT NOT NULL DEFAULT 'ADMIN',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminKnowledgeSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminKnowledgeSection_slug_key" ON "AdminKnowledgeSection"("slug");
CREATE INDEX IF NOT EXISTS "AdminKnowledgeSection_scope_idx" ON "AdminKnowledgeSection"("scope");
CREATE INDEX IF NOT EXISTS "AdminKnowledgeSection_status_idx" ON "AdminKnowledgeSection"("status");
CREATE INDEX IF NOT EXISTS "AdminKnowledgeSection_active_idx" ON "AdminKnowledgeSection"("active");

ALTER TABLE "AdminKnowledgeSection"
ADD COLUMN IF NOT EXISTS "metadata" JSONB;
