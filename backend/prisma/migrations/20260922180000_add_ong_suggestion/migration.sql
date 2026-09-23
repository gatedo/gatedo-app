-- Sugestões de melhoria enviadas por ONGs parceiras.
CREATE TABLE "OngSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OngSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OngSuggestion_userId_idx" ON "OngSuggestion"("userId");
CREATE INDEX "OngSuggestion_status_idx" ON "OngSuggestion"("status");

ALTER TABLE "OngSuggestion" ADD CONSTRAINT "OngSuggestion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
