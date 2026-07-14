'use client';

import { useEffect, useState } from 'react';
import { Clock, DollarSign, Send } from 'lucide-react';
import { recommendationApi, RecommendedJob } from '@/lib/api/recommendation.api';

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return { label: 'Hết hạn', color: 'text-rose-500' };
  if (d === 0) return { label: 'Hôm nay', color: 'text-rose-500' };
  if (d <= 3) return { label: `${d} ngày`, color: 'text-amber-500' };
  return { label: `${d} ngày`, color: 'text-slate-400' };
}

interface Props {
  onBid?: (job: RecommendedJob) => void;
  limit?: number;
}

export default function RecommendedJobsSection({ onBid, limit = 10 }: Props) {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationApi
      .getRecommendedJobs(limit)
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-2 bg-slate-50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-slate-400 text-sm font-semibold">Chưa có gợi ý phù hợp.</p>
        <p className="text-slate-300 text-xs">Cập nhật hồ sơ để nhận gợi ý tốt hơn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const dl = daysLeft(job.deadline);
        const simPct = Math.round(job.similarity * 100);

        return (
          <div
            key={job.jobId}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Similarity ring */}
              <div className="shrink-0 relative w-11 h-11">
                <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={simPct >= 30 ? '#3b82f6' : '#94a3b8'}
                    strokeWidth="3"
                    strokeDasharray={`${simPct} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">
                  {simPct}%
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h4>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    job.auctionType === 'OPEN_BID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {job.auctionType === 'OPEN_BID' ? 'Open' : 'Sealed'}
                  </span>
                </div>

                {job.category && (
                  <p className="text-[10px] text-blue-600 font-bold mt-0.5">{job.category}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  {job.budget && (
                    <span className="flex items-center gap-0.5 font-bold text-slate-800">
                      <DollarSign size={10} className="text-emerald-500" />
                      ${job.budget.toLocaleString()}
                    </span>
                  )}
                  <span className={`flex items-center gap-0.5 ${dl.color}`}>
                    <Clock size={10} />
                    {dl.label}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Send size={10} />
                    {job.bidCount} bids
                  </span>
                </div>

                {/* Matched vs missing skills */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.matchedSkills.map((s) => (
                    <span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold">
                      ✓ {s}
                    </span>
                  ))}
                  {job.skills
                    .filter((s) => !job.matchedSkills.includes(s))
                    .slice(0, 3)
                    .map((s) => (
                      <span key={s} className="text-[10px] bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                </div>
              </div>

              {/* Bid button */}
              {onBid && (
                <button
                  onClick={() => onBid(job)}
                  className="shrink-0 h-8 px-3 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Send size={11} />
                  Bid
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
