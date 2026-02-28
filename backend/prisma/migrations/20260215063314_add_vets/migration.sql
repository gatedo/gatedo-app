-- CreateTable
CREATE TABLE "VetPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetPartner_pkey" PRIMARY KEY ("id")
);
