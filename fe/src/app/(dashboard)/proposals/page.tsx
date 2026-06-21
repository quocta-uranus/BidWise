'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/auth.store';
import Link from 'next/link';

interface BidItem {
  id: string;
  amount: number;
  status: string;
  matchScore: number | null;
  createdAt: string;
  job: { id: string; title: string; status: string };
}

export default function ProposalsPage() {
  const [items, setItems] = useState<BidItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('');
  const user = useAuthStore((s) => s.user);

  async function load() {
    try {
      const params: any = { page: 1, limit: 50 };
      if (filter) params.status = filter;
      const [listRes, statsRes] = await Promise.all([
        apiClient.get('/bids/my', { params }),
        apiClient.get('/bids/my/stats'),
      ]);
      const body = listRes.data.data ?? listRes.data;
      setItems(body.data ?? []);
      setStats(statsRes.data.data ?? statsRes.data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Tổng bid" value={stats.totalBids ?? 0} />
          <Card label="Đã thắng" value={stats.wonBids ?? 0} />
          <Card label="Tỷ lệ thắng" value={`${Math.round((stats.winRate ?? 0) * 100)}%`} />
          <Card label="Giá TB" value={`${Math.round(stats.avgBidPrice ?? 0)}`} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-slate-500 text-sm">Chưa có bid nào.</div>
        ) : (
          items.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Link href={`/projects/${b.job.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                  {b.job.title}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {b.amount} USD · {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                  {b.matchScore != null && (
                    <span className="ml-2 text-blue-600 font-semibold">Match {Math.round(b.matchScore * 100)}%</span>
                  )}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  b.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-700'
                    : b.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : b.status === 'WITHDRAWN'
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {b.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
