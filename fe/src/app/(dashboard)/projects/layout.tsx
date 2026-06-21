'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard portal="FREELANCER">{children}</RoleGuard>;
}
