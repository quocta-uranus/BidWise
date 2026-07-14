'use client';

import { useEffect, useState } from 'react';
import { recommendationApi, RecommendedFreelancer } from '@/lib/api/recommendation.api';

const TIER_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  GOLD:     'bg-amber-100 text-amber-700',
  SILVER:   'bg-slate-200 text-slate-600',
  NEW:      'bg-slate-100 text-slate-500',
};

interface Props {
  jobId: string;
  limit?: number;
}

export default function TopFreelancerSuggestions({ jobId, limit = 5 }: Props) {
  const [freelancers, setFreelancers] = useState<RecommendedFreelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    recommendationApi
      .getRecommendedFreelancers(jobId, limit)
      .then(setFreelancers)
      .catch(() => setFreelancers([]))
      .finally(() => setLoading(false));
  }, [jobId, limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (freelancers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Freelancer phù hợp nhất
        </h4>
        <span className="text-[10px] text-slate-400 font-semibold">AI gợi ý · TF-IDF</span>
      </div>

      {freelancers.map((fl, idx) => {
        const simPct = Math.round(fl.similarity * 100);
        const tier = fl.reputationTier ?? 'NEW';

        return (
          <div
            key={fl.freelancerId}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
          >
            {/* Rank */}
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
              idx === 0 ? 'bg-amber-400 text-white' :
              idx === 1 ? 'bg-slate-300 text-slate-700' :
              idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {idx + 1}
            </div>

            {/* Avatar */}
            <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-100 border border-slate-100 flex items-center justify-center font-bold text-blue-600 text-sm">
              {fl.fullName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 truncate">{fl.fullName}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_BADGE[tier]}`}>
                  {tier}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {fl.matchedSkills.slice(0, 2).map((s) => (
                  <span key={s} className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-semibold">
                    {s}
                  </span>
                ))}
                {fl.hourlyRate && (
                  <span className="text-[9px] text-slate-400 font-bold">${fl.hourlyRate}/hr</span>
                )}
              </div>
            </div>

            {/* Similarity bar */}
            <div className="shrink-0 text-right w-14">
              <span className={`text-xs font-black ${simPct >= 30 ? 'text-blue-700' : 'text-slate-400'}`}>
                {simPct}%
              </span>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${simPct >= 30 ? 'bg-blue-500' : 'bg-slate-300'}`}
                  style={{ width: `${Math.min(simPct * 2, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
