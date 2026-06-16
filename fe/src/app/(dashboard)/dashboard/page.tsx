'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';

const roleLabels: Record<string, string> = {
  CLIENT: 'Client',
  FREELANCER: 'Freelancer',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
};

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  FREELANCER: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  ADMIN: 'bg-red-50 text-red-700 ring-red-600/20',
  MODERATOR: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const stats = [
    { label: 'Jobs đang mở', value: '—', icon: '📋' },
    { label: 'Bids đã gửi', value: '—', icon: '🎯' },
    { label: 'Contracts active', value: '—', icon: '📄' },
    { label: 'Tổng thu nhập', value: '—', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">BidWise</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.fullName}</p>
                <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
              </div>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-blue-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cài đặt</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Xin chào, {user.fullName.split(' ').pop()} 👋
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-sm">{user.email}</p>
            <span className="text-slate-300">·</span>
            <div className="flex gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${roleColors[role] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}
                >
                  {roleLabels[role] ?? role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-slate-900 mb-0.5">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions / Content */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-10 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transform rotate-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome to your Workspace</h3>
              <p className="text-slate-500 text-base max-w-lg mx-auto md:mx-0 mb-6">
                Manage your projects, find the best freelancers, and grow your business with our AI-powered bidding system.
              </p>
              
              {user.roles.includes('CLIENT') && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Link href="/client/jobs/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Post a New Job
                  </Link>
                  <Link href="/client/jobs" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
                    View My Projects
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}