'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getPrimaryPortal } from '@/lib/auth/role-routing';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Users,
  Briefcase,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, router]);

  // Build nav for the *primary* portal only — never mix two portals.
  // This is the fix for "account A shows the menu of account B".
  let roleSubtitle = 'User';
  let navItems: { label: string; href: string; icon: any }[] = [];
  let actionButton: { label: string; icon: any; href: string } | null = null;

  if (user) {
    const portal = getPrimaryPortal(user);
    if (portal === 'ADMIN') {
      roleSubtitle = 'Admin Panel';
      navItems = [{ label: 'Manage Accounts', href: '/admin', icon: Users }];
    } else if (portal === 'FREELANCER') {
      roleSubtitle = 'Pro Freelancer';
      navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Tìm việc', href: '/projects', icon: FolderOpen },
        { label: 'Bids của tôi', href: '/proposals', icon: FileText },
        { label: 'Hồ sơ', href: '/profile', icon: User },
      ];
      actionButton = { label: 'Tìm job mới', icon: Plus, href: '/projects' };
    } else {
      roleSubtitle = 'Client Portal';
      navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Dự án của tôi', href: '/client/jobs', icon: FolderOpen },
        { label: 'Tìm freelancer', href: '/freelancers', icon: Briefcase },
      ];
      actionButton = { label: 'Đăng job mới', icon: Plus, href: '/client/jobs/create' };
    }
  }

  if (!mounted || isLoading) {
    return (
      <aside className="w-64 bg-[#1e3251] text-white flex flex-col min-h-screen">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">BidWise</h2>
          <p className="text-sm text-blue-200 mt-1 opacity-80">Loading...</p>
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <aside className="w-64 bg-[#1e3251] text-white flex flex-col min-h-screen">
      {/* Brand */}
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight">BidWise</h2>
        <p className="text-sm text-blue-200 mt-1 opacity-80">{roleSubtitle}</p>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="p-4 space-y-4">
        {actionButton && (
          <Link
            href={actionButton.href}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
          >
            <actionButton.icon className="w-4 h-4" />
            {actionButton.label}
          </Link>
        )}

        <div className="space-y-1">
          <Link
            href="/settings"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
