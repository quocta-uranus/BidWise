'use client';

import { useEffect, useState } from 'react';
import { X, Check, Star } from 'lucide-react';
import { clientBidsApi, RankedBid } from '@/lib/api/client-bids.api';
import { toast } from 'sonner';

interface Props {
  jobId: string;
  selectedBids: RankedBid[];
  onClose: () => void;
  onAccept: (bidId: string) => void;
}

export default function BidCompareModal({ jobId, selectedBids, onClose, onAccept }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedBids.length < 2) {
      setData(selectedBids);
      setLoading(false);
      return;
    }
    clientBidsApi.compareBids(jobId, selectedBids.map((b) => b.id))
      .then(setData)
      .catch(() => toast.error('Không thể so sánh bids'))
      .finally(() => setLoading(false));
  }, [jobId, selectedBids]);

  const cols = data.length;

  const rows = [
    { label: 'Freelancer', render: (b: any) => b.freelancer?.fullName ?? '-' },
    { label: 'Giá bid', render: (b: any) => `$${Number(b.amount).toLocaleString()}` },
    { label: 'Thời gian', render: (b: any) => b.days ? `${b.days} ngày` : '-' },
    { label: 'Điểm TOPSIS', render: (b: any) => b.topsisScore != null ? `${(b.topsisScore * 100).toFixed(1)}%` : (b.matchingScore ? `${b.matchingScore}%` : '-') },
    { label: 'Kỹ năng', render: (b: any) => (b.freelancer?.skills ?? []).slice(0, 3).join(', ') || '-' },
    { label: 'Assessment', render: (b: any) => b.freelancer?.assessmentLevel ?? b.freelancer?.assessmentScore ?? '-' },
    { label: 'Portfolio', render: (b: any) => b.freelancer?.portfolioCount != null ? `${b.freelancer.portfolioCount} items` : '-' },
    { label: 'Trạng thái', render: (b: any) => b.status },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900">So sánh Bids ({cols})</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải...</div>
        ) : (
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs text-slate-500 font-medium py-2 pr-4 w-32">Tiêu chí</th>
                  {data.map((b) => (
                    <th key={b.id} className="text-center py-2 px-3 text-slate-900 font-semibold">
                      #{selectedBids.find((s) => s.id === b.id)?.rank ?? '-'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-slate-50">
                    <td className="py-2 pr-4 text-xs text-slate-500 font-medium">{row.label}</td>
                    {data.map((b) => (
                      <td key={b.id} className="py-2 px-3 text-center text-slate-700">
                        {row.render(b)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200">
                  <td className="py-3 pr-4 text-xs text-slate-500 font-medium">Hành động</td>
                  {data.map((b) => (
                    <td key={b.id} className="py-3 px-3 text-center">
                      {b.status === 'PENDING' || b.status === 'SHORTLISTED' ? (
                        <button
                          onClick={() => { onAccept(b.id); onClose(); }}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Check size={12} /> Chấp nhận
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">{b.status}</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
