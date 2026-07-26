'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useUnreadCount } from '@/hooks/useChat';
import {
  LayoutDashboard, FolderOpen, FileText, User, Settings,
  LogOut, Users, Briefcase, AlertTriangle, Tags,
  DollarSign, GraduationCap, MessageSquare, Shield,
} from 'lucide-react';

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-50/10 text-blue-400 ring-blue-500/20',
  FREELANCER: 'bg-violet-50/10 text-violet-400 ring-violet-500/20',
  ADMIN: 'bg-red-50/10 text-red-400 ring-red-500/20',
  MODERATOR: 'bg-amber-50/10 text-amber-400 ring-amber-500/20',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const { count: unreadCount } = useUnreadCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) router.push('/login');
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950">
        <div className="h-16 flex items-center px-6 border-b border-indigo-950/40 gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl" />
          <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('MODERATOR');
  const isFreelancer = user.roles.includes('FREELANCER');

  const initials = user.fullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase();

  let navItems: NavItem[] = [];
  let portalLabel = 'Client Portal';

  if (isAdmin) {
    portalLabel = 'Admin Panel';
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
    portalLabel = 'Pro Freelancer';
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Tìm việc', href: '/projects', icon: FolderOpen },
      { label: 'Đề xuất của tôi', href: '/proposals', icon: FileText },
      { label: 'Tin nhắn', href: '/messages', icon: MessageSquare, badge: unreadCount },
      { label: 'Hồ sơ', href: '/profile', icon: User },
      { label: 'Cài đặt', href: '/settings', icon: Settings },
    ];
  } else {
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Dự án của tôi', href: '/client/jobs', icon: FolderOpen },
      { label: 'Freelancers', href: '/freelancers', icon: Briefcase },
      { label: 'Tin nhắn', href: '/messages', icon: MessageSquare, badge: unreadCount },
      { label: 'Cài đặt', href: '/settings', icon: Settings },
    ];
  }

  const isActive = (href: string) => {
    const tabParam = href.includes('tab=') ? href.split('tab=')[1] : null;
    if (tabParam) {
      return pathname.startsWith('/admin') && searchParams.get('tab') === tabParam;
    }
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-slate-200 border-r border-indigo-900/30">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-indigo-950/40 gap-3 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          {isAdmin
            ? <Shield className="w-4 h-4 text-white" />
            : <span className="text-white font-black text-base tracking-wider">B</span>
          }
        </div>
        <div>
          <span className="font-extrabold text-white text-lg tracking-tight bg-gradient-to-r from-blue-100 to-indigo-200 bg-clip-text text-transparent">
            BidWise
          </span>
          <p className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase leading-none mt-0.5">
            {portalLabel}
          </p>
        </div>
      </div>

      {/* User mini card */}
      <div className="px-5 py-5 border-b border-indigo-950/40 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 p-0.5 overflow-hidden bg-slate-900 flex-shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-black shadow-inner">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-tight truncate">{user.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ring-1 ring-inset ${roleColors[role] ?? 'bg-slate-800 text-slate-400'}`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-150 border-l-4 ${
                active
                  ? 'border-blue-500 bg-blue-500/10 text-white shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-950/40 bg-slate-950/20 shrink-0">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 text-xs font-bold rounded-xl border-l-4 border-transparent text-slate-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/30 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
