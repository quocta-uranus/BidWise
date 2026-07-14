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

  const downloadInvoice = (m: Milestone, idx: number) => {
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hóa đơn thanh toán - BidWise</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background-color: #f8fafc; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); font-size: 14px; line-height: 24px; color: #475569; }
    .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
    .invoice-box table td { padding: 5px; vertical-align: top; }
    .invoice-box table tr td:nth-child(2) { text-align: right; }
    .invoice-box table tr.top table td { padding-bottom: 20px; }
    .invoice-box table tr.top table td.title { font-size: 32px; line-height: 32px; color: #2563eb; font-weight: 850; }
    .invoice-box table tr.information table td { padding-bottom: 40px; }
    .invoice-box table tr.heading td { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; padding: 8px; color: #1e293b; }
    .invoice-box table tr.details td { padding-bottom: 20px; }
    .invoice-box table tr.item td { border-bottom: 1px solid #f1f5f9; padding: 10px 8px; }
    .invoice-box table tr.item.last td { border-bottom: none; }
    .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #e2e8f0; font-weight: 800; font-size: 18px; color: #059669; padding-top: 15px; }
    .print-btn { display: block; max-width: 800px; margin: 0 auto 20px auto; padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; text-align: center; }
    .print-btn:hover { background-color: #1d4ed8; }
    @media print { .print-btn { display: none; } body { padding: 0; background-color: white; } .invoice-box { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">In Hóa Đơn (Lưu dưới dạng PDF)</button>
  <div class="invoice-box">
    <table cellpadding="0" cellspacing="0">
      <tr class="top">
        <td colspan="2">
          <table>
            <tr>
              <td class="title">
                <span>BidWise Escrow</span>
              </td>
              <td>
                Mã hóa đơn #: INV-${m.id.substring(0, 8).toUpperCase()}<br>
                Ngày thanh toán: ${m.approvedAt ? new Date(m.approvedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}<br>
                Trạng thái: <strong>ĐÃ THANH TOÁN</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr class="information">
        <td colspan="2">
          <table>
            <tr>
              <td>
                <strong>Đơn vị vận hành:</strong><br>
                Nền tảng BidWise Escrow Freelancing<br>
                Hà Nội, Việt Nam<br>
                support@bidwise.vn
              </td>
              <td>
                <strong>Hạng mục nghiệm thu:</strong><br>
                Cột mốc #${idx + 1}: ${m.title}<br>
                Hợp đồng ID: ${m.contractId.substring(0, 8).toUpperCase()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr class="heading">
        <td>Phương thức thanh toán</td>
        <td>Số tiền</td>
      </tr>
      <tr class="details">
        <td>Giải ngân qua Escrow (Số dư ví hệ thống)</td>
        <td>$${m.amount.toLocaleString()} USD</td>
      </tr>
      <tr class="heading">
        <td>Chi tiết hạng mục công việc</td>
        <td>Thành tiền</td>
      </tr>
      <tr class="item last">
        <td>
          <strong>Cột mốc #${idx + 1}:</strong> ${m.title}<br>
          <span style="font-size: 12px; color: #64748b;">${m.description || 'Nghiệm thu cột mốc hoàn thành'}</span>
        </td>
        <td>$${m.amount.toLocaleString()} USD</td>
      </tr>
      <tr class="total">
        <td></td>
        <td>Tổng cộng: $${m.amount.toLocaleString()} USD</td>
      </tr>
    </table>
  </div>
</body>
</html>
    `;
    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_Milestone_${m.id.substring(0, 8).toUpperCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                      {/* Invoice PDF download */}
                      {m.status === 'APPROVED' && (
                        <button
                          onClick={() => downloadInvoice(m, idx)}
                          className="text-[10px] text-blue-650 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-100 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Tải hóa đơn
                        </button>
                      )}
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
