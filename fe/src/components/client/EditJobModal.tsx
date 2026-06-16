'use client';

import { useState, useEffect } from 'react';
import { jobsApi } from '@/lib/api/jobs.api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Props {
  jobId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const AHP_CRITERIA = [
  { key: 'priceWeight',      label: { vi: 'Giá thầu',    en: 'Price' },       default: 40 },
  { key: 'skillWeight',      label: { vi: 'Kỹ năng',     en: 'Skills' },      default: 20 },
  { key: 'experienceWeight', label: { vi: 'Kinh nghiệm', en: 'Experience' },  default: 10 },
  { key: 'ratingWeight',     label: { vi: 'Đánh giá',    en: 'Rating' },      default: 10 },
  { key: 'speedWeight',      label: { vi: 'Tốc độ',      en: 'Speed' },       default: 10 },
  { key: 'deadlineWeight',   label: { vi: 'Đúng hạn',    en: 'On-time' },     default: 5  },
  { key: 'portfolioWeight',  label: { vi: 'Portfolio',   en: 'Portfolio' },   default: 5  },
];

export default function EditJobModal({ jobId, onClose, onSuccess }: Props) {
  const { language } = useTranslation();

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasBids, setHasBids] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetFormat: 'FIXED',
    minBudget: '',
    maxBudget: '',
    fixedBudget: '',
    deadline: '',
    auctionType: 'SEALED_BID',
    skills: '',
  });

  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(AHP_CRITERIA.map((c) => [c.key, c.default]))
  );

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const job = await jobsApi.findOne(jobId);
        const bidsCount = job._count?.bids || 0;
        setHasBids(bidsCount > 0);

        setFormData({
          title: job.title || '',
          description: job.description || '',
          budgetFormat: job.budgetFormat || 'FIXED',
          minBudget: job.minBudget ?? '',
          maxBudget: job.maxBudget ?? '',
          fixedBudget: job.fixedBudget ?? '',
          deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : '',
          auctionType: job.auctionType || 'SEALED_BID',
          skills: job.skills?.map((s: any) => s.name).join(', ') || '',
        });

        if (job.ahpWeight) {
          const { id, jobId: _jid, createdAt, updatedAt, ...w } = job.ahpWeight;
          setWeights(w as any);
        }
      } catch {
        toast.error('Failed to load job');
        onClose();
      } finally {
        setFetching(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (hasBids && !['title', 'description'].includes(e.target.name)) return;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBids && !isWeightValid) {
      toast.error(`AHP weights must sum to 100%. Current: ${totalWeight}%`);
      return;
    }
    setLoading(true);
    try {
      let payload: any = { title: formData.title, description: formData.description };
      if (!hasBids) {
        payload = {
          ...payload,
          budgetFormat: formData.budgetFormat,
          fixedBudget: formData.fixedBudget ? parseFloat(String(formData.fixedBudget)) : undefined,
          minBudget:   formData.minBudget   ? parseFloat(String(formData.minBudget))   : undefined,
          maxBudget:   formData.maxBudget   ? parseFloat(String(formData.maxBudget))   : undefined,
          deadline:    formData.deadline    ? new Date(formData.deadline).toISOString() : undefined,
          auctionType: formData.auctionType,
          skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
          ahpWeight: weights,
        };
      }
      await jobsApi.update(jobId, payload);
      toast.success('Job updated successfully');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    { num: 1, label: language === 'vi' ? 'Thông tin' : 'Details' },
    { num: 2, label: language === 'vi' ? 'Ngân sách' : 'Budget' },
    { num: 3, label: 'AHP' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-700 to-slate-900 rounded-t-2xl">
          <div>
            <h2 className="font-extrabold text-xl text-white leading-snug">
              ✏️ {language === 'vi' ? 'Chỉnh sửa dự án' : 'Edit Job'}
            </h2>
            {hasBids && (
              <p className="text-amber-300 text-xs mt-0.5 font-semibold">
                🔒 {language === 'vi' ? 'Dự án đã có thầu — một số trường bị khóa' : 'Job has bids — some fields are locked'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2 flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => !fetching && setCurrentStep(step.num)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                    currentStep === step.num ? 'bg-slate-800 text-white shadow-md'
                    : currentStep > step.num ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </button>
                <span className={`text-[11px] font-bold ${currentStep === step.num ? 'text-slate-800' : currentStep > step.num ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${currentStep > step.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {fetching ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-slate-400">{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading...'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">

              {/* ── STEP 1: Basic Info ── */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Tiêu đề dự án' : 'Project Title'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      required type="text" name="title" value={formData.title} onChange={handleChange}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Mô tả chi tiết' : 'Description'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required name="description" value={formData.description} onChange={handleChange} rows={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Kỹ năng yêu cầu (cách nhau bằng dấu phẩy)' : 'Required Skills (comma separated)'}
                    </label>
                    <input
                      disabled={hasBids} type="text" name="skills" value={formData.skills} onChange={handleChange}
                      placeholder="React, Node.js, Figma..."
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    {hasBids && (
                      <p className="text-[10px] text-amber-600 font-semibold">🔒 {language === 'vi' ? 'Không thể chỉnh sửa khi đã có thầu' : 'Cannot edit after bids received'}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Hình thức đấu thầu' : 'Auction Type'}
                    </label>
                    <div className="flex gap-3">
                      {['SEALED_BID', 'OPEN_BID'].map((at) => (
                        <button
                          key={at} type="button"
                          disabled={hasBids}
                          onClick={() => !hasBids && setFormData((p) => ({ ...p, auctionType: at }))}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-all disabled:cursor-not-allowed ${
                            formData.auctionType === at
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-500 hover:border-blue-300'
                          }`}
                        >
                          {at === 'SEALED_BID' ? '🔒 Sealed Bid' : '🔓 Open Bid'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 2: Budget & Timeline ── */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Hình thức ngân sách' : 'Budget Format'}
                    </label>
                    <div className="flex gap-3">
                      {(['FIXED', 'RANGE'] as const).map((fmt) => (
                        <button
                          key={fmt} type="button"
                          disabled={hasBids}
                          onClick={() => !hasBids && setFormData((p) => ({ ...p, budgetFormat: fmt }))}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-all disabled:cursor-not-allowed ${
                            formData.budgetFormat === fmt
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-500 hover:border-blue-300'
                          }`}
                        >
                          {fmt === 'FIXED' ? (language === 'vi' ? '💰 Giá cố định' : '💰 Fixed Price') : (language === 'vi' ? '📊 Khoảng giá' : '📊 Price Range')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.budgetFormat === 'FIXED' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Ngân sách ($)' : 'Fixed Budget ($)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                        <input
                          disabled={hasBids} type="number" min="1" name="fixedBudget" value={formData.fixedBudget} onChange={handleChange}
                          className="w-full h-10 pl-7 pr-3.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Khoảng ngân sách ($)' : 'Budget Range ($)'}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                          <input disabled={hasBids} type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} placeholder="Min"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50" />
                        </div>
                        <span className="text-slate-400 font-bold">—</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                          <input disabled={hasBids} type="number" name="maxBudget" value={formData.maxBudget} onChange={handleChange} placeholder="Max"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Hạn chót' : 'Deadline'}
                    </label>
                    <input
                      disabled={hasBids} required type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:bg-slate-50"
                    />
                  </div>
                </>
              )}

              {/* ── STEP 3: AHP Weights ── */}
              {currentStep === 3 && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        ⚖️ {language === 'vi' ? 'Trọng số đánh giá AHP' : 'AHP Evaluation Weights'}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {hasBids
                          ? (language === 'vi' ? '🔒 Bị khóa vì đã có thầu' : '🔒 Locked because bids exist')
                          : (language === 'vi' ? 'Tổng phải bằng 100%' : 'Must total exactly 100%')}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                      isWeightValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {totalWeight}% / 100%
                    </div>
                  </div>

                  <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 ${hasBids ? 'opacity-60' : ''}`}>
                    {AHP_CRITERIA.map((criterion) => (
                      <div key={criterion.key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-extrabold text-slate-700">{criterion.label[language as 'vi' | 'en']}</label>
                          <span className="text-xs font-black text-blue-600">{weights[criterion.key]}%</span>
                        </div>
                        <input
                          disabled={hasBids}
                          type="range" min={0} max={100}
                          value={weights[criterion.key]}
                          onChange={(e) => !hasBids && setWeights((prev) => ({ ...prev, [criterion.key]: Number(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep((s) => s - 1)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors">
                    ← {language === 'vi' ? 'Quay lại' : 'Back'}
                  </button>
                )}
                <button type="button" onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-100 transition-colors">
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
              </div>

              {currentStep < 3 ? (
                <button type="button" onClick={() => setCurrentStep((s) => s + 1)}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                  {language === 'vi' ? 'Tiếp theo' : 'Next'} →
                </button>
              ) : (
                <button type="submit" disabled={loading || (!hasBids && !isWeightValid)}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                    </>
                  ) : (
                    <>💾 {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
