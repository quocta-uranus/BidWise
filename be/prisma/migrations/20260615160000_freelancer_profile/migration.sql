-- Freelancer profile module (FL-01 to FL-06)

CREATE TABLE IF NOT EXISTS "freelancer_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "experience" TEXT,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
  "assessmentScore" INTEGER,
  "assessmentLevel" TEXT,
  "assessmentCompletedAt" TIMESTAMP(3),
  "cvFileName" TEXT,
  "cvFileUrl" TEXT,
  "cvFileSize" TEXT,
  "cvUploadedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "freelancer_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_profiles_userId_key" ON "freelancer_profiles"("userId");
ALTER TABLE "freelancer_profiles" DROP CONSTRAINT IF EXISTS "freelancer_profiles_userId_fkey";
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "portfolio_items" (
  "id" TEXT NOT NULL,
  "freelancerProfileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "desc" TEXT NOT NULL DEFAULT '',
  "link" TEXT NOT NULL DEFAULT '',
  "linkType" TEXT,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "fileSize" TEXT,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "portfolio_items" DROP CONSTRAINT IF EXISTS "portfolio_items_freelancerProfileId_fkey";
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_freelancerProfileId_fkey"
  FOREIGN KEY ("freelancerProfileId") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "certificates" (
  "id" TEXT NOT NULL,
  "freelancerProfileId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "verifyLink" TEXT NOT NULL,
  "imageUrl" TEXT,
  "imageFileName" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "certificates" DROP CONSTRAINT IF EXISTS "certificates_freelancerProfileId_fkey";
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_freelancerProfileId_fkey"
  FOREIGN KEY ("freelancerProfileId") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
