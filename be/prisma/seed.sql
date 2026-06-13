-- Seed Roles
INSERT INTO roles (id, name, "createdAt")
VALUES
  ('role_admin',       'ADMIN',       NOW()),
  ('role_moderator',   'MODERATOR',   NOW()),
  ('role_client',      'CLIENT',      NOW()),
  ('role_freelancer',  'FREELANCER',  NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO permissions (id, resource, action)
VALUES
  (gen_random_uuid()::text, 'users',     'read:all'),
  (gen_random_uuid()::text, 'users',     'read:own'),
  (gen_random_uuid()::text, 'users',     'update:own'),
  (gen_random_uuid()::text, 'users',     'suspend'),
  (gen_random_uuid()::text, 'users',     'assign-role'),
  (gen_random_uuid()::text, 'jobs',      'create'),
  (gen_random_uuid()::text, 'jobs',      'read:all'),
  (gen_random_uuid()::text, 'jobs',      'update:own'),
  (gen_random_uuid()::text, 'jobs',      'delete:any'),
  (gen_random_uuid()::text, 'bids',      'create'),
  (gen_random_uuid()::text, 'bids',      'read:own'),
  (gen_random_uuid()::text, 'contracts', 'create'),
  (gen_random_uuid()::text, 'reports',   'resolve'),
  (gen_random_uuid()::text, 'system',    'configure')
ON CONFLICT (resource, action) DO NOTHING;

-- Seed Default Users
INSERT INTO users (id, email, "passwordHash", "fullName", status, "emailVerifiedAt", "createdAt", "updatedAt")
VALUES
  ('usr_admin', 'admin@bidwise.com', '$2b$12$zCRIt1dC7RDX/OHzn3akEuNRMqsphf3o93ohveV8hnT/AWHjYhwAe', 'System Admin', 'ACTIVE', NOW(), NOW(), NOW()),
  ('usr_client', 'client@bidwise.com', '$2b$12$zCRIt1dC7RDX/OHzn3akEuNRMqsphf3o93ohveV8hnT/AWHjYhwAe', 'Default Client', 'ACTIVE', NOW(), NOW(), NOW()),
  ('usr_freelancer', 'freelancer@bidwise.com', '$2b$12$zCRIt1dC7RDX/OHzn3akEuNRMqsphf3o93ohveV8hnT/AWHjYhwAe', 'Default Freelancer', 'ACTIVE', NOW(), NOW(), NOW()),
  ('usr_taquoc', 'taquoc196@gmail.com', '$2b$12$zCRIt1dC7RDX/OHzn3akEuNRMqsphf3o93ohveV8hnT/AWHjYhwAe', 'Tạ Quốc', 'ACTIVE', NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Seed User Roles
INSERT INTO user_roles (id, "userId", "roleId", "assignedAt")
VALUES
  ('ur_admin', 'usr_admin', 'role_admin', NOW()),
  ('ur_client', 'usr_client', 'role_client', NOW()),
  ('ur_freelancer', 'usr_freelancer', 'role_freelancer', NOW()),
  ('ur_taquoc', 'usr_taquoc', 'role_admin', NOW())
ON CONFLICT ("userId", "roleId") DO NOTHING;

SELECT 'Seed completed!' as status;
