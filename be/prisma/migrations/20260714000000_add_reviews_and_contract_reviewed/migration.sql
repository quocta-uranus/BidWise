-- Add clientReviewed and freelancerReviewed columns to contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "clientReviewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "freelancerReviewed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "qualityRating" DOUBLE PRECISION NOT NULL,
    "commRating" DOUBLE PRECISION NOT NULL,
    "speedRating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_contractId_idx" ON "reviews"("contractId");
CREATE INDEX IF NOT EXISTS "reviews_reviewerId_idx" ON "reviews"("reviewerId");
CREATE INDEX IF NOT EXISTS "reviews_revieweeId_idx" ON "reviews"("revieweeId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
