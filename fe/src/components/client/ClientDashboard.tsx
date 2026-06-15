'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ').pop() ?? user?.fullName;

  const quickLinks = [
    { href: '/post-job', label: 'Đăng job mới', desc: 'Tạo yêu cầu đấu thầu', icon: '➕' },
    { href: '/my-projects', label: 'Dự án của tôi', desc: 'Theo dõi tiến độ', icon: '📁' },
    { href: '/freelancers', label: 'Tìm freelancer', desc: 'Khám phá hồ sơ', icon: '🔍' },
    { href: '/settings', label: 'Cài đặt', desc: 'Tài khoản & bảo mật', icon: '⚙️' },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Client Portal</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Xin chào, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-xl">
          Chào mừng đến BidWise. Đăng job, nhận đề xuất thầu và quản lý dự án với thuật toán xếp hạng AHP-TOPSIS.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <span className="text-2xl">{item.icon}</span>
            <h3 className="font-bold text-slate-900 mt-3 group-hover:text-blue-600">{item.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
