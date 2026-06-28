'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, DollarSign, Edit2, Trash2, ChevronDown, ChevronUp,
  Star, AlertCircle, CheckCircle, BookmarkCheck, XCircle, Lightbulb,
  TrendingUp, Target, Zap
} from 'lucide-react';
import { bidsApi, ApiBid, BidStats, BidQuota, MatchBreakdown } from '@/lib/api/bids.api';
import { toast } from 'sonner';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: 'Chờ xét',   color: 'bg-slate-100 text-slate-600',    icon: Clock },
  SHORTLISTED: { label: 'Shortlist', color: 'bg-amber-100 text-amber-700',    icon: BookmarkCheck },
  ACCEPTED:    { label: 'Được chọn', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJECTED:    { label: 'Từ chối',   color: 'bg-rose-100 text-rose-600',      icon: XCircle },
  WITHDRAWN:   { label: 'Đã rút',    color: 'bg-slate-100 text-slate-400',    icon: XCircle },
  EXPIRED:     { label: 'Hết hạn',   color: 'bg-slate-100 text-slate-400',    icon: AlertCircle },
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

// ─── Match Score Breakdown (FL-13) ────────────────────────────────────────────

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-12 text-right">{score}/{max}</span>
    </div>
  );
}

function MatchBreakdownPanel({ breakdown, total }: { breakdown: MatchBreakdown; total: number }) {
  const scoreColor = total >= 75 ? 'text-emerald-600' : total >= 50 ? 'text-amber-600' : 'text-slate-500';
  const barColor = total >= 75 ? 'bg-emerald-500' : total >= 50 ? 'bg-amber-400' : 'bg-slate-400';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Điểm matching của bạn</span>
        <span className={`text-xl font-black ${scoreColor}`}>{total}/100</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${total}%` }} />
      </div>
      <div className="space-y-1.5 pt-1">
        <ScoreBar label="Kỹ năng"    score={breakdown.skills.score}     max={breakdown.skills.max}     color="bg-blue-500" />
        <ScoreBar label="Ngân sách"  score={breakdown.budget.score}     max={breakdown.budget.max}     color="bg-emerald-500" />
        <ScoreBar label="Assessment" score={breakdown.assessment.score} max={breakdown.assessment.max} color="bg-purple-500" />
        <ScoreBar label="Profile"    score={breakdown.profile.score}    max={breakdown.profile.max}    color="bg-amber-400" />
      </div>
      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
        <p className="flex items-start gap-1.5"><span className="text-blue-500 shrink-0 mt-0.5">•</span>{breakdown.skills.explanation}</p>
        <p className="flex items-start gap-1.5"><span className="text-emerald-500 shrink-0 mt-0.5">•</span>{breakdown.budget.explanation}</p>
        <p className="flex items-start gap-1.5"><span className="text-purple-500 shrink-0 mt-0.5">•</span>{breakdown.assessment.explanation}</p>
        {(breakdown.skills.missing?.length ?? 0) > 0 && (
          <p className="flex items-start gap-1.5 text-amber-600 font-medium">
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            Kỹ năng còn thiếu: {breakdown.skills.missing.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Edit Bid Modal (FL-14) ───────────────────────────────────────────────────

function EditBidModal({ bid, onClose, onSaved }: {
  bid: ApiBid;
  onClose: () => void;
  onSaved: (updated: ApiBid) => void;
}) {
  const [amount, setAmount] = useState(String(bid.amount));
  const [days, setDays] = useState(String(bid.days ?? ''));
  const [coverLetter, setCoverLetter] = useState(bid.coverLetter ?? '');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await bidsApi.suggestCoverLetter(bid.jobId);
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
      const updated = await bidsApi.updateBid(bid.id, { amount: amt, days: dys, coverLetter });
      toast.success('Đã cập nhật bid!');
      onSaved(updated);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900">Chỉnh sửa Bid — FL-14</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
          <span className="font-semibold">Job: </span>{bid.jobTitle}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Giá bid ($) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Thời gian (ngày) *</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
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
                {suggesting ? 'Đang tạo...' : 'Gợi ý AI (FL-17)'}
              </button>
            </div>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả lý do bạn phù hợp với job này..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main BidsTab ─────────────────────────────────────────────────────────────

export default function BidsTab() {
  const [bids, setBids] = useState<ApiBid[]>([]);
  const [stats, setStats] = useState<BidStats | null>(null);
  const [quota, setQuota] = useState<BidQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [editingBid, setEditingBid] = useState<ApiBid | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bidsData, statsData, quotaData] = await Promise.all([
        bidsApi.listMyBids(),
        bidsApi.getStats(),
        bidsApi.getQuota(),
      ]);
      setBids(bidsData);
      setStats(statsData);
      setQuota(quotaData);
    } catch {
      toast.error('Không thể tải dữ liệu bids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async (bidId: string) => {
    if (!confirm('Rút bid này? Bạn có thể bị trừ token nếu rút quá nhiều.')) return;
    setWithdrawingId(bidId);
    try {
      const updated = await bidsApi.withdrawBid(bidId);
      setBids((prev) => prev.map((b) => (b.id === bidId ? updated : b)));
      toast.success('Đã rút bid');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Không thể rút bid');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleEditSaved = (updated: ApiBid) => {
    setBids((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBid(null);
  };

  const filteredBids = statusFilter === 'ALL' ? bids : bids.filter((b) => b.status === statusFilter);

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Đang tải...</div>;
  }

  return (
    <div className="space-y-5">

      {/* ── Stats row (FL-18) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng bids',   value: stats?.totalBids ?? 0,        icon: Target,     color: 'text-slate-700' },
          { label: 'Win rate',    value: `${stats?.winRate ?? 0}%`,     icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Avg giá',    value: `$${stats?.avgBidPrice ?? 0}`, icon: DollarSign, color: 'text-blue-600' },
          {
            label: 'Token hôm nay',
            value: quota ? `${quota.remaining}/${quota.dailyLimit}` : '—',
            icon: Zap,
            color: quota && quota.remaining <= 2 ? 'text-rose-500' : 'text-amber-600',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <s.icon size={20} className={`${s.color} shrink-0`} />
            <div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quota warning */}
      {quota && quota.remaining === 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle size={14} />
          Hết lượt bid hôm nay ({quota.tier}). Token reset lúc 00:00 ngày mai.
        </div>
      )}

      {/* ── Win rate by category (FL-18) ── */}
      {stats && stats.byCategory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Win rate theo category</p>
          <div className="space-y-2">
            {stats.byCategory.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-32 shrink-0 truncate">{cat.category}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cat.winRate}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                  {cat.bids} bids · {cat.winRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Status filter tabs (FL-16) ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => {
          const count = s === 'ALL' ? bids.length : bids.filter((b) => b.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_CFG[s]?.label ?? s}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Bid list ── */}
      {filteredBids.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <Target size={36} className="mx-auto text-slate-200" />
          <p className="font-semibold text-slate-600">
            {statusFilter === 'ALL'
              ? 'Bạn chưa gửi bid nào.'
              : `Không có bid ${STATUS_CFG[statusFilter]?.label?.toLowerCase()}.`}
          </p>
          <p className="text-xs text-slate-400">Vào tab "Tìm việc" để khám phá jobs và gửi đề xuất.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBids.map((bid) => {
            const cfg = STATUS_CFG[bid.status] ?? STATUS_CFG.PENDING;
            const Icon = cfg.icon;
            const isExpanded = expandedBid === bid.id;
            const canEdit = bid.canEdit;
            const canWithdraw = bid.status === 'PENDING' || bid.status === 'SHORTLISTED';
            const score = bid.matchingScore ?? 0;
            const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-slate-500';

            return (
              <div
                key={bid.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  bid.status === 'ACCEPTED'
                    ? 'border-emerald-300'
                    : bid.status === 'SHORTLISTED'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Row */}
                <div className="p-4 flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <Icon size={15} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{bid.jobTitle}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Client: {bid.clientName}</p>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
                        <DollarSign size={12} className="text-emerald-500" />
                        ${bid.amount.toLocaleString()}
                      </span>
                      {bid.days && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />{bid.days} ngày
                        </span>
                      )}
                      {bid.matchingScore != null && (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${scoreColor}`}>
                          <Star size={11} />Match {bid.matchingScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Gửi: {new Date(bid.submittedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* FL-14: Edit */}
                    {canEdit && (
                      <button
                        onClick={() => setEditingBid(bid)}
                        title="Chỉnh sửa bid (FL-14)"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {/* FL-15: Withdraw */}
                    {canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(bid.id)}
                        disabled={withdrawingId === bid.id}
                        title="Rút bid (FL-15)"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedBid(isExpanded ? null : bid.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Cover letter */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Cover Letter</p>
                      <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-white border border-slate-100 rounded-xl p-3 max-h-44 overflow-y-auto">
                        {bid.coverLetter || <span className="text-slate-400 italic">Không có cover letter.</span>}
                      </div>
                    </div>

                    {/* FL-13: Score breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Điểm Matching (FL-13)
                      </p>
                      {bid.matchBreakdown && bid.matchingScore != null ? (
                        <MatchBreakdownPanel breakdown={bid.matchBreakdown} total={bid.matchingScore} />
                      ) : (
                        <div className="text-xs text-slate-400 text-center py-6 bg-white border border-slate-100 rounded-xl">
                          Chưa có dữ liệu breakdown.
                        </div>
                      )}
                    </div>

                    {/* Status-specific banners */}
                    {bid.status === 'ACCEPTED' && (
                      <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Bid được chấp nhận!</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Vào tab <strong>"Quản lý hợp đồng"</strong> để xem contract và bắt đầu làm việc.
                          </p>
                        </div>
                      </div>
                    )}
                    {bid.status === 'SHORTLISTED' && (
                      <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <BookmarkCheck size={16} className="text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 font-semibold">
                          Client đã shortlist bid của bạn — khả năng cao sẽ được chọn!
                        </p>
                      </div>
                    )}
                    {bid.status === 'REJECTED' && (
                      <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
                        Bid bị từ chối. Hãy cải thiện cover letter và kỹ năng để tăng điểm matching.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FL-14 Edit Modal */}
      {editingBid && (
        <EditBidModal
          bid={editingBid}
          onClose={() => setEditingBid(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
