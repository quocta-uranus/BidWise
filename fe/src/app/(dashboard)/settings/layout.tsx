'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
