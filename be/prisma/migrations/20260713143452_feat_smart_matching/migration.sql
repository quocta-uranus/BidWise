-- DropIndex
DROP INDEX "transactions_walletId_idx";

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "isTemplateBid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spamScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "freelancer_profiles" ADD COLUMN     "reputationTier" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "skillVector" JSONB;

-- CreateTable
CREATE TABLE "skill_cluster_reputations" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "skillCluster" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_cluster_reputations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_cluster_reputations_freelancerId_idx" ON "skill_cluster_reputations"("freelancerId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_cluster_reputations_freelancerId_skillCluster_key" ON "skill_cluster_reputations"("freelancerId", "skillCluster");

-- AddForeignKey
ALTER TABLE "skill_cluster_reputations" ADD CONSTRAINT "skill_cluster_reputations_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
