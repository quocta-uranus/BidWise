'use client';

import { Contract } from '@/lib/api/contracts.api';
import { FileText, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  ACTIVE: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-700' },
  PAUSED: { label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
  DISPUTED: { label: 'Tranh chấp', color: 'bg-rose-100 text-rose-600' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-500' },
};

interface Props {
  contract: Contract;
  userRole: 'client' | 'freelancer';
  onClick: () => void;
}

export default function ContractCard({ contract, userRole, onClick }: Props) {
  const cfg = CONTRACT_STATUS_CONFIG[contract.status] ?? CONTRACT_STATUS_CONFIG.DRAFT;
  const approvedMilestones = contract.milestones.filter((m) => m.status === 'APPROVED').length;
  const progressPct =
    contract.milestones.length > 0
      ? Math.round((approvedMilestones / contract.milestones.length) * 100)
      : 0;
  const counterpart = userRole === 'client' ? contract.freelancer : contract.client;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-sm transition-all space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={14} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 text-sm truncate">{contract.title}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'client' ? 'Freelancer' : 'Client'}: {counterpart.fullName}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-600">
          <DollarSign size={11} className="text-emerald-500" />
          <span className="font-semibold">${contract.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <CheckCircle size={11} className="text-blue-400" />
          <span>{approvedMilestones}/{contract.milestones.length} done</span>
        </div>
        {contract.milestones.some((m) => m.status === 'SUBMITTED') && (
          <div className="flex items-center gap-1 text-amber-600 font-semibold">
            <AlertTriangle size={11} />
            <span>Chờ duyệt</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      {contract.startDate && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={10} />
          <span>Bắt đầu: {new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
        </div>
      )}
    </button>
  );
}
