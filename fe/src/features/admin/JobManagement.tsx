'use client';

import { useState } from 'react';
import { useAdminJobs, useHideJob, useUnhideJob, useDeleteJob } from '@/hooks/useAdmin';
import { EyeOff, Eye, Trash2, Search, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  DRAFT: 'bg-slate-50 text-slate-600',
  CLOSED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-violet-50 text-violet-700',
  DISPUTED: 'bg-red-50 text-red-700',
};

export default function JobManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hideJobId, setHideJobId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState('');

  const { data, isLoading } = useAdminJobs({ page, limit: 15, search: search || undefined });
  const hideJob = useHideJob();
  const unhideJob = useUnhideJob();
  const deleteJob = useDeleteJob();

  const handleHide = () => {
    if (!hideJobId || !hideReason.trim()) return;
    hideJob.mutate({ jobId: hideJobId, reason: hideReason }, {
      onSettled: () => { setHideJobId(null); setHideReason(''); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý Job</h2>
          <p className="text-sm text-slate-500">Xem, ẩn hoặc xóa job vi phạm chính sách</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm job..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Job</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Bids</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.jobs ?? []).map((job) => (
                <tr key={job.id} className={job.isHidden ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    {job.isHidden && <p className="text-xs text-red-500">Ẩn: {job.hiddenReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job.client.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{job.category.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-slate-100'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{job._count.bids}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {job.isHidden ? (
                        <button onClick={() => unhideJob.mutate(job.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Hiện job">
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => setHideJobId(job.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Ẩn job">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Xóa job này?')) deleteJob.mutate(job.id); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Trước</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Trang {page} / {Math.ceil(data.total / data.limit)}</span>
          <button disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Sau</button>
        </div>
      )}

      {hideJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-3">Ẩn Job</h3>
            <textarea value={hideReason} onChange={(e) => setHideReason(e.target.value)}
              placeholder="Lý do ẩn job (spam, scam, fake...)"
              rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setHideJobId(null); setHideReason(''); }}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">Hủy</button>
              <button onClick={handleHide} disabled={!hideReason.trim() || hideJob.isPending}
                className="px-4 py-2 text-sm text-white bg-amber-600 rounded-xl disabled:opacity-50">Ẩn Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
