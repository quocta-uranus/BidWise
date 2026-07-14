-- PostgreSQL treats NULL values as distinct in a compound unique constraint.
-- A deterministic non-null key prevents duplicate direct conversations.
ALTER TABLE "conversations" ADD COLUMN "scopeKey" TEXT;

WITH ranked_conversations AS (
  SELECT
    "id",
    "clientId" || ':' || "freelancerId" || ':' || COALESCE("jobId", 'direct') AS base_key,
    ROW_NUMBER() OVER (
      PARTITION BY "clientId", "freelancerId", "jobId"
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM "conversations"
)
UPDATE "conversations" AS conversation
SET "scopeKey" = ranked.base_key ||
  CASE WHEN ranked.row_number = 1 THEN '' ELSE ':legacy:' || ranked.id END
FROM ranked_conversations AS ranked
WHERE conversation."id" = ranked."id";

ALTER TABLE "conversations" ALTER COLUMN "scopeKey" SET NOT NULL;
CREATE UNIQUE INDEX "conversations_scopeKey_key" ON "conversations"("scopeKey");
