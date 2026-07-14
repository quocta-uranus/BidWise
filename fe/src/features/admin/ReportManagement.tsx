'use client';

import { useState } from 'react';
import { useAdminReports, useAdminDisputes, useResolveReport } from '@/hooks/useAdmin';
import { AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  DISMISSED: 'bg-slate-50 text-slate-600',
};

export default function ReportManagement() {
  const [tab, setTab] = useState<'reports' | 'disputes'>('reports');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [action, setAction] = useState('NONE');

  const { data: reports, isLoading } = useAdminReports({ page: 1, limit: 20 });
  const { data: disputes, isLoading: disputesLoading } = useAdminDisputes({ page: 1, limit: 20 });
  const resolveReport = useResolveReport();

  const handleResolve = (status: string) => {
    if (!selectedReport) return;
    resolveReport.mutate({
      reportId: selectedReport,
      status,
      resolution: resolution || undefined,
      action: action !== 'NONE' ? action : undefined,
    }, { onSettled: () => { setSelectedReport(null); setResolution(''); setAction('NONE'); } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Xử lý Report & Dispute</h2>
        <p className="text-sm text-slate-500">Hàng đợi xử lý báo cáo và tranh chấp</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setTab('reports')}
          className={`pb-2 text-sm font-medium border-b-2 ${tab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
          Reports ({reports?.total ?? 0})
        </button>
        <button onClick={() => setTab('disputes')}
          className={`pb-2 text-sm font-medium border-b-2 ${tab === 'disputes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
          Disputes ({disputes?.total ?? 0})
        </button>
      </div>

      {tab === 'reports' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (reports?.reports ?? []).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Chưa có report nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Loại</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Người báo cáo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Lý do</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(reports?.reports ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3"><span className="font-medium">{r.targetType}</span></td>
                    <td className="px-4 py-3 text-slate-600">{r.reporter.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'PENDING' || r.status === 'IN_REVIEW' ? (
                        <button onClick={() => setSelectedReport(r.id)}
                          className="text-xs text-blue-600 hover:underline">Xử lý</button>
                      ) : (
                        <span className="text-xs text-slate-400">{r.action ?? '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {disputesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (disputes?.contracts ?? []).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Không có tranh chấp</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Hợp đồng</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Freelancer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(disputes?.contracts as Array<{ id: string; title: string; totalAmount: number; client: { fullName: string }; freelancer: { fullName: string } }> ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-slate-600">{c.client.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.freelancer.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">${c.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Xử lý Report
            </h3>
            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
              placeholder="Ghi chú / quyết định..." rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-3" />
            <select value={action} onChange={(e) => setAction(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm mb-4">
              <option value="NONE">Không hành động</option>
              <option value="BAN_USER">Ban user</option>
              <option value="HIDE_JOB">Ẩn job</option>
              <option value="REFUND">Hoàn tiền</option>
              <option value="RELEASE_FUNDS">Giải phóng escrow</option>
              <option value="WARNING">Cảnh cáo</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Hủy</button>
              <button onClick={() => handleResolve('DISMISSED')} className="px-4 py-2 text-sm bg-slate-600 text-white rounded-xl">Bỏ qua</button>
              <button onClick={() => handleResolve('RESOLVED')} disabled={resolveReport.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
