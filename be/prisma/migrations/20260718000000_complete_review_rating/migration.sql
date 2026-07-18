ALTER TABLE "reviews"
ADD COLUMN "fourthRating" DOUBLE PRECISION,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hiddenReason" TEXT,
ADD COLUMN "response" TEXT,
ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "reviews_contractId_reviewerId_key"
ON "reviews"("contractId", "reviewerId");

CREATE INDEX "reviews_revieweeId_publishedAt_isHidden_idx"
ON "reviews"("revieweeId", "publishedAt", "isHidden");
