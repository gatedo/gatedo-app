CREATE TABLE "clube_waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clube_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clube_waitlist_email_idx" ON "clube_waitlist"("email");
