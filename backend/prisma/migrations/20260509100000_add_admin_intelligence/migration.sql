CREATE TABLE "AdminVenture" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "stage" TEXT,
    "pipelineStage" TEXT NOT NULL DEFAULT 'Ideia',
    "horizon" TEXT,
    "owner" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "impact" INTEGER NOT NULL DEFAULT 0,
    "complexity" INTEGER NOT NULL DEFAULT 0,
    "revenue" TEXT,
    "model" TEXT,
    "thesis" TEXT,
    "risk" TEXT,
    "revenueLines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kpis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "partners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nextMoves" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doneMoves" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminVenture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Briefing',
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objective" TEXT,
    "audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget" TEXT,
    "deadline" TEXT,
    "formats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hook" TEXT,
    "headline" TEXT,
    "cta" TEXT,
    "caption" TEXT,
    "assets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "results" TEXT,
    "owner" TEXT,
    "kpis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminVenture_pipelineStage_idx" ON "AdminVenture"("pipelineStage");
CREATE INDEX "AdminVenture_score_idx" ON "AdminVenture"("score");
CREATE INDEX "AdminVenture_updatedAt_idx" ON "AdminVenture"("updatedAt");
CREATE INDEX "AdminCampaign_status_idx" ON "AdminCampaign"("status");
CREATE INDEX "AdminCampaign_type_idx" ON "AdminCampaign"("type");
CREATE INDEX "AdminCampaign_updatedAt_idx" ON "AdminCampaign"("updatedAt");
