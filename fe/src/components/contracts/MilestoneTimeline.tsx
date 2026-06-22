'use client';

import { Check, Clock, Upload, AlertCircle, RotateCcw, Circle, DollarSign, CalendarDays } from 'lucide-react';
import { Milestone } from '@/lib/api/contracts.api';

function DeadlineCountdown({ deadline, status }: { deadline: string; status: string }) {
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (status === 'APPROVED') return null;

  if (diffDays < 0) {
    return <span className="text-xs text-rose-500 font-semibold flex items-center gap-1"><CalendarDays size={11} />Trễ {Math.abs(diffDays)} ngày</span>;
  }
  if (diffDays === 0) {
    return <span className="text-xs text-rose-500 font-semibold flex items-center gap-1"><CalendarDays size={11} />Hôm nay!</span>;
  }
  if (diffDays <= 3) {
    return <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><CalendarDays size={11} />Còn {diffDays} ngày</span>;
  }
  return <span className="text-xs text-slate-400 flex items-center gap-1"><CalendarDays size={11} />Còn {diffDays} ngày</span>;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  NOT_STARTED: { label: 'Chưa bắt đầu', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-100' },
  IN_PROGRESS: { label: 'Đang làm', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  SUBMITTED: { label: 'Chờ nghiệm thu', icon: Upload, color: 'text-amber-500', bg: 'bg-amber-100' },
  APPROVED: { label: 'Đã duyệt', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  REJECTED: { label: 'Từ chối', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100' },
  REVISION_REQUESTED: { label: 'Yêu cầu sửa', icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-100' },
};

interface Props {
  milestones: Milestone[];
  totalAmount: number;
  userRole: 'client' | 'freelancer';
  onAction?: (milestoneId: string, action: string) => void;
  actionLoading?: string | null;
}

export default function MilestoneTimeline({ milestones, totalAmount, userRole, onAction, actionLoading }: Props) {
  const approvedCount = milestones.filter((m) => m.status === 'APPROVED').length;
  const progressPct = milestones.length > 0 ? Math.round((approvedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">Tiến độ tổng thể</span>
          <span className="font-bold text-slate-700">{progressPct}% ({approvedCount}/{milestones.length})</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {milestones.map((m, idx) => {
          const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.NOT_STARTED;
          const Icon = cfg.icon;
          const isLoading = actionLoading === m.id;
          const deadlineDate = new Date(m.deadline);
          const isOverdue = deadlineDate < new Date() && m.status !== 'APPROVED';

          return (
            <div
              key={m.id}
              className={`border rounded-xl overflow-hidden ${
                m.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : m.status === 'SUBMITTED'
                  ? 'border-amber-200 bg-amber-50/30'
                  : isOverdue
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}
                  >
                    <Icon size={14} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {idx + 1}. {m.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {isOverdue && m.status !== 'APPROVED' && (
                        <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                          Trễ hạn
                        </span>
                      )}
                    </div>

                    {m.description && (
                      <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {/* Payment amount (FL-23) */}
                      <span className={`flex items-center gap-1 text-xs font-bold ${m.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        <DollarSign size={11} className={m.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-400'} />
                        ${m.amount.toLocaleString()} ({m.percentage}%)
                        {m.status === 'APPROVED' && <span className="text-emerald-500 font-semibold ml-0.5">✓ Đã giải ngân</span>}
                      </span>
                      {/* Deadline countdown (FL-23) */}
                      <DeadlineCountdown deadline={m.deadline} status={m.status} />
                      {/* Revision count */}
                      {m.revisionCount > 0 && (
                        <span className="text-xs text-orange-500">Revision: {m.revisionCount}/{m.maxRevisions}</span>
                      )}
                      {/* Auto-approve timer */}
                      {m.status === 'SUBMITTED' && m.autoApproveAt && (
                        <span className="text-xs text-blue-500">
                          Auto-approve: {new Date(m.autoApproveAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    {/* Feedback / notes */}
                    {m.clientFeedback && (
                      <div className="mt-2 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Client feedback: </span>
                        {m.clientFeedback}
                      </div>
                    )}
                    {m.freelancerNotes && (
                      <div className="mt-2 bg-blue-50 rounded-lg p-2.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Ghi chú: </span>
                        {m.freelancerNotes}
                      </div>
                    )}

                    {/* Deliverables */}
                    {m.deliverables && m.deliverables.length > 0 && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {m.deliverables.map((d) => (
                          <a
                            key={d.id}
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                          >
                            <Upload size={10} /> {d.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {onAction && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap justify-end">
                    {userRole === 'freelancer' && ['NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'REVISION_REQUESTED'].includes(m.status) && (
                      <button
                        onClick={() => onAction(m.id, 'submit')}
                        disabled={isLoading}
                        className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                      >
                        {isLoading ? '...' : 'Nộp nghiệm thu'}
                      </button>
                    )}
                    {userRole === 'client' && m.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => onAction(m.id, 'approve')}
                          disabled={isLoading}
                          className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isLoading ? '...' : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => onAction(m.id, 'revision')}
                          disabled={isLoading}
                          className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                          {isLoading ? '...' : 'Yêu cầu sửa'}
                        </button>
                        <button
                          onClick={() => onAction(m.id, 'reject')}
                          disabled={isLoading}
                          className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg hover:bg-rose-600 disabled:opacity-50"
                        >
                          {isLoading ? '...' : 'Từ chối'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
