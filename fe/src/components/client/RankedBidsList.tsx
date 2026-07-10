'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Star, Check, X, GitCompare, Bookmark, Eye, Clock, DollarSign } from 'lucide-react';
import { clientBidsApi, RankedBid, RankedBidsResponse } from '@/lib/api/client-bids.api';
import BidScoreChart from './BidScoreChart';
import FreelancerProfileModal from './FreelancerProfileModal';
import BidCompareModal from './BidCompareModal';
import CreateContractModal from './CreateContractModal';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xét', color: 'bg-slate-100 text-slate-600' },
  SHORTLISTED: { label: 'Shortlist', color: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { label: 'Đã chọn', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-100 text-rose-600' },
  WITHDRAWN: { label: 'Rút lui', color: 'bg-slate-100 text-slate-400' },
};

interface Props {
  jobId: string;
  jobTitle?: string;
  onBidAccepted?: () => void;
}

export default function RankedBidsList({ jobId, jobTitle, onBidAccepted }: Props) {
  const [data, setData] = useState<RankedBidsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [profileModal, setProfileModal] = useState<{ bidId: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [confirmAccept, setConfirmAccept] = useState<string | null>(null);
  const [createContractBid, setCreateContractBid] = useState<RankedBid | null>(null);

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientBidsApi.getRankedBids(jobId);
      setData(res);
    } catch {
      toast.error('Không thể tải danh sách bids');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { loadBids(); }, [loadBids]);

  const handleShortlist = async (bidId: string) => {
    setActionLoading(bidId);
    try {
      const updated = await clientBidsApi.shortlistBid(jobId, bidId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              bids: prev.bids.map((b) =>
                b.id === bidId ? { ...b, status: updated.status } : b,
              ),
            }
          : prev,
      );
      toast.success(updated.status === 'SHORTLISTED' ? 'Đã thêm vào shortlist' : 'Đã bỏ shortlist');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecide = async (bidId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setActionLoading(bidId);
    try {
      const result = await clientBidsApi.decideBid(jobId, bidId, action);
      toast.success(action === 'ACCEPTED' ? 'Đã chấp nhận bid!' : 'Đã từ chối bid');
      await loadBids();
      if (action === 'ACCEPTED') {
        const acceptedBid = data?.bids.find((b) => b.id === bidId);
        if (acceptedBid) setCreateContractBid(acceptedBid);
        onBidAccepted?.();
      }
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setActionLoading(null);
      setConfirmAccept(null);
    }
  };

  const toggleCompare = (bidId: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(bidId)
        ? prev.filter((id) => id !== bidId)
        : prev.length < 4
        ? [...prev, bidId]
        : prev,
    );
  };

  const filteredBids = (data?.bids ?? []).filter(
    (b) => filterStatus === 'ALL' || b.status === filterStatus,
  );

  const compareableBids = (data?.bids ?? []).filter((b) =>
    selectedForCompare.includes(b.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        Đang tải danh sách bids...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">
            {jobTitle} — {data.totalBids} Bid{data.totalBids !== 1 ? 's' : ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.auctionType === 'SEALED_BID' ? 'Sealed Bid' : 'Open Bid'} · Xếp hạng AHP-TOPSIS
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700"
            >
              <GitCompare size={13} /> So sánh ({selectedForCompare.length})
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : STATUS_LABELS[s]?.label ?? s}
            <span className="ml-1 opacity-70">
              ({s === 'ALL' ? data.totalBids : data.bids.filter((b) => b.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Bids list */}
      {filteredBids.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">Không có bid nào.</div>
      ) : (
        <div className="space-y-3">
          {filteredBids.map((bid) => {
            const st = STATUS_LABELS[bid.status] ?? { label: bid.status, color: 'bg-slate-100 text-slate-600' };
            const isExpanded = expandedBid === bid.id;
            const isSelected = selectedForCompare.includes(bid.id);
            const isActive = bid.status === 'PENDING' || bid.status === 'SHORTLISTED';

            return (
              <div
                key={bid.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  isSelected ? 'border-purple-400 ring-1 ring-purple-200' : 'border-slate-200'
                }`}
              >
                {/* Rank badge + summary */}
                <div className="p-4 flex items-start gap-3">
                  {/* Rank badge */}
                  <div
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                      bid.rank === 1
                        ? 'bg-amber-400 text-white'
                        : bid.rank === 2
                        ? 'bg-slate-400 text-white'
                        : bid.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{bid.rank}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setProfileModal({ bidId: bid.id })}
                        className="font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors text-left"
                      >
                        {bid.freelancer.fullName}
                      </button>
                      {bid.freelancer.assessmentLevel && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {bid.freelancer.assessmentLevel}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <DollarSign size={13} className="text-emerald-500" />
                        ${bid.amount.toLocaleString()}
                      </span>
                      {bid.days && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-blue-400" />
                          {bid.days} ngày
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <Star size={13} className="text-blue-500" />
                        {(bid.topsisScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    {bid.freelancer.skills.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {bid.freelancer.skills.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Compare toggle */}
                    {isActive && (
                      <button
                        onClick={() => toggleCompare(bid.id)}
                        title="So sánh"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-purple-100 text-purple-600'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <GitCompare size={14} />
                      </button>
                    )}

                    {/* Shortlist */}
                    {isActive && (
                      <button
                        onClick={() => handleShortlist(bid.id)}
                        disabled={actionLoading === bid.id}
                        title={bid.status === 'SHORTLISTED' ? 'Bỏ shortlist' : 'Shortlist'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          bid.status === 'SHORTLISTED'
                            ? 'bg-amber-100 text-amber-600'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Bookmark size={14} />
                      </button>
                    )}

                    {/* View profile */}
                    <button
                      onClick={() => setProfileModal({ bidId: bid.id })}
                      title="Xem hồ sơ"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Accept */}
                    {isActive && (
                      <button
                        onClick={() => setConfirmAccept(bid.id)}
                        disabled={actionLoading === bid.id}
                        title="Chấp nhận"
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}

                    {/* Reject */}
                    {isActive && (
                      <button
                        onClick={() => handleDecide(bid.id, 'REJECTED')}
                        disabled={actionLoading === bid.id}
                        title="Từ chối"
                        className="p-1.5 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedBid(isExpanded ? null : bid.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cover letter */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Cover Letter</p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {bid.coverLetter ?? 'Không có cover letter.'}
                      </p>
                    </div>

                    {/* Score breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Điểm chi tiết
                      </p>
                      <BidScoreChart
                        breakdown={bid.scoreBreakdown}
                        topsisScore={bid.topsisScore}
                        weights={data.weights}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Accept confirm overlay */}
      {confirmAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-2">Xác nhận chấp nhận bid</h3>
            <p className="text-sm text-slate-600 mb-4">
              Hành động này sẽ từ chối tất cả các bid còn lại và chuyển job sang trạng thái In Progress.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAccept(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDecide(confirmAccept, 'ACCEPTED')}
                disabled={!!actionLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {showCompare && compareableBids.length >= 2 && (
        <BidCompareModal
          jobId={jobId}
          selectedBids={compareableBids}
          onClose={() => setShowCompare(false)}
          onAccept={(bidId) => {
            setShowCompare(false);
            setConfirmAccept(bidId);
          }}
        />
      )}

      {/* Freelancer profile modal */}
      {profileModal && (
        <FreelancerProfileModal
          jobId={jobId}
          bidId={profileModal.bidId}
          onClose={() => setProfileModal(null)}
        />
      )}

      {/* Create contract modal (auto-shown after bid accepted) */}
      {createContractBid && (
        <CreateContractModal
          bidId={createContractBid.id}
          bidAmount={createContractBid.amount}
          jobTitle={jobTitle ?? 'Job'}
          onClose={() => setCreateContractBid(null)}
          onSuccess={() => {
            setCreateContractBid(null);
            toast.success('Hợp đồng đã sẵn sàng trong mục Hợp đồng!');
          }}
        />
      )}
    </div>
  );
}
