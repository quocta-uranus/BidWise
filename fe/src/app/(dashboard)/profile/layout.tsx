'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  User,
  Briefcase,
  Bookmark,
  Search,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Layout for freelancer-specific pages. Forces the user to have
 * the FREELANCER role, then renders an in-page sub-nav that
 * mirrors the features the freelancer can actually use.
 */
export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard portal="FREELANCER">
      <FreelancerSubNav>{children}</FreelancerSubNav>
    </RoleGuard>
  );
}

function FreelancerSubNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const tabs: { label: string; href: string; icon: any }[] = [
    { label: 'Tổng quan', href: '/profile', icon: LayoutDashboard },
    { label: 'Tìm việc', href: '/projects', icon: Search },
    { label: 'Bid của tôi', href: '/proposals', icon: FileText },
    { label: 'Đã lưu', href: '/profile/saved', icon: Bookmark },
  ];
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => {
          const isActive = pathname === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
