'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useUnreadCount } from '@/hooks/useChat';
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
  AlertTriangle,
  Tags,
  DollarSign,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const { count: unreadCount } = useUnreadCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, router]);

  const isAdmin = user?.roles.includes('ADMIN');
  const isFreelancer = user?.roles.includes('FREELANCER');
  const isClient = user?.roles.includes('CLIENT');

  let roleSubtitle = 'User';
  let navItems: { label: string; href: string; icon: any; badge?: number }[] = [];
  let actionButton = null;

  if (isAdmin) {
    roleSubtitle = 'Admin Panel';
    navItems = [
      { label: 'Tổng quan', href: '/admin?tab=dashboard', icon: LayoutDashboard },
      { label: 'Quản lý Users', href: '/admin?tab=users', icon: Users },
      { label: 'Quản lý Jobs', href: '/admin?tab=jobs', icon: Briefcase },
      { label: 'Reports', href: '/admin?tab=reports', icon: AlertTriangle },
      { label: 'Category & Skill', href: '/admin?tab=categories', icon: Tags },
      { label: 'Giao dịch', href: '/admin?tab=transactions', icon: DollarSign },
      { label: 'Cấu hình', href: '/admin?tab=config', icon: Settings },
      { label: 'Assessment', href: '/admin?tab=assessment', icon: GraduationCap },
    ];
  } else if (isFreelancer) {
    roleSubtitle = 'Pro Freelancer';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Projects', href: '/projects', icon: FolderOpen },
      { label: 'Proposals', href: '/proposals', icon: FileText },
      { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadCount },
      { label: 'Profile', href: '/profile', icon: User },
    ];
    actionButton = { label: 'New Bid', icon: Plus };
  } else if (isClient) {
    roleSubtitle = 'Client Portal';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Projects', href: '/client/jobs', icon: FolderOpen },
      { label: 'Freelancers', href: '/freelancers', icon: Briefcase },
      { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadCount },
    ];
  } else {
    roleSubtitle = 'Welcome';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ];
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
    return null; // Will redirect via useEffect
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
          const tabParam = item.href.includes('tab=') ? item.href.split('tab=')[1] : null;
          const isActive = tabParam
            ? pathname.startsWith('/admin') && searchParams.get('tab') === tabParam
            : pathname.startsWith(item.href);
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
              <span className="text-sm flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="p-4 space-y-4">
        {actionButton && (() => {
          const ActionIcon = actionButton.icon;
          return (
            <Link
              href={(actionButton as any).href || '#'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              <ActionIcon className="w-4 h-4" />
              {actionButton.label}
            </Link>
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
