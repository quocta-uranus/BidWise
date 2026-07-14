'use client';

import { useState } from 'react';
import { useAdminTransactions, useRefundTransaction } from '@/hooks/useAdmin';
import { Loader2, RotateCcw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT: 'text-green-600',
  WITHDRAW: 'text-orange-600',
  EARNED: 'text-blue-600',
  ESCROW: 'text-violet-600',
  REFUND: 'text-red-600',
};

export default function TransactionManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useAdminTransactions({
    page, limit: 15, status: statusFilter || undefined,
  });
  const refund = useRefundTransaction();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý Giao dịch</h2>
          <p className="text-sm text-slate-500">Xem tất cả giao dịch, điều tra lỗi, hoàn tiền thủ công</p>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Tất cả status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Số tiền</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mô tả</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Ngày</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.transactions ?? []).map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{tx.wallet.user.fullName}</p>
                    <p className="text-xs text-slate-400">{tx.wallet.user.email}</p>
                  </td>
                  <td className={`px-4 py-3 font-medium ${TYPE_COLORS[tx.type] ?? ''}`}>{tx.type}</td>
                  <td className="px-4 py-3 font-medium">${tx.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[tx.status] ?? ''}`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(tx.date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    {tx.status === 'SUCCESS' && tx.type !== 'REFUND' && (
                      <button onClick={() => {
                        const reason = prompt('Lý do hoàn tiền:');
                        if (reason !== null) refund.mutate({ transactionId: tx.id, reason });
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Hoàn tiền">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
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
          <span className="px-3 py-1.5 text-sm text-slate-600">Trang {page}</span>
          <button disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Sau</button>
        </div>
      )}
    </div>
  );
}
