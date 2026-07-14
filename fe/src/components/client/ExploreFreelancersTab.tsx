'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { recommendationApi, BrowseFreelancer } from '@/lib/api/recommendation.api';

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  GOLD:     { label: 'Gold',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  SILVER:   { label: 'Silver',   color: 'bg-slate-200 text-slate-600 border-slate-300' },
  NEW:      { label: 'New',      color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function ExploreFreelancersTab() {
  const { language } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [freelancers, setFreelancers] = useState<BrowseFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recommendationApi.browseFreelancers({
        search: debouncedSearch || undefined,
        skill: selectedSkill || undefined,
        limit: 50,
      });
      setFreelancers(data);
    } catch {
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSkill]);

  useEffect(() => { load(); }, [load]);

  const allSkills = Array.from(new Set(freelancers.flatMap((f) => f.skills))).sort();

  return (
    <div className="space-y-6">
      {/* Search & filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm freelancer theo tên...' : 'Search freelancers by name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
          />
        </div>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-500 w-full md:w-48 font-semibold text-slate-600"
        >
          <option value="">{language === 'vi' ? 'Tất cả kỹ năng' : 'All Skills'}</option>
          {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />
          ))
        ) : freelancers.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            {language === 'vi' ? 'Không tìm thấy hồ sơ freelancer nào.' : 'No freelancer profiles found.'}
          </div>
        ) : (
          freelancers.map((fl) => {
            const tier = fl.reputationTier ?? 'NEW';
            const badge = TIER_BADGE[tier] ?? TIER_BADGE.NEW;
            return (
              <div
                key={fl.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center font-bold text-blue-600 text-lg shrink-0">
                        {fl.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{fl.fullName}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${fl.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {fl.available
                              ? (language === 'vi' ? 'Sẵn sàng' : 'Available')
                              : (language === 'vi' ? 'Đang bận' : 'Busy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {fl.hourlyRate != null && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {language === 'vi' ? 'Giá giờ' : 'Hourly rate'}
                        </span>
                        <span className="font-black text-slate-800 text-sm">${fl.hourlyRate}/hr</span>
                      </div>
                    )}
                  </div>

                  {fl.assessmentLevel && (
                    <div className="flex items-center gap-2 py-1.5 border-y border-slate-50">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Assessment:</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                        🏅 {fl.assessmentScore}/5 ({fl.assessmentLevel})
                      </span>
                    </div>
                  )}

                  {fl.experience && (
                    <p className="text-xs text-slate-600 font-medium leading-snug">{fl.experience}</p>
                  )}

                  {fl.bio && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{fl.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {fl.skills.slice(0, 6).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                    {fl.skills.length > 6 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold">
                        +{fl.skills.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
