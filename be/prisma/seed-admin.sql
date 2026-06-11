-- Tạo tài khoản admin (chạy sau khi đã seed roles)
-- Mật khẩu: Admin@123

INSERT INTO users (id, email, "passwordHash", "fullName", status, "emailVerifiedAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'admin@bidwise.com',
  '$2b$12$Uq/Jcvh8i6k6Rbi9wBMV4OLxLzr/iWjUrh4TBoJhEVxNYVaSlniwS',
  'Admin BidWise',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@bidwise.com');

-- Gán role ADMIN cho user admin
INSERT INTO user_roles (id, "userId", "roleId")
SELECT gen_random_uuid()::text, u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@bidwise.com' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Gán thêm CLIENT + FREELANCER (để admin có thể test)
INSERT INTO user_roles (id, "userId", "roleId")
SELECT gen_random_uuid()::text, u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@bidwise.com' AND r.name IN ('CLIENT', 'FREELANCER')
ON CONFLICT DO NOTHING;