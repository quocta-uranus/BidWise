'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
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
  Briefcase
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.roles.includes('ADMIN');
  const isFreelancer = user?.roles.includes('FREELANCER');
  const isClient = user?.roles.includes('CLIENT');

  let roleSubtitle = 'User';
  let navItems: { label: string; href: string; icon: any }[] = [];
  let actionButton = null;

  if (isAdmin) {
    roleSubtitle = 'Admin Panel';
    navItems = [
      { label: 'Manage Accounts', href: '/admin', icon: Users },
    ];
  } else if (isFreelancer) {
    roleSubtitle = 'Pro Freelancer';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Projects', href: '/projects', icon: FolderOpen },
      { label: 'Proposals', href: '/proposals', icon: FileText },
      { label: 'Profile', href: '/profile', icon: User },
    ];
    actionButton = { label: 'New Bid', icon: Plus };
  } else if (isClient) {
    roleSubtitle = 'Client Portal';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Post a Job', href: '/post-job', icon: Plus },
      { label: 'My Projects', href: '/my-projects', icon: FolderOpen },
      { label: 'Freelancers', href: '/freelancers', icon: Briefcase },
    ];
    actionButton = { label: 'Post Job', icon: Plus };
  } else {
    roleSubtitle = 'Welcome';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ];
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
          const isActive = pathname.startsWith(item.href);
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
        {actionButton && (() => {
          const ActionIcon = actionButton.icon;
          return (
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              <ActionIcon className="w-4 h-4" />
              {actionButton.label}
            </button>
          );
        })()}

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Help</span>
          </button>
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
