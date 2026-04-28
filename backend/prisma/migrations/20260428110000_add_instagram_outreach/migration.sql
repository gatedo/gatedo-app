CREATE TABLE "InstagramLead" (
    "id" TEXT NOT NULL,
    "instagramUserId" TEXT,
    "username" TEXT,
    "fullName" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'new',
    "score" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastInteractionAt" TIMESTAMP(3),
    "conversationWindowUntil" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstagramLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramInteraction" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mediaId" TEXT,
    "commentId" TEXT,
    "permalink" TEXT,
    "text" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privateReplyUntil" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "InstagramInteraction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "metaMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "blockedReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstagramMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'outreach',
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstagramTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramComplianceLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "leadId" TEXT,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstagramComplianceLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramLead_instagramUserId_key" ON "InstagramLead"("instagramUserId");
CREATE INDEX "InstagramLead_status_idx" ON "InstagramLead"("status");
CREATE INDEX "InstagramLead_source_idx" ON "InstagramLead"("source");
CREATE INDEX "InstagramLead_username_idx" ON "InstagramLead"("username");
CREATE INDEX "InstagramLead_lastInteractionAt_idx" ON "InstagramLead"("lastInteractionAt");
CREATE INDEX "InstagramInteraction_leadId_idx" ON "InstagramInteraction"("leadId");
CREATE INDEX "InstagramInteraction_type_idx" ON "InstagramInteraction"("type");
CREATE INDEX "InstagramInteraction_occurredAt_idx" ON "InstagramInteraction"("occurredAt");
CREATE INDEX "InstagramMessage_leadId_idx" ON "InstagramMessage"("leadId");
CREATE INDEX "InstagramMessage_status_idx" ON "InstagramMessage"("status");
CREATE INDEX "InstagramTemplate_active_idx" ON "InstagramTemplate"("active");
CREATE INDEX "InstagramTemplate_category_idx" ON "InstagramTemplate"("category");
CREATE INDEX "InstagramComplianceLog_leadId_idx" ON "InstagramComplianceLog"("leadId");
CREATE INDEX "InstagramComplianceLog_action_idx" ON "InstagramComplianceLog"("action");
CREATE INDEX "InstagramComplianceLog_createdAt_idx" ON "InstagramComplianceLog"("createdAt");

ALTER TABLE "InstagramInteraction" ADD CONSTRAINT "InstagramInteraction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "InstagramLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramMessage" ADD CONSTRAINT "InstagramMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "InstagramLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
