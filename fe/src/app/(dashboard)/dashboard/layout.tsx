'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
