-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('JOB', 'USER', 'CONTRACT', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportAction" AS ENUM ('NONE', 'BAN_USER', 'REFUND', 'RELEASE_FUNDS', 'HIDE_JOB', 'WARNING');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "jobs" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "jobs" ADD COLUMN "hiddenReason" TEXT;

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "action" "ReportAction",
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "skillId" TEXT,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mcq',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "reports_targetType_targetId_idx" ON "reports"("targetType", "targetId");
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");
CREATE INDEX "assessment_questions_skillId_idx" ON "assessment_questions"("skillId");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default system configs
INSERT INTO "system_configs" ("id", "key", "value", "label", "updatedAt", "createdAt") VALUES
  ('cfg_platform_fee', 'platform_fee_percent', '10', 'Phí nền tảng (%)', NOW(), NOW()),
  ('cfg_bid_token', 'bid_token_limit', '10', 'Giới hạn bid token', NOW(), NOW()),
  ('cfg_min_withdraw', 'min_withdrawal_amount', '50', 'Số tiền rút tối thiểu ($)', NOW(), NOW()),
  ('cfg_auto_approve', 'auto_approve_days', '5', 'Thời gian auto-approve (ngày)', NOW(), NOW()),
  ('cfg_anti_spam', 'anti_spam_similarity_threshold', '0.85', 'Ngưỡng chống spam (0-1)', NOW(), NOW());

-- Seed default assessment questions
INSERT INTO "assessment_questions" ("id", "question", "options", "correctIndex", "type", "order", "updatedAt") VALUES
  ('q1', 'Which React Hook memoizes computed values to optimize performance?', ARRAY['useEffect', 'useCallback', 'useMemo', 'useRef'], 2, 'mcq', 1, NOW()),
  ('q2', 'What is the main difference between "==" and "===" in JavaScript?', ARRAY['"==" compares types, "===" compares values only', '"===" compares both type and value, "==" coerces types before comparing', 'There is no difference', '"==" is for strings, "===" is for numbers'], 1, 'mcq', 2, NOW()),
  ('q3', 'What is the result of `typeof null`?', ARRAY['"null"', '"undefined"', '"object"', '"function"'], 2, 'mcq', 3, NOW()),
  ('q4', 'How do you pass data from a child component to a parent in React?', ARRAY['Redux is required', 'Pass a callback from parent to child as a prop, then invoke it from the child', 'Use localStorage', 'React does not support upward data flow'], 1, 'mcq', 4, NOW()),
  ('q5', 'What mechanism do async/await in JavaScript build upon?', ARRAY['Call stack', 'Promises', 'Generators & Promises', 'Multithreading'], 2, 'mcq', 5, NOW()),
  ('q6', 'What is the output of `[1, 2, 3].map((x) => x * 2).join("-")`?', ARRAY['"1-2-3"', '"2-4-6"', '"6"', '"123"'], 1, 'coding', 6, NOW());
