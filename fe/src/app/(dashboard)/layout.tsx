'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isDashboardPage = pathname === '/dashboard';

  if (isDashboardPage) {
    return <div className="min-h-screen bg-[#f8fafc]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}