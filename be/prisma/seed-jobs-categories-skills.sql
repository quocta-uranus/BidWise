-- Seed dữ liệu cho Admin: Quản lý Job & Category & Skill
-- Chạy sau khi đã migrate và có users (npx prisma db seed)
-- Usage: Get-Content prisma/seed-jobs-categories-skills.sql -Raw | docker exec -i bidwise_postgres psql -U bidwise -d bidwise

-- ── Categories (5 danh mục như UI admin) ─────────────────────────────────────
INSERT INTO categories (id, name, description, "isHidden", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Digital Marketing', 'SEO, Facebook Ads, Google Ads', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'Graphic Design', 'Thiết kế banner, logo, poster', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'Mobile Development', 'Phát triển ứng dụng Android/iOS', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'UI/UX Design', 'Thiết kế giao diện, wireframe, prototype', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'Web Development', 'Xây dựng website Frontend & Backend', false, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- ── Skills (5 kỹ năng, gắn category theo tên) ────────────────────────────────
INSERT INTO skills (id, name, "categoryId", description, "isHidden", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, s.name, c.id, s.description, false, NOW(), NOW()
FROM (VALUES
  ('SEO',          'Digital Marketing', 'Tối ưu hóa công cụ tìm kiếm'),
  ('Photoshop',    'Graphic Design',    'Chỉnh sửa ảnh, thiết kế đồ họa'),
  ('React Native', 'Mobile Development', 'Phát triển app đa nền tảng'),
  ('Figma',        'UI/UX Design',      'Thiết kế UI/UX, prototype'),
  ('React',        'Web Development',   'Thư viện JavaScript cho frontend')
) AS s(name, category_name, description)
JOIN categories c ON c.name = s.category_name
ON CONFLICT (name) DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- ── Jobs mẫu cho trang Quản lý Job ───────────────────────────────────────────
INSERT INTO jobs (
  id, "clientId", title, description,
  "budgetFormat", "fixedBudget", budget, "minBudget", "maxBudget",
  deadline, "categoryId", "auctionType", status,
  "isHidden", "hiddenReason", skills, "editDeadlineHours",
  "createdAt", "updatedAt"
)
SELECT
  v.id, client.id, v.title, v.description,
  v."budgetFormat"::"BudgetFormat", v."fixedBudget", v.budget, v."minBudget", v."maxBudget",
  v.deadline, cat.id, v."auctionType"::"AuctionType", v.status::"JobStatus",
  v."isHidden", v."hiddenReason", v.skills, 24,
  NOW(), NOW()
FROM (VALUES
  (
    'job_admin_001',
    'Xây dựng Landing Page Next.js cho dự án SaaS',
    'Cần frontend developer dựng Landing Page chuyên nghiệp bằng Next.js, Tailwind CSS.',
    'FIXED', 1200::float, 1200::float, NULL::float, NULL::float,
    NOW() + INTERVAL '30 days',
    'Web Development', 'SEALED_BID', 'OPEN', false, NULL,
    ARRAY['React', 'Next.js', 'Tailwind CSS']
  ),
  (
    'job_admin_002',
    'Thiết kế UI/UX App Fintech',
    'Tìm designer thiết kế landing page và onboarding flow cho app fintech.',
    'RANGE', NULL::float, 700::float, 500::float, 900::float,
    NOW() + INTERVAL '20 days',
    'UI/UX Design', 'OPEN_BID', 'OPEN', false, NULL,
    ARRAY['Figma', 'UI/UX']
  ),
  (
    'job_admin_003',
    'Phát triển App đặt đồ ăn React Native',
    'Xây dựng app iOS/Android: giỏ hàng, thanh toán VNPAY/MoMo, push notification.',
    'FIXED', 2500::float, 2500::float, NULL::float, NULL::float,
    NOW() + INTERVAL '45 days',
    'Mobile Development', 'SEALED_BID', 'OPEN', false, NULL,
    ARRAY['React Native', 'TypeScript', 'Firebase']
  ),
  (
    'job_admin_004',
    'Thiết kế banner quảng cáo Facebook Ads',
    'Cần designer làm bộ banner quảng cáo cho chiến dịch Facebook Ads.',
    'FIXED', 300::float, 300::float, NULL::float, NULL::float,
    NOW() + INTERVAL '7 days',
    'Graphic Design', 'OPEN_BID', 'OPEN', false, NULL,
    ARRAY['Photoshop', 'Illustrator']
  ),
  (
    'job_admin_005',
    'Tối ưu SEO website thương mại điện tử',
    'Audit SEO, tối ưu on-page, chiến lược từ khóa cho shop online.',
    'RANGE', NULL::float, 800::float, 600::float, 1200::float,
    NOW() + INTERVAL '14 days',
    'Digital Marketing', 'SEALED_BID', 'OPEN', false, NULL,
    ARRAY['SEO', 'Google Ads']
  ),
  (
    'job_admin_006',
    'Job vi phạm chính sách (ẩn)',
    'Job spam/scam mẫu để test chức năng ẩn job trên admin.',
    'FIXED', 50::float, 50::float, NULL::float, NULL::float,
    NOW() + INTERVAL '5 days',
    'Web Development', 'OPEN_BID', 'OPEN', true, 'Spam, nội dung lừa đảo',
    ARRAY[]::text[]
  )
) AS v(id, title, description, "budgetFormat", "fixedBudget", budget, "minBudget", "maxBudget", deadline, category_name, "auctionType", status, "isHidden", "hiddenReason", skills)
JOIN categories cat ON cat.name = v.category_name
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE email IN ('client@bidwise.dev', 'client@bidwise.com') LIMIT 1
) client
WHERE client.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ── AHP Weights ───────────────────────────────────────────────────────────────
INSERT INTO ahp_weights (id, "jobId", "priceWeight", "skillWeight", "experienceWeight", "ratingWeight", "speedWeight", "deadlineWeight", "portfolioWeight", "createdAt", "updatedAt")
SELECT
  'ahp_' || j.id, j.id, 25, 30, 15, 10, 5, 5, 10, NOW(), NOW()
FROM jobs j
WHERE j.id LIKE 'job_admin_%'
  AND NOT EXISTS (SELECT 1 FROM ahp_weights aw WHERE aw."jobId" = j.id);

-- ── Bids mẫu ─────────────────────────────────────────────────────────────────
INSERT INTO bids (id, "jobId", "freelancerId", amount, "deliveryDays", proposal, days, status, "createdAt", "updatedAt")
SELECT
  'bid_' || j.id || '_' || fl.id,
  j.id, fl.id,
  CASE j.id WHEN 'job_admin_001' THEN 1100 WHEN 'job_admin_002' THEN 750 WHEN 'job_admin_003' THEN 2200 ELSE 500 END,
  20, 'Đề xuất mẫu từ freelancer.', 20, 'PENDING'::"BidStatus", NOW(), NOW()
FROM jobs j
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE email IN ('freelancer1@bidwise.dev', 'freelancer@bidwise.com') LIMIT 1
) fl
WHERE j.id IN ('job_admin_001', 'job_admin_002', 'job_admin_003') AND fl.id IS NOT NULL
ON CONFLICT ("jobId", "freelancerId") DO NOTHING;

SELECT
  (SELECT COUNT(*) FROM categories) AS categories,
  (SELECT COUNT(*) FROM skills) AS skills,
  (SELECT COUNT(*) FROM jobs WHERE "deletedAt" IS NULL) AS total_jobs,
  'Seed jobs/categories/skills completed!' AS status;
