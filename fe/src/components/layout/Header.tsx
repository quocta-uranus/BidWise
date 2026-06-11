'use client';

import { Search, Bell, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

export default function Header() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-slate-200 bg-[#f4f7fb]">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search projects, clients..."
          className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-transparent rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Right Icons & Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f4f7fb]"></span>
          </button>
          <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Mail className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{getInitials(user.fullName)}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:block">
            {user.fullName}
          </span>
        </div>
      </div>
    </header>
  );
}
