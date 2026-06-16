'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { jobsApi, AhpWeight } from '@/lib/api/jobs.api';
import { toast } from 'sonner';
import {
  X, Lock, Unlock, ChevronRight, ChevronLeft,
  Send, Loader2, Check, Briefcase, AlertCircle, Info, Sparkles
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

const AUCTION_TYPES = [
  {
    value: 'OPEN_BID',
    label: { vi: 'Đấu thầu công khai', en: 'Open Bid' },
    desc: { vi: 'Tất cả freelancer đều thấy mức giá của nhau.', en: 'All freelancers can see each other\'s bids.' },
  },
  {
    value: 'SEALED_BID',
    label: { vi: 'Đấu thầu kín', en: 'Sealed Bid' },
    desc: { vi: 'Giá thầu được giữ bí mật cho đến khi kết thúc.', en: 'Bid amounts are hidden until the deadline.' },
  },
];

const AHP_CRITERIA = [
  { key: 'priceWeight',      label: { vi: 'Giá thầu',    en: 'Price' },       default: 40 },
  { key: 'skillWeight',      label: { vi: 'Kỹ năng',     en: 'Skills' },      default: 20 },
  { key: 'experienceWeight', label: { vi: 'Kinh nghiệm', en: 'Experience' },  default: 10 },
  { key: 'ratingWeight',     label: { vi: 'Đánh giá',    en: 'Rating' },      default: 10 },
  { key: 'speedWeight',      label: { vi: 'Tốc độ',      en: 'Speed' },       default: 10 },
  { key: 'deadlineWeight',   label: { vi: 'Đúng hạn',    en: 'On-time' },     default: 5  },
  { key: 'portfolioWeight',  label: { vi: 'Portfolio',   en: 'Portfolio' },   default: 5  },
];

export default function CreateJobModal({ onClose, onSuccess }: Props) {
  const { language } = useTranslation();

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [auctionType, setAuctionType] = useState('SEALED_BID');

  // Step 2
  const [budgetFormat, setBudgetFormat] = useState<'FIXED' | 'RANGE'>('FIXED');
  const [fixedBudget, setFixedBudget] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  // Step 3
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(AHP_CRITERIA.map((c) => [c.key, c.default]))
  );

  const skillInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    jobsApi.getCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    }).catch(() => toast.error('Failed to load categories'));
  }, []);

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
    else if (e.key === 'Backspace' && skillInput === '' && skills.length > 0) setSkills((prev) => prev.slice(0, -1));
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  const getLocalMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = language === 'vi' ? 'Vui lòng nhập tiêu đề dự án' : 'Project title is required';
    if (!description.trim()) errs.description = language === 'vi' ? 'Vui lòng nhập mô tả' : 'Description is required';
    if (skills.length === 0) errs.skills = language === 'vi' ? 'Cần ít nhất 1 kỹ năng' : 'At least 1 skill required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!deadline) errs.deadline = language === 'vi' ? 'Vui lòng chọn hạn chót' : 'Deadline is required';
    if (budgetFormat === 'FIXED' && (!fixedBudget || Number(fixedBudget) <= 0)) errs.budget = language === 'vi' ? 'Vui lòng nhập ngân sách' : 'Budget is required';
    if (budgetFormat === 'RANGE') {
      if (!minBudget || Number(minBudget) <= 0) errs.budget = language === 'vi' ? 'Nhập ngân sách tối thiểu' : 'Min budget required';
      if (!maxBudget || Number(maxBudget) <= Number(minBudget)) errs.maxBudget = language === 'vi' ? 'Max phải lớn hơn Min' : 'Max must be greater than Min';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (!isWeightValid) {
      toast.error(`AHP weights must sum to 100%. Current: ${totalWeight}%`);
      return;
    }
    setSubmitting(true);
    try {
      await jobsApi.create({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        budgetFormat: budgetFormat === 'RANGE' ? 'RANGE' : 'FIXED',
        fixedBudget: budgetFormat === 'FIXED' ? Number(fixedBudget) : undefined,
        minBudget: budgetFormat === 'RANGE' ? Number(minBudget) : undefined,
        maxBudget: budgetFormat === 'RANGE' ? Number(maxBudget) : undefined,
        deadline: new Date(deadline).toISOString(),
        auctionType: auctionType as any,
        skills,
        ahpWeight: weights as any,
      });
      setSuccess(true);
      setTimeout(() => { onClose(); onSuccess?.(); }, 1800);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to post job'));
    } finally {
      setSubmitting(false);
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
          <div>
            <h2 className="font-extrabold text-xl text-white leading-snug flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {language === 'vi' ? 'Đăng dự án mới' : 'Post a New Job'}
            </h2>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">
              {language === 'vi' ? 'Tìm freelancer phù hợp nhất qua hệ thống AHP-TOPSIS' : 'Find the best freelancer via AHP-TOPSIS matching'}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                  currentStep === step.num ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : currentStep > step.num ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400'
                }`}>
                  {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={`text-[11px] font-bold ${currentStep === step.num ? 'text-blue-600' : currentStep > step.num ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${currentStep > step.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="font-extrabold text-lg text-slate-900 text-center">
              {language === 'vi' ? 'Dự án đã được lưu thành công!' : 'Job posted successfully!'}
            </p>
            <p className="text-xs text-slate-400 text-center">
              {language === 'vi' ? 'Trạng thái: DRAFT. Nhấn Publish để mở thầu.' : 'Status: DRAFT. Click Publish to open for bids.'}
            </p>
          </div>
        ) : (
          /* ── NO <form> wrapper here — buttons are all type="button" ── */
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-6 py-5 space-y-5 flex-1">

              {/* ── STEP 1: Basic Info ── */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Tiêu đề dự án' : 'Project Title'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder={language === 'vi' ? 'VD: Xây dựng website thương mại điện tử' : 'e.g. E-commerce website design'}
                      className={`w-full h-10 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                        errors.title ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                    {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Danh mục' : 'Category'} <span className="text-red-500">*</span>
                      </label>
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all">
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Hình thức đấu thầu' : 'Auction Type'} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 h-10">
                        {AUCTION_TYPES.map((at) => (
                          <button key={at.value} type="button" onClick={() => setAuctionType(at.value)} title={at.desc[language as 'vi' | 'en']}
                            className={`flex-1 h-full rounded-xl border text-[10px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                              auctionType === at.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'
                            }`}>
                            {at.value === 'OPEN_BID' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {at.label[language as 'vi' | 'en']}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {AUCTION_TYPES.find((a) => a.value === auctionType)?.desc[language as 'vi' | 'en']}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Mô tả chi tiết' : 'Detailed Description'} <span className="text-red-500">*</span>
                    </label>
                    <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder={language === 'vi' ? 'Mô tả rõ yêu cầu, deliverable, timeline...' : 'Describe the deliverables, timeline, and goals...'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all resize-none leading-relaxed ${
                        errors.description ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                    {errors.description && <p className="text-xs text-red-500 font-semibold">{errors.description}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Kỹ năng yêu cầu' : 'Required Skills'} <span className="text-red-500">*</span>
                    </label>
                    <div onClick={() => skillInputRef.current?.focus()}
                      className={`min-h-[42px] px-3 py-1.5 rounded-xl border flex flex-wrap gap-1.5 items-center cursor-text transition-all ${
                        errors.skills ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10'
                      }`}>
                      {skills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                          {s}
                          <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-blue-700 font-black leading-none">×</button>
                        </span>
                      ))}
                      <input ref={skillInputRef} type="text" value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
                        placeholder={skills.length === 0 ? 'React, Node.js, Figma...' : ''}
                        className="flex-1 min-w-[140px] text-xs font-medium outline-none bg-transparent py-1"
                      />
                    </div>
                    {errors.skills && <p className="text-xs text-red-500 font-semibold">{errors.skills}</p>}
                    <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Nhấn Enter hoặc dấu phẩy để thêm kỹ năng.' : 'Press Enter or comma to add a skill.'}</p>
                  </div>
                </>
              )}

              {/* ── STEP 2: Budget & Timeline ── */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Hình thức ngân sách' : 'Budget Format'} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      {(['FIXED', 'RANGE'] as const).map((fmt) => (
                        <button key={fmt} type="button" onClick={() => setBudgetFormat(fmt)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                            budgetFormat === fmt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'
                          }`}>
                          {fmt === 'FIXED' ? (language === 'vi' ? 'Giá cố định' : 'Fixed Price') : (language === 'vi' ? 'Khoảng giá' : 'Price Range')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {budgetFormat === 'FIXED' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Ngân sách ($)' : 'Fixed Budget ($)'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                        <input type="number" min="1" value={fixedBudget} onChange={(e) => setFixedBudget(e.target.value)} placeholder="500"
                          className={`w-full h-10 pl-7 pr-3.5 rounded-xl border text-sm font-semibold outline-none transition-all ${
                            errors.budget ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`} />
                      </div>
                      {errors.budget && <p className="text-xs text-red-500 font-semibold">{errors.budget}</p>}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                        {language === 'vi' ? 'Khoảng ngân sách ($)' : 'Budget Range ($)'} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                          <input type="number" min="1" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="Min"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                        </div>
                        <span className="text-slate-400 font-bold">—</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                          <input type="number" min="1" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Max"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                        </div>
                      </div>
                      {(errors.budget || errors.maxBudget) && <p className="text-xs text-red-500 font-semibold">{errors.budget || errors.maxBudget}</p>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      {language === 'vi' ? 'Hạn chót nhận thầu' : 'Bidding Deadline'} <span className="text-red-500">*</span>
                    </label>
                    <input type="datetime-local" min={getLocalMinDate()} value={deadline} onChange={(e) => setDeadline(e.target.value)}
                      className={`w-full h-10 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                        errors.deadline ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`} />
                    {errors.deadline && <p className="text-xs text-red-500 font-semibold">{errors.deadline}</p>}
                  </div>

                  {((budgetFormat === 'FIXED' && fixedBudget && Number(fixedBudget) > 0) ||
                    (budgetFormat === 'RANGE' && minBudget && maxBudget)) && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-semibold flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        {language === 'vi'
                          ? 'BidWise sẽ giữ tiền vào Escrow ngay khi bạn phê duyệt thầu. Tiền được giải phóng khi từng Milestone được nghiệm thu.'
                          : 'BidWise will hold funds in Escrow once you accept a bid. Released as each Milestone is approved.'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ── STEP 3: AHP Weights ── */}
              {currentStep === 3 && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        {language === 'vi' ? 'Trọng số đánh giá AHP' : 'AHP Evaluation Weights'}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'vi'
                          ? 'Xác định tầm quan trọng của từng tiêu chí để AI xếp hạng freelancer. Tổng phải bằng 100%.'
                          : 'Define criteria importance for AI ranking. Must total exactly 100%.'}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      isWeightValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {totalWeight}% / 100%
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                    {AHP_CRITERIA.map((criterion) => {
                      const val = weights[criterion.key];
                      return (
                        <div key={criterion.key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-extrabold text-slate-700">{criterion.label[language as 'vi' | 'en']}</label>
                            <span className="text-xs font-black text-blue-600 w-10 text-right">{val}%</span>
                          </div>
                          <input type="range" min={0} max={100} value={val}
                            onChange={(e) => setWeights((prev) => ({ ...prev, [criterion.key]: Number(e.target.value) }))}
                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {!isWeightValid && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {language === 'vi'
                          ? `Tổng hiện tại: ${totalWeight}%. Cần ${totalWeight > 100 ? 'giảm' : 'tăng'} ${Math.abs(100 - totalWeight)}% nữa.`
                          : `Current total: ${totalWeight}%. ${totalWeight > 100 ? 'Reduce' : 'Add'} ${Math.abs(100 - totalWeight)}% more.`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer — all buttons are type="button", no <form> needed */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep((s) => s - 1)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    {language === 'vi' ? 'Quay lại' : 'Back'}
                  </button>
                )}
                <button type="button" onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-100 transition-colors">
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
              </div>

              {currentStep < 3 ? (
                <button type="button" onClick={handleNext}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-1.5">
                  {language === 'vi' ? 'Tiếp theo' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" disabled={submitting || !isWeightValid} onClick={handleSubmit}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'vi' ? 'Đang lưu...' : 'Saving...'}</>
                    : <><Send className="w-4 h-4" /> {language === 'vi' ? 'Đăng dự án' : 'Post Job'}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
