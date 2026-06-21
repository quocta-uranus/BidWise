'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { PlusCircle, FolderOpen, Search, Settings } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ').pop() ?? user?.fullName;

  const quickLinks = [
    { href: '/post-job', label: 'Đăng job mới', desc: 'Tạo yêu cầu đấu thầu', icon: PlusCircle },
    { href: '/my-projects', label: 'Dự án của tôi', desc: 'Theo dõi tiến độ', icon: FolderOpen },
    { href: '/freelancers', label: 'Tìm freelancer', desc: 'Khám phá hồ sơ', icon: Search },
    { href: '/settings', label: 'Cài đặt', desc: 'Tài khoản & bảo mật', icon: Settings },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Client Portal</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Xin chào, {firstName} <span className="inline-block">👋</span></h1>
        <p className="text-slate-500 text-sm mt-2 max-w-xl">
          Chào mừng đến BidWise. Đăng job, nhận đề xuất thầu và quản lý dự án với thuật toán xếp hạng AHP-TOPSIS.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600">{item.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
