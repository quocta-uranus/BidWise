'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Only ADMIN / MODERATOR accounts can reach this subtree.
  return <RoleGuard portal="ADMIN">{children}</RoleGuard>;
}
