'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bookmark, BookmarkCheck, Send, X, ChevronDown, Star, Clock, DollarSign, Zap, Lightbulb, AlertCircle } from 'lucide-react';
import { jobsApi, JobResponse, JobSearchParams } from '@/lib/api/jobs.api';
import { bidsApi } from '@/lib/api/bids.api';
import { toast } from 'sonner';

// ─── helpers ──────────────────────────────────────────────────────────────────

function budgetLabel(job: JobResponse) {
  if (job.budgetFormat === 'FIXED') return `$${(job.fixedBudget ?? job.budget ?? 0).toLocaleString()}`;
  if (job.minBudget && job.maxBudget) return `$${job.minBudget.toLocaleString()} – $${job.maxBudget.toLocaleString()}`;
  return `$${(job.budget ?? 0).toLocaleString()}`;
}

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return { label: 'Hết hạn', color: 'text-rose-500' };
  if (d === 0) return { label: 'Hôm nay', color: 'text-rose-500' };
  if (d <= 3) return { label: `${d} ngày`, color: 'text-amber-500' };
  return { label: `${d} ngày`, color: 'text-slate-400' };
}

// ─── Bid Modal ────────────────────────────────────────────────────────────────

function BidModal({ job, quota, onClose, onSuccess }: {
  job: JobResponse;
  quota: { remaining: number; dailyLimit: number; tier: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [success, setSuccess] = useState(false);

  const budget = job.fixedBudget ?? job.maxBudget ?? job.budget ?? 0;

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await bidsApi.suggestCoverLetter(job.id);
      setCoverLetter(res.template);
      toast.success('Đã tạo gợi ý cover letter');
    } catch {
      toast.error('Không thể tạo gợi ý');
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    const dys = Number(days);
    if (!amt || amt <= 0) { toast.error('Giá bid không hợp lệ'); return; }
    if (!dys || dys <= 0) { toast.error('Số ngày không hợp lệ'); return; }
    if (!coverLetter.trim()) { toast.error('Vui lòng nhập cover letter'); return; }

    setLoading(true);
    try {
      const res = await bidsApi.submitBid({ jobId: job.id, amount: amt, days: dys, coverLetter });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gửi bid thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900">Gửi đề xuất thầu</h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Quota badge */}
        {quota && (
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            quota.remaining <= 2 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            <Zap size={11} />
            Token còn: {quota.remaining}/{quota.dailyLimit} ({quota.tier})
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-2">
            <div className="text-4xl">🚀</div>
            <p className="font-bold text-emerald-600">Đã gửi bid thành công!</p>
            <p className="text-xs text-slate-400">Vào "Đấu thầu của tôi" để theo dõi trạng thái.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Giá bid ($) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Budget: ${budgetLabel(job)}`}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {Number(amount) > budget && budget > 0 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Vượt ngân sách
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Thời gian (ngày) *
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="VD: 14"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Cover Letter *</label>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <Lightbulb size={11} />
                  {suggesting ? 'Đang tạo...' : 'Gợi ý AI'}
                </button>
              </div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                placeholder="Mô tả kinh nghiệm, kế hoạch triển khai và lý do bạn phù hợp..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || (quota?.remaining === 0)}
                className="flex-1 h-10 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {loading ? 'Đang gửi...' : 'Gửi đề xuất'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Job Detail Drawer ────────────────────────────────────────────────────────

function JobDrawer({ job, alreadyBid, onClose, onBid }: {
  job: JobResponse;
  alreadyBid: boolean;
  onClose: () => void;
  onBid: () => void;
}) {
  const dl = daysLeft(job.deadline);
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {job.category && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">
                  {job.category.name}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                job.auctionType === 'OPEN_BID'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {job.auctionType === 'OPEN_BID' ? 'Open Bid' : 'Sealed Bid'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{job.title}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Client: {job.client?.fullName ?? 'N/A'}</span>
              {job.client?.avgRating && job.client.avgRating > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] border border-amber-100 font-bold shrink-0">
                  ★ {job.client.avgRating.toFixed(1)} ({job.client.totalReviews} reviews)
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <DollarSign size={14} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-xs text-slate-500">Budget</p>
              <p className="font-bold text-slate-800 text-sm">{budgetLabel(job)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <Clock size={14} className={`mx-auto mb-1 ${dl.color}`} />
              <p className="text-xs text-slate-500">Deadline</p>
              <p className={`font-bold text-sm ${dl.color}`}>{dl.label}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <Send size={14} className="mx-auto text-blue-400 mb-1" />
              <p className="text-xs text-slate-500">Bids</p>
              <p className="font-bold text-slate-800 text-sm">{job._count?.bids ?? 0}</p>
            </div>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kỹ năng yêu cầu</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mô tả dự án</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Client stats info */}
          {job.client && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5">
                💼 Thông tin Khách hàng
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-650">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số dự án đã đăng</span>
                  <span className="font-extrabold text-slate-850 mt-0.5">{job.client.totalJobsPosted ?? 0} dự án</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tỷ lệ thuê thầu</span>
                  <span className="font-extrabold text-slate-850 mt-0.5">{job.client.hireRate ?? 0}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng chi trả</span>
                  <span className="font-extrabold text-emerald-600 mt-0.5">${(job.client.totalSpent ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thành viên từ</span>
                  <span className="font-extrabold text-slate-850 mt-0.5">
                    {job.client.createdAt ? new Date(job.client.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AHP weights preview */}
          {job.ahpWeight && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tiêu chí đánh giá (AHP)</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Giá bid', value: job.ahpWeight.priceWeight },
                  { label: 'Kỹ năng', value: job.ahpWeight.skillWeight },
                  { label: 'Kinh nghiệm', value: job.ahpWeight.experienceWeight },
                  { label: 'Đánh giá', value: job.ahpWeight.ratingWeight },
                  { label: 'Portfolio', value: job.ahpWeight.portfolioWeight },
                ].filter(w => w.value > 0).sort((a, b) => b.value - a.value).map((w) => (
                  <div key={w.label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{w.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${w.value}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-8 text-right">{w.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Reviews Section */}
          {job.client?.reviews && job.client.reviews.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nhận xét về Khách hàng</p>
              <div className="space-y-2.5">
                {job.client.reviews.map((r: any) => (
                  <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700">{r.reviewerName}</span>
                      <span className="text-slate-400 font-medium">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={11}
                          className={
                            idx < Math.round(r.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                      <span className="text-[10px] text-slate-400 font-bold ml-1">
                        {r.rating.toFixed(1)}/5.0
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-slate-650 leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
            Đóng
          </button>
          <button
            onClick={onBid}
            disabled={alreadyBid}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
              alreadyBid
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send size={14} />
            {alreadyBid ? 'Đã gửi bid' : 'Gửi đề xuất'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main JobsTab ─────────────────────────────────────────────────────────────

export default function JobsTab() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [myBidJobIds, setMyBidJobIds] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<{ remaining: number; dailyLimit: number; tier: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [auctionType, setAuctionType] = useState<'SEALED_BID' | 'OPEN_BID' | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'budget' | 'deadline'>('createdAt');
  const [subTab, setSubTab] = useState<'all' | 'bookmarks' | 'suggest'>('all');

  // UI state
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);
  const [bidJob, setBidJob] = useState<JobResponse | null>(null);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Load jobs ──────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (params: JobSearchParams & { subTab?: string } = {}) => {
    setLoading(true);
    try {
      if (params.subTab === 'suggest') {
        const suggestions = await jobsApi.getJobSuggestions({ limit: 20 });
        setJobs(suggestions);
        setTotal(suggestions.length);
      } else if (params.subTab === 'bookmarks') {
        const bookmarks = await jobsApi.getBookmarks();
        setJobs(bookmarks);
        setTotal(bookmarks.length);
      } else {
        const res = await jobsApi.getJobs({
          ...(params.keyword ? { keyword: params.keyword } : {}),
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
          ...(params.auctionType ? { auctionType: params.auctionType } : {}),
          sortBy: params.sortBy ?? 'createdAt',
          page: params.page ?? 1,
          limit: 12,
        });
        setJobs(res.jobs);
        setTotal(res.pagination.total);
      }
    } catch {
      toast.error('Không thể tải danh sách jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const [cats, bmarks, quotaData, myBids] = await Promise.allSettled([
        jobsApi.getCategories(),
        jobsApi.getBookmarks(),
        bidsApi.getQuota(),
        bidsApi.listMyBids(),
      ]);
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (bmarks.status === 'fulfilled') {
        setBookmarkedIds(new Set(bmarks.value.map((j: JobResponse) => j.id)));
      }
      if (quotaData.status === 'fulfilled') {
        const q = quotaData.value;
        setQuota({ remaining: q.remaining, dailyLimit: q.dailyLimit, tier: q.tier });
      }
      if (myBids.status === 'fulfilled') {
        setMyBidJobIds(new Set(myBids.value.filter(b => b.status !== 'WITHDRAWN').map(b => b.jobId)));
      }
    };
    init();
    loadJobs({ subTab: 'all' });
  }, [loadJobs]);

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    if (subTab !== 'all') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      loadJobs({ keyword: search, categoryId, auctionType: auctionType || undefined, sortBy, page: 1, subTab: 'all' });
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, categoryId, auctionType, sortBy]);

  // ── Sub-tab change ─────────────────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
    loadJobs({ keyword: search, categoryId, auctionType: auctionType || undefined, sortBy, page: 1, subTab });
  }, [subTab]);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const toggleBookmark = async (jobId: string) => {
    try {
      await jobsApi.toggleBookmark(jobId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.has(jobId) ? next.delete(jobId) : next.add(jobId);
        return next;
      });
    } catch {
      toast.error('Không thể lưu bookmark');
    }
  };

  // ── After bid success ──────────────────────────────────────────────────────
  const handleBidSuccess = async () => {
    setBidJob(null);
    const q = await bidsApi.getQuota().catch(() => null);
    if (q) setQuota({ remaining: q.remaining, dailyLimit: q.dailyLimit, tier: q.tier });
    const myBids = await bidsApi.listMyBids().catch(() => []);
    setMyBidJobIds(new Set(myBids.filter(b => b.status !== 'WITHDRAWN').map(b => b.jobId)));
  };

  return (
    <div className="space-y-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm jobs..."
            className="w-full h-10 pl-8 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
        >
          <option value="">Tất cả ngành</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Auction type */}
        <select
          value={auctionType}
          onChange={(e) => { setAuctionType(e.target.value as any); setPage(1); }}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả</option>
          <option value="SEALED_BID">Sealed Bid</option>
          <option value="OPEN_BID">Open Bid</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="createdAt">Mới nhất</option>
          <option value="budget">Budget</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>

      {/* ── Sub-tabs + quota ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'suggest', label: '⭐ Gợi ý' },
            { key: 'bookmarks', label: `🔖 Đã lưu` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key as any)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                subTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {quota && (
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            quota.remaining <= 2
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}>
            <Zap size={11} />
            Token: {quota.remaining}/{quota.dailyLimit} — {quota.tier}
          </div>
        )}
      </div>

      {/* ── Job list ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Đang tải...</div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <Search size={36} className="mx-auto text-slate-200" />
          <p className="font-semibold text-slate-600">Không tìm thấy job nào.</p>
          {subTab !== 'all' && (
            <button onClick={() => setSubTab('all')} className="text-sm text-blue-600 hover:underline">
              Xem tất cả jobs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const dl = daysLeft(job.deadline);
            const isBookmarked = bookmarkedIds.has(job.id);
            const alreadyBid = myBidJobIds.has(job.id);

            return (
              <div
                key={job.id}
                className={`bg-white border rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all ${
                  alreadyBid ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-start gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 text-left"
                      >
                        {job.title}
                      </button>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        job.auctionType === 'OPEN_BID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {job.auctionType === 'OPEN_BID' ? 'Open' : 'Sealed'}
                      </span>
                      {alreadyBid && (
                        <span className="shrink-0 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                          ✓ Đã bid
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{job.client?.fullName ?? 'Client'}</span>
                      {job.client?.avgRating && job.client.avgRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-100 font-bold">
                          ★ {job.client.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span>· {job.category?.name ?? ''}</span>
                    </p>

                    {/* Skills */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {job.skills.slice(0, 5).map((s) => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="text-xs text-slate-400">+{job.skills.length - 5}</span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <DollarSign size={11} className="text-emerald-500" />
                        {budgetLabel(job)}
                      </span>
                      <span className={`flex items-center gap-1 ${dl.color}`}>
                        <Clock size={11} />
                        {dl.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Send size={11} />
                        {job._count?.bids ?? 0} bids
                      </span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleBookmark(job.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>

                    <button
                      onClick={() => {
                        if (!alreadyBid) {
                          setSelectedJob(null);
                          setBidJob(job);
                        }
                      }}
                      disabled={alreadyBid}
                      className={`h-8 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
                        alreadyBid
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Send size={11} />
                      {alreadyBid ? 'Đã bid' : 'Bid ngay'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {subTab === 'all' && total > 12 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => { setPage(p => p - 1); loadJobs({ keyword: search, categoryId, auctionType: auctionType || undefined, sortBy, page: page - 1, subTab: 'all' }); }}
            disabled={page === 1}
            className="h-8 px-4 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            ← Trước
          </button>
          <span className="h-8 px-4 text-xs flex items-center text-slate-500">
            {page} / {Math.ceil(total / 12)}
          </span>
          <button
            onClick={() => { setPage(p => p + 1); loadJobs({ keyword: search, categoryId, auctionType: auctionType || undefined, sortBy, page: page + 1, subTab: 'all' }); }}
            disabled={page >= Math.ceil(total / 12)}
            className="h-8 px-4 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Tiếp →
          </button>
        </div>
      )}

      {/* ── Job Detail Drawer ── */}
      {selectedJob && !bidJob && (
        <JobDrawer
          job={selectedJob}
          alreadyBid={myBidJobIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onBid={() => { setBidJob(selectedJob); setSelectedJob(null); }}
        />
      )}

      {/* ── Bid Modal ── */}
      {bidJob && (
        <BidModal
          job={bidJob}
          quota={quota}
          onClose={() => setBidJob(null)}
          onSuccess={handleBidSuccess}
        />
      )}
    </div>
  );
}
