'use client';

import { useState } from 'react';
import { useFreelancer, Bid } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getJobTitle } from '@/lib/i18n/demo-content';

export default function BidsTab() {
  const { bids, editBid, cancelBid, simulateClientAcceptBid, bidPenalties } = useFreelancer();
  const { t, language } = useTranslation();

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dialog / Edit states
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);

  // Form states for editing
  const [editAmount, setEditAmount] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editError, setEditError] = useState('');

  const handleStartEdit = (bid: Bid) => {
    setEditingBid(bid);
    setEditAmount(String(bid.amount));
    setEditDays(String(bid.days));
    setEditCover(bid.coverLetter);
    setEditError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBid) return;

    const amt = Number(editAmount);
    const dys = Number(editDays);

    if (isNaN(amt) || amt <= 0) {
      setEditError(t('bids.errInvalidAmount'));
      return;
    }
    if (isNaN(dys) || dys <= 0) {
      setEditError(t('bids.errInvalidDays'));
      return;
    }

    editBid(editingBid.id, amt, dys, editCover);
    setEditingBid(null);
  };

  const handleCancelBid = (bidId: string) => {
    if (confirm(t('bids.confirmWithdraw'))) {
      cancelBid(bidId);
      if (selectedBid?.id === bidId) setSelectedBid(null);
    }
  };

  // Tính toán chỉ số thống kê
  const totalBids = bids.filter(b => b.status !== 'WITHDRAWN').length;
  const acceptedBids = bids.filter((b) => b.status === 'ACCEPTED').length;
  const winRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;
  
  const totalAmount = bids
    .filter((b) => b.status !== 'WITHDRAWN')
    .reduce((sum, b) => sum + b.amount, 0);
  const avgBidPrice = totalBids > 0 ? Math.round(totalAmount / totalBids) : 0;

  // Category breakdown data
  const categories = ['frontend', 'backend', 'mobile', 'fullstack'] as const;
  // We don't have jobCategory on bid directly, so we extract from jobId demo mapping
  // Use a simple heuristic: match jobTitle keywords to categories
  const getCategoryForBid = (bid: typeof bids[number]) => {
    const title = bid.jobTitle.toLowerCase();
    if (title.includes('mobile') || title.includes('native')) return 'mobile';
    if (title.includes('nest') || title.includes('backend') || title.includes('auth') || title.includes('api') || title.includes('redis')) return 'backend';
    if (title.includes('fullstack') || title.includes('erp') || title.includes('management')) return 'fullstack';
    return 'frontend';
  };

  const categoryBreakdown = categories.map((cat) => {
    const catBids = bids.filter((b) => getCategoryForBid(b) === cat && b.status !== 'WITHDRAWN');
    const catWon = catBids.filter((b) => b.status === 'ACCEPTED').length;
    return {
      cat,
      count: catBids.length,
      won: catWon,
      winPct: catBids.length > 0 ? Math.round((catWon / catBids.length) * 100) : 0
    };
  }).filter((d) => d.count > 0);

  // Filtered bid list
  const filteredBids = statusFilter === 'ALL'
    ? bids
    : bids.filter((b) => b.status === statusFilter);

  const categoryLabels: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    mobile: 'Mobile',
    fullstack: 'Fullstack',
  };

  return (
    <div className="space-y-6">
      {/* Penalty warning */}
      {bidPenalties >= 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-xs font-bold text-amber-800">
              {t('bids.bidPenaltyWarning', { count: String(bidPenalties) })}
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              {t('bids.cancelCount')} <strong>{bidPenalties}</strong>
            </p>
          </div>
        </div>
      )}
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bids.submitted')}</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-slate-900">{totalBids}</span>
            <span className="text-xs font-bold text-slate-400">{t('bids.excludingWithdrawn')}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bids.winRate')}</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-blue-600">{winRate}%</span>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {t('bids.projectsWon', { count: acceptedBids })}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bids.avgBidValue')}</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-black text-slate-900">${avgBidPrice}</span>
            <span className="text-xs font-bold text-slate-400">{t('bids.perProject')}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5 mb-4">
            {t('bids.categoryBreakdown')}
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((d) => (
              <div key={d.cat}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">{categoryLabels[d.cat]}</span>
                  <span className="text-slate-400">
                    {d.count} bid{d.count !== 1 ? 's' : ''} · {d.winPct}% win
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(d.winPct, d.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main bids list */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-lg text-slate-900">{t('bids.yourBids')}</h3>
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('bids.statusFilter')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{t('bids.filterAll')}</option>
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>
        
        {bids.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {t('bids.noBids')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBids.map((bid) => {
              const scoreColor =
                bid.matchingScore >= 75
                  ? 'text-green-600 bg-green-50 border-green-100'
                  : bid.matchingScore >= 50
                  ? 'text-amber-600 bg-amber-50 border-amber-100'
                  : 'text-slate-500 bg-slate-50 border-slate-150';

              const statusColor: Record<string, string> = {
                PENDING: 'bg-blue-50 text-blue-700 border-blue-100',
                SHORTLISTED: 'bg-violet-50 text-violet-700 border-violet-100',
                ACCEPTED: 'bg-green-50 text-green-700 border-green-100',
                REJECTED: 'bg-red-50 text-red-700 border-red-100',
                WITHDRAWN: 'bg-slate-100 text-slate-400 border-slate-200'
              };

              return (
                <div key={bid.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer truncate max-w-sm"
                        onClick={() => setSelectedBid(bid)}
                      >
                        {getJobTitle(bid.jobId, language, bid.jobTitle)}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor[bid.status]}`}>
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('common.client')}: <span className="font-semibold text-slate-700">{bid.clientName}</span> · {t('bids.sentOn', { date: bid.submittedAt })}
                    </p>
                    
                    <div className="flex gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400">{t('bids.proposedPrice')}</span>{' '}
                        <span className="font-bold text-slate-800">${bid.amount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">{t('bids.duration')}</span>{' '}
                        <span className="font-semibold text-slate-800">{t('common.dayUnit', { count: bid.days })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">{t('bids.matchScore')}</span>{' '}
                        <span className={`font-bold px-1.5 rounded border text-[10px] ${scoreColor}`}>{bid.matchingScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {bid.status === 'PENDING' && (
                      <>
                        {/* Demo Trigger: Client Accepts */}
                        <button
                          onClick={() => {
                            const res = simulateClientAcceptBid(bid.id);
                            if (res.success) {
                              alert(t('bids.demoAcceptAlert', { client: bid.clientName }));
                            } else {
                              if (res.error === 'INSUFFICIENT_FUNDS') {
                                alert(
                                  language === 'vi'
                                    ? 'Số dư ví của khách hàng không đủ để thực hiện ký quỹ. Vui lòng chuyển sang vai Client để nạp thêm tiền.'
                                    : 'The client\'s wallet balance is insufficient to escrow this contract. Please switch to the Client role and deposit funds first.'
                                );
                              } else {
                                alert(res.error || 'Failed to simulate accept');
                              }
                            }
                          }}
                          className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow-sm"
                          title="Demo"
                        >
                          {t('bids.simulateAccept')}
                        </button>
                        <button
                          onClick={() => handleStartEdit(bid)}
                          className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleCancelBid(bid.id)}
                          className="h-8 px-3 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg"
                        >
                          {t('bids.withdraw')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedBid(bid)}
                      className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      {t('common.detail')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BID DETAIL DIALOG */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{t('bids.bidDetail')}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{t('bids.bidId', { id: selectedBid.id })}</p>
              </div>
              <button onClick={() => setSelectedBid(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                ✕
              </button>
            </div>

            {/* Matching score breakdown */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">{t('bids.matchScoreLabel')}</span>
                <span className="font-black text-blue-600 text-sm">{selectedBid.matchingScore}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${selectedBid.matchingScore}%` }} />
              </div>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-200/50 text-[11px] text-slate-600 leading-relaxed">
                <p>{t('bids.ahpAnalysis')}</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li>{t('bids.ahpSkills')}</li>
                  <li>{t('bids.ahpBudget', { amount: selectedBid.amount })}</li>
                  <li>{selectedBid.matchingScore >= 80 ? t('bids.ahpVerified') : t('bids.ahpNotVerified')}</li>
                </ul>
              </div>
            </div>

            {/* Proposal Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-3">
              <div>
                <span className="text-slate-400">{t('bids.proposedBidPrice')}</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">${selectedBid.amount}</p>
              </div>
              <div>
                <span className="text-slate-400">{t('bids.committedTime')}</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{t('bids.completedIn', { days: selectedBid.days })}</p>
              </div>
            </div>

            {/* Cover letter */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('bids.coverLetterTitle')}</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                {selectedBid.coverLetter}
              </div>
            </div>

            {selectedBid.fileName && (
              <div className="text-xs flex items-center gap-1.5 text-slate-500">
                <span>{t('bids.attachment')}</span>
                <span className="font-bold text-blue-600 hover:underline cursor-pointer">{selectedBid.fileName}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedBid(null)}
                className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 text-sm"
              >
                {t('common.close')}
              </button>
              {selectedBid.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleStartEdit(selectedBid);
                    setSelectedBid(null);
                  }}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
                >
                  {t('bids.editBid')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT BID MODAL */}
      {editingBid && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">{t('bids.editBidTitle')}</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">{t('jobs.bidAmount')}</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">{t('jobs.bidDays')}</label>
                  <input
                    type="number"
                    required
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">{t('bids.coverLetter')}</label>
                <textarea
                  rows={5}
                  required
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none font-sans"
                />
              </div>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{editError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBid(null)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm"
                >
                  {t('bids.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
