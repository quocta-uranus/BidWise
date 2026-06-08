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

SELECT 'Seed completed!' as status;
