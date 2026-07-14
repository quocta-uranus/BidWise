'use client';

import { useAdminStats } from '@/hooks/useAdmin';
import {
  Users, Briefcase, Gavel, FileText, DollarSign, AlertTriangle,
  TrendingUp, CheckCircle, BarChart3, Loader2,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard Tổng Quan</h2>
        <p className="text-sm text-slate-500">Thống kê realtime của nền tảng</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng Users" value={stats.users.total} sub={`${stats.users.active} active · ${stats.users.suspended} suspended`}
          icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Tổng Jobs" value={stats.jobs.total} sub={`${stats.jobs.open} đang mở · ${stats.jobs.hidden} đã ẩn`}
          icon={Briefcase} color="bg-violet-50 text-violet-600" />
        <StatCard label="Tổng Bids" value={stats.bids.total}
          icon={Gavel} color="bg-amber-50 text-amber-600" />
        <StatCard label="Hợp đồng" value={stats.contracts.total} sub={`${stats.contracts.active} active`}
          icon={FileText} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doanh thu" value={`$${stats.revenue.total.toLocaleString()}`}
          icon={DollarSign} color="bg-green-50 text-green-600" />
        <StatCard label="Tỷ lệ hoàn thành" value={`${stats.contracts.completionRate}%`}
          sub={`${stats.contracts.completed} hợp đồng hoàn thành`}
          icon={CheckCircle} color="bg-teal-50 text-teal-600" />
        <StatCard label="Tỷ lệ tranh chấp" value={`${stats.contracts.disputeRate}%`}
          sub={`${stats.contracts.disputed} đang tranh chấp`}
          icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="Reports chờ xử lý" value={stats.reports.pending}
          icon={TrendingUp} color="bg-orange-50 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Giao dịch" value={stats.transactions.total}
          sub={`${stats.transactions.failed} thất bại`}
          icon={BarChart3} color="bg-slate-50 text-slate-600" />
        <StatCard label="Assessment hoàn thành" value={stats.assessment.completedCount}
          sub={`Điểm TB: ${stats.assessment.averageScore}`}
          icon={BarChart3} color="bg-indigo-50 text-indigo-600" />
      </div>
    </div>
  );
}
