import { PrismaClient } from '@prisma/client';
const RoleType = { ADMIN: 'ADMIN', MODERATOR: 'MODERATOR', CLIENT: 'CLIENT', FREELANCER: 'FREELANCER' } as const;
type RoleType = (typeof RoleType)[keyof typeof RoleType];

const prisma = new PrismaClient();

async function main() {
  // Seed Roles
  const roles = [RoleType.ADMIN, RoleType.MODERATOR, RoleType.CLIENT, RoleType.FREELANCER];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles seeded:', roles);

  // Seed Permissions
  const permissions = [
    { resource: 'users', action: 'read:all' },
    { resource: 'users', action: 'read:own' },
    { resource: 'users', action: 'update:own' },
    { resource: 'users', action: 'suspend' },
    { resource: 'users', action: 'assign-role' },
    { resource: 'jobs', action: 'create' },
    { resource: 'jobs', action: 'read:all' },
    { resource: 'jobs', action: 'update:own' },
    { resource: 'jobs', action: 'delete:any' },
    { resource: 'bids', action: 'create' },
    { resource: 'bids', action: 'read:own' },
    { resource: 'contracts', action: 'create' },
    { resource: 'reports', action: 'resolve' },
    { resource: 'system', action: 'configure' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: p },
      update: {},
      create: p,
    });
  }
  console.log('Permissions seeded:', permissions.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
