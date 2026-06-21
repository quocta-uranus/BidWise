-- FL-07 → FL-18 freelancer discovery + bidding migration
-- Adds: SavedJob, JobView, FreelancerPreference, BidActivity, Notification, CoverLetterDraft
-- Adds: new enums and fields for reputation, AHP not changed
-- Adds: indexes for performance

-- Enums
CREATE TYPE "ReputationTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "JobSortBy" AS ENUM ('NEWEST', 'BUDGET_HIGH', 'BUDGET_LOW', 'DEADLINE_SOON', 'BIDS_COUNT');
CREATE TYPE "NotificationType" AS ENUM ('JOB_MATCH', 'BID_STATUS', 'BID_VIEWED', 'JOB_SAVED', 'SYSTEM');
CREATE TYPE "BidActivityType" AS ENUM ('SUBMITTED', 'EDITED', 'WITHDRAWN', 'VIEWED_BY_CLIENT', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'EXPIRED');

-- Extend FreelancerProfile
ALTER TABLE "freelancer_profiles"
  ADD COLUMN "reputationTier" "ReputationTier" NOT NULL DEFAULT 'BRONZE',
  ADD COLUMN "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "bidsWon" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bidsLost" INTEGER NOT NULL DEFAULT 0;

-- Extend Job
ALTER TABLE "jobs"
  ADD COLUMN "auctionTypeIndex" TEXT,
  ADD COLUMN "deadlineIndex" TIMESTAMP(3);

CREATE INDEX "jobs_auctionType_idx" ON "jobs"("auctionType");
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");
CREATE INDEX "jobs_deadline_idx" ON "jobs"("deadline");

-- Extend Bid
ALTER TABLE "bids"
  ADD COLUMN "matchScore" DOUBLE PRECISION,
  ADD COLUMN "matchBreakdown" JSONB;
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- New tables
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_jobs_freelancerId_jobId_key" ON "saved_jobs"("freelancerId", "jobId");
CREATE INDEX "saved_jobs_freelancerId_idx" ON "saved_jobs"("freelancerId");
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;

CREATE TABLE "job_views" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_views_freelancerId_viewedAt_idx" ON "job_views"("freelancerId", "viewedAt");
CREATE INDEX "job_views_jobId_idx" ON "job_views"("jobId");
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;

CREATE TABLE "freelancer_preferences" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "preferredCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "freelancer_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "freelancer_preferences_freelancerId_key" ON "freelancer_preferences"("freelancerId");
ALTER TABLE "freelancer_preferences" ADD CONSTRAINT "freelancer_preferences_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE "bid_activities" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "type" "BidActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bid_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bid_activities_bidId_idx" ON "bid_activities"("bidId");
CREATE INDEX "bid_activities_freelancerId_idx" ON "bid_activities"("freelancerId");
ALTER TABLE "bid_activities" ADD CONSTRAINT "bid_activities_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE;
ALTER TABLE "bid_activities" ADD CONSTRAINT "bid_activities_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE RESTRICT;

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE "cover_letter_drafts" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "suggestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cover_letter_drafts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cover_letter_drafts_freelancerId_jobId_idx" ON "cover_letter_drafts"("freelancerId", "jobId");
