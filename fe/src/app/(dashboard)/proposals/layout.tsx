'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ProposalsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard portal="FREELANCER">{children}</RoleGuard>;
}
