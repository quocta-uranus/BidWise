-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('SEALED_BID', 'OPEN_BID');

-- CreateEnum
CREATE TYPE "BudgetFormat" AS ENUM ('FIXED', 'RANGE');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetFormat" "BudgetFormat" NOT NULL,
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "fixedBudget" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "auctionType" "AuctionType" NOT NULL DEFAULT 'SEALED_BID',
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ahp_weights" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "priceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadlineWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "portfolioWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ahp_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_attachments" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "proposal" TEXT NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "jobs_clientId_idx" ON "jobs"("clientId");

-- CreateIndex
CREATE INDEX "jobs_categoryId_idx" ON "jobs"("categoryId");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "job_skills_jobId_idx" ON "job_skills"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ahp_weights_jobId_key" ON "ahp_weights"("jobId");

-- CreateIndex
CREATE INDEX "job_attachments_jobId_idx" ON "job_attachments"("jobId");

-- CreateIndex
CREATE INDEX "bids_jobId_idx" ON "bids"("jobId");

-- CreateIndex
CREATE INDEX "bids_freelancerId_idx" ON "bids"("freelancerId");

-- CreateIndex
CREATE UNIQUE INDEX "bids_jobId_freelancerId_key" ON "bids"("jobId", "freelancerId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_weights" ADD CONSTRAINT "ahp_weights_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_attachments" ADD CONSTRAINT "job_attachments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
