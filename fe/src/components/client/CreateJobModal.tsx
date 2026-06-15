'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useFreelancer } from '@/lib/hooks/useFreelancer';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Job } from '@/lib/hooks/useFreelancer';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: { value: Job['category']; label: { vi: string; en: string } }[] = [
  { value: 'frontend',  label: { vi: 'Frontend / Giao diện',        en: 'Frontend / UI' } },
  { value: 'backend',   label: { vi: 'Backend / Máy chủ',           en: 'Backend / Server' } },
  { value: 'fullstack', label: { vi: 'Fullstack (Frontend + Backend)', en: 'Fullstack (Frontend + Backend)' } },
  { value: 'mobile',    label: { vi: 'Mobile (iOS / Android)',       en: 'Mobile (iOS / Android)' } },
];

const AUCTION_TYPES: { value: Job['auctionType']; label: { vi: string; en: string }; desc: { vi: string; en: string } }[] = [
  {
    value: 'OPEN',
    label: { vi: 'Đấu thầu công khai (Open Bid)', en: 'Open Bid' },
    desc: { vi: 'Tất cả freelancer đều thấy mức giá của nhau.', en: 'All freelancers can see each other\'s bids.' },
  },
  {
    value: 'SEALED',
    label: { vi: 'Đấu thầu kín (Sealed Bid)', en: 'Sealed Bid' },
    desc: { vi: 'Giá thầu được giữ bí mật cho đến khi kết thúc.', en: 'Bid amounts are hidden until the deadline.' },
  },
];

export default function CreateJobModal({ onClose, onSuccess }: Props) {
  const { createJob } = useFreelancer();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Job['category']>('frontend');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [auctionType, setAuctionType] = useState<Job['auctionType']>('OPEN');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [clientName, setClientName] = useState(user?.fullName ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const skillInputRef = useRef<HTMLInputElement>(null);

  // Skill tag helpers
  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === 'Backspace' && skillInput === '' && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = t('jobs.errJobTitle');
    if (!description.trim()) errs.description = t('jobs.errJobDesc');
    if (!budget || Number(budget) <= 0) errs.budget = t('jobs.errJobBudget');
    if (!deadline) errs.deadline = t('jobs.errJobDeadline');
    if (skills.length === 0) errs.skills = t('jobs.errJobSkills');
    if (!clientName.trim()) errs.clientName = t('jobs.errJobClientName');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    // Simulate a slight delay for realism
    await new Promise((r) => setTimeout(r, 600));

    createJob({
      title: title.trim(),
      description: description.trim(),
      category,
      skills,
      budget: Number(budget),
      deadline,
      auctionType,
      clientName: clientName.trim(),
    });

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      onClose();
      onSuccess?.();
    }, 1800);
  };

  // Today's date as ISO string for min deadline
  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
          <div>
            <h2 className="font-extrabold text-xl text-white leading-snug">
              {t('jobs.createJobTitle')}
            </h2>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">
              {t('jobs.createJobSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-6">
            <div className="text-5xl animate-bounce">🎉</div>
            <p className="font-extrabold text-lg text-slate-900 text-center">
              {t('jobs.publishJobSuccess')}
            </p>
            <div className="w-8 h-1 rounded-full bg-blue-600 animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">

              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  {t('jobs.jobTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('jobs.jobTitlePlaceholder')}
                  className={`w-full h-10 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                    errors.title ? 'border-red-400 bg-red-50/30 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
                {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  {t('jobs.jobDescLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('jobs.jobDescPlaceholder')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none font-sans leading-relaxed ${
                    errors.description ? 'border-red-400 bg-red-50/30 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 font-semibold">{errors.description}</p>}
              </div>

              {/* Category + Budget row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    {t('jobs.jobCategoryLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Job['category'])}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label[language as 'vi' | 'en']}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    {t('jobs.jobBudgetLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="500"
                      className={`w-full h-10 pl-7 pr-3.5 rounded-xl border text-sm font-semibold outline-none transition-all ${
                        errors.budget ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                  {errors.budget && <p className="text-xs text-red-500 font-semibold">{errors.budget}</p>}
                </div>
              </div>

              {/* Deadline + Auction Type row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    {t('jobs.jobDeadlineLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={todayISO}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full h-10 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                      errors.deadline ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                  {errors.deadline && <p className="text-xs text-red-500 font-semibold">{errors.deadline}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    {t('jobs.jobAuctionTypeLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 h-10">
                    {AUCTION_TYPES.map((at) => (
                      <button
                        key={at.value}
                        type="button"
                        onClick={() => setAuctionType(at.value)}
                        title={at.desc[language as 'vi' | 'en']}
                        className={`flex-1 h-full rounded-xl border text-[10px] font-extrabold transition-all ${
                          auctionType === at.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {at.value === 'OPEN' ? '🔓' : '🔒'} {at.value}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-snug">
                    {AUCTION_TYPES.find((a) => a.value === auctionType)?.desc[language as 'vi' | 'en']}
                  </p>
                </div>
              </div>

              {/* Skills tag input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  {t('jobs.jobSkillsLabel')} <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => skillInputRef.current?.focus()}
                  className={`min-h-[42px] px-3 py-1.5 rounded-xl border flex flex-wrap gap-1.5 items-center cursor-text transition-all ${
                    errors.skills ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10'
                  }`}
                >
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="text-blue-400 hover:text-blue-700 font-black text-xs leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
                    placeholder={skills.length === 0 ? t('jobs.jobSkillsPlaceholder') : ''}
                    className="flex-1 min-w-[140px] text-xs font-medium outline-none bg-transparent placeholder:text-slate-350 py-1"
                  />
                </div>
                {errors.skills && <p className="text-xs text-red-500 font-semibold">{errors.skills}</p>}
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'vi' ? 'Nhấn Enter hoặc dấu phẩy để thêm kỹ năng.' : 'Press Enter or comma to add a skill.'}
                </p>
              </div>

              {/* Client / Company Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  {t('jobs.jobClientNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t('jobs.jobClientNamePlaceholder')}
                  className={`w-full h-10 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                    errors.clientName ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
                {errors.clientName && <p className="text-xs text-red-500 font-semibold">{errors.clientName}</p>}
              </div>

              {/* Budget notice */}
              {budget && Number(budget) > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-semibold flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <p>
                    {language === 'vi'
                      ? `Hệ thống BidWise sẽ giữ $${Number(budget).toLocaleString()} USD vào Escrow ngay khi bạn phê duyệt thầu. Tiền được giải phóng khi từng Milestone được nghiệm thu.`
                      : `BidWise will hold $${Number(budget).toLocaleString()} USD in Escrow once you accept a bid. Funds are released as each Milestone is approved.`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {language === 'vi' ? 'Đang đăng...' : 'Publishing...'}
                  </>
                ) : (
                  <>🚀 {t('jobs.publishJobBtn')}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
