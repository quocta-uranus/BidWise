-- Add SHORTLISTED, EXPIRED to BidStatus enum
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'SHORTLISTED';
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Create ContractStatus enum
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISPUTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create MilestoneStatus enum
DO $$ BEGIN
  CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create ContractActionType enum
DO $$ BEGIN
  CREATE TYPE "ContractActionType" AS ENUM ('CREATED', 'ACTIVATED', 'PAUSED', 'RESUMED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'MILESTONE_APPROVED', 'MILESTONE_REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable contracts
CREATE TABLE IF NOT EXISTS "contracts" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "termsAndConds" TEXT,
    "customTerms" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "disputeReason" TEXT,
    "autoApprovalDays" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable milestones
CREATE TABLE IF NOT EXISTS "milestones" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "maxRevisions" INTEGER NOT NULL DEFAULT 3,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "autoApproveAt" TIMESTAMP(3),
    "clientFeedback" TEXT,
    "freelancerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable milestone_deliverables
CREATE TABLE IF NOT EXISTS "milestone_deliverables" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestone_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable contract_status_logs
CREATE TABLE IF NOT EXISTS "contract_status_logs" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "action" "ContractActionType" NOT NULL,
    "fromStatus" "ContractStatus",
    "toStatus" "ContractStatus" NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_status_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on bidId in contracts
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_bidId_key" ON "contracts"("bidId");

-- Indexes
CREATE INDEX IF NOT EXISTS "contracts_clientId_idx" ON "contracts"("clientId");
CREATE INDEX IF NOT EXISTS "contracts_freelancerId_idx" ON "contracts"("freelancerId");
CREATE INDEX IF NOT EXISTS "contracts_jobId_idx" ON "contracts"("jobId");
CREATE INDEX IF NOT EXISTS "contracts_status_idx" ON "contracts"("status");
CREATE INDEX IF NOT EXISTS "milestones_contractId_idx" ON "milestones"("contractId");
CREATE INDEX IF NOT EXISTS "milestones_status_idx" ON "milestones"("status");
CREATE INDEX IF NOT EXISTS "milestone_deliverables_milestoneId_idx" ON "milestone_deliverables"("milestoneId");
CREATE INDEX IF NOT EXISTS "contract_status_logs_contractId_idx" ON "contract_status_logs"("contractId");

-- Foreign Keys
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "milestone_deliverables" ADD CONSTRAINT "milestone_deliverables_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_status_logs" ADD CONSTRAINT "contract_status_logs_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
