-- CreateTable
CREATE TABLE "freelancer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "experience" TEXT,
    "skills" TEXT[],
    "available" BOOLEAN NOT NULL DEFAULT true,
    "bidTokens" INTEGER NOT NULL DEFAULT 10,
    "bidTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "bidPenalties" INTEGER NOT NULL DEFAULT 0,
    "lastBidDate" TEXT,
    "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "assessmentScore" INTEGER,
    "assessmentLevel" TEXT,
    "assessmentCompletedAt" TIMESTAMP(3),
    "cvFileName" TEXT,
    "cvFileUrl" TEXT,
    "cvFileSize" INTEGER,
    "cvUploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelancer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" TEXT NOT NULL,
    "freelancerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "linkType" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "freelancerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "date" TEXT,
    "verifyLink" TEXT,
    "imageUrl" TEXT,
    "imageFileName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "skills" TEXT[];

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "budget" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "days" INTEGER;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "coverLetter" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "fileName" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "matchingScore" INTEGER;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "matchBreakdown" JSONB;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "freelancer_profiles_userId_key" ON "freelancer_profiles"("userId");

-- CreateIndex
CREATE INDEX "freelancer_profiles_userId_idx" ON "freelancer_profiles"("userId");

-- CreateIndex
CREATE INDEX "portfolio_items_freelancerProfileId_idx" ON "portfolio_items"("freelancerProfileId");

-- CreateIndex
CREATE INDEX "certificates_freelancerProfileId_idx" ON "certificates"("freelancerProfileId");

-- AddForeignKey
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
