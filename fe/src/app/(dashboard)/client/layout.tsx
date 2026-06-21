'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Only accounts with the CLIENT role can enter this subtree.
  // Freelancer accounts get redirected to /dashboard.
  return <RoleGuard portal="CLIENT">{children}</RoleGuard>;
}
