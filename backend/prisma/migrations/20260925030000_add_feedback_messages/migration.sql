CREATE TABLE "feedback_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "source" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "adminReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_messages_status_createdAt_idx" ON "feedback_messages"("status", "createdAt");
CREATE INDEX "feedback_messages_userId_idx" ON "feedback_messages"("userId");

ALTER TABLE "feedback_messages" ADD CONSTRAINT "feedback_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
