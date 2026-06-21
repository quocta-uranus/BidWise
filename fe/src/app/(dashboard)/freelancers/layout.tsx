'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function FreelancersLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard portal="CLIENT">{children}</RoleGuard>;
}
