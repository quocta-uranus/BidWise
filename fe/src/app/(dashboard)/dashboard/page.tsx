'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="bg-[#f4f7fb] min-h-[calc(100vh-5rem)]">

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

        {/* Coming soon */}
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Module sắp ra mắt</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Các tính năng Job, Bidding và AHP-TOPSIS Matching đang được phát triển.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            {['Jobs', 'Bidding', 'Contracts', 'Payments'].map((m) => (
              <div key={m} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                {m}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}