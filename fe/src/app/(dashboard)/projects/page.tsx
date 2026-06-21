'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Bookmark, MapPin, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface JobItem {
  id: string;
  title: string;
  description: string;
  fixedBudget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  budgetFormat: string;
  deadline: string;
  category?: { name: string };
  skills: { name: string }[];
  _count?: { bids: number };
}

export default function ProjectsPage() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('NEWEST');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const limit = 10;

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.get('/jobs', {
        params: { page, limit, sortBy, keyword: keyword || undefined },
      });
      const body = res.data.data ?? res.data;
      setItems(body.data ?? []);
      setTotal(body.pagination?.total ?? 0);
    } catch {
      toast.error('Không tải được danh sách job');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy]);

  async function toggleSave(jobId: string) {
    try {
      await apiClient.post(`/saved-jobs/${jobId}`);
      toast.success('Đã lưu job');
    } catch {
      toast.error('Lưu thất bại');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm"
          placeholder="Tìm theo từ khoá..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              load();
            }
          }}
        />
        <select
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
        >
          <option value="NEWEST">Mới nhất</option>
          <option value="BUDGET_HIGH">Budget cao</option>
          <option value="BUDGET_LOW">Budget thấp</option>
          <option value="DEADLINE_SOON">Deadline gần</option>
          <option value="BIDS_COUNT">Nhiều bid</option>
        </select>
        <button onClick={() => { setPage(1); load(); }} className="h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold">
          Tìm
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-slate-500 text-sm">Không có job nào.</div>
      ) : (
        <div className="space-y-3">
          {items.map((job) => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${job.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(job.skills ?? []).map((s) => (
                      <span key={s.name} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.fixedBudget ?? `${job.minBudget} - ${job.maxBudget}`} USD
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(job.deadline).toLocaleDateString('vi-VN')}
                    </span>
                    <span>{job._count?.bids ?? 0} bids</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSave(job.id)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Lưu job"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
        <span>Tổng {total} job</span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
