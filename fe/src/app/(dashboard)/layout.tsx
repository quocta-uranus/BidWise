'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isDashboardPage = pathname === '/dashboard';

  // Admin uses a completely separate layout, so this guard is
  // the single auth-checkpoint for /dashboard, /profile, /client/*,
  // /freelancer/*, /projects, /proposals, /freelancers, /settings.
  return (
    <RoleGuard>
      {isDashboardPage ? (
        <div className="min-h-screen bg-[#f8fafc]">{children}</div>
      ) : (
        <div className="flex min-h-screen bg-[#f4f7fb]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
