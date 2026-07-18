CREATE TYPE "ReportCategory" AS ENUM ('SCAM', 'QUALITY_DISPUTE', 'PAYMENT', 'INAPPROPRIATE_CONTENT');
CREATE TYPE "DisputeStatus" AS ENUM ('EVIDENCE_COLLECTION', 'UNDER_REVIEW', 'RESOLVED');
CREATE TYPE "DisputeDecision" AS ENUM ('REFUND', 'RELEASE_FUNDS');

ALTER TABLE "users" ADD COLUMN "autoFlaggedAt" TIMESTAMP(3), ADD COLUMN "autoFlagReason" TEXT;
ALTER TABLE "reports" ADD COLUMN "category" "ReportCategory" NOT NULL DEFAULT 'INAPPROPRIATE_CONTENT', ADD COLUMN "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "disputes" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "openedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'EVIDENCE_COLLECTION',
  "reviewDeadline" TIMESTAMP(3) NOT NULL,
  "decision" "DisputeDecision",
  "resolution" TEXT,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "dispute_evidence" (
  "id" TEXT NOT NULL,
  "disputeId" TEXT NOT NULL,
  "submittedBy" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "fileUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "disputes_contractId_key" ON "disputes"("contractId");
CREATE INDEX "disputes_status_reviewDeadline_idx" ON "disputes"("status", "reviewDeadline");
CREATE INDEX "dispute_evidence_disputeId_submittedBy_idx" ON "dispute_evidence"("disputeId", "submittedBy");
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
