'use client';

import { useState } from 'react';
import { useFreelancer, Contract, Milestone } from '@/lib/hooks/useFreelancer';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getJobTitle, getMilestoneName } from '@/lib/i18n/demo-content';

export default function ContractsTab() {
  const { contracts, signContract, updateMilestoneProgress, submitMilestoneDeliverable, clientApproveMilestone, reviewClient } = useFreelancer();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  const currentRole = user?.roles[0] || 'FREELANCER'; // CLIENT | FREELANCER | ADMIN

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Deliverable form states
  const [submittingMilestone, setSubmittingMilestone] = useState<Milestone | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileNote, setFileNote] = useState('');

  // Review Form states
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [commRating, setCommRating] = useState(5);
  const [payRating, setPayRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Client rating local state simulation (client reviews freelancer)
  const [clientReviewingContractId, setClientReviewingContractId] = useState<string | null>(null);
  const [flSkillRating, setFlSkillRating] = useState(5);
  const [flSpeedRating, setFlSpeedRating] = useState(5);
  const [flCommRating, setFlCommRating] = useState(5);
  const [clientReviewNote, setClientReviewNote] = useState('');
  const [clientReviewSuccess, setClientReviewSuccess] = useState(false);

  // Action handlers
  const handleSignContract = (cId: string) => {
    signContract(cId);
    alert(t('contracts.signAlert'));
    
    // Sync local selected contract state
    if (selectedContract?.id === cId) {
      setSelectedContract({ ...selectedContract, status: 'ACTIVE' });
    }
  };

  const handleProgressSliderChange = (cId: string, mId: string, value: number) => {
    updateMilestoneProgress(cId, mId, value);
    
    // Sync local selected contract state
    if (selectedContract?.id === cId) {
      setSelectedContract({
        ...selectedContract,
        milestones: selectedContract.milestones.map((m) =>
          m.id === mId ? { ...m, progress: value } : m
        )
      });
    }
  };

  const handleOpenDeliverableModal = (ms: Milestone) => {
    setSubmittingMilestone(ms);
    setFileName('');
    setFileNote('');
  };

  const handleSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !submittingMilestone || !fileName) return;

    submitMilestoneDeliverable(selectedContract.id, submittingMilestone.id, fileName, fileNote);

    // Sync local selected contract state
    setSelectedContract({
      ...selectedContract,
      milestones: selectedContract.milestones.map((m) =>
        m.id === submittingMilestone.id
          ? {
              ...m,
              progress: 100,
              status: 'SUBMITTED' as const,
              deliverable: fileName,
              deliverableDesc: fileNote
            }
          : m
      )
    });

    setSubmittingMilestone(null);
  };

  const handleClientApproveMilestone = (cId: string, mId: string) => {
    clientApproveMilestone(cId, mId);

    // Sync local selected contract state
    const currentC = useFreelancer.getState().contracts.find((c) => c.id === cId);
    if (currentC) {
      setSelectedContract(currentC);
    }
    
    if (currentRole === 'CLIENT') {
      alert(
        language === 'vi'
          ? 'Nghiệm thu cột mốc thành công! Khoản ký quỹ đã được giải ngân về ví của freelancer.'
          : 'Milestone approved successfully! Funds have been released to the freelancer\'s wallet.'
      );
    } else {
      alert(t('contracts.approveAlert'));
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContractId) return;

    reviewClient(reviewContractId);
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewContractId(null);
      setCommRating(5);
      setPayRating(5);
      setClarityRating(5);
      setReviewNote('');
      
      // Sync local state
      if (selectedContract?.id === reviewContractId) {
        setSelectedContract({ ...selectedContract, clientReviewed: true });
      }
    }, 1200);
  };

  const handleClientReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientReviewingContractId) return;

    setClientReviewSuccess(true);
    setTimeout(() => {
      setClientReviewSuccess(false);
      setClientReviewingContractId(null);
      setFlSkillRating(5);
      setFlSpeedRating(5);
      setFlCommRating(5);
      setClientReviewNote('');
      
      // Set reviews state simulated
      if (selectedContract?.id === clientReviewingContractId) {
        setSelectedContract({ ...selectedContract, clientReviewed: true }); // Use same flag for simplicity
      }
    }, 1200);
  };

  // Filter contracts by role:
  // - Admin sees everything.
  // - Freelancer and Client see all contracts in our mock database for convenience.
  const displayContracts = contracts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contracts Sidebar List */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
        <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2.5">
          {currentRole === 'ADMIN' 
            ? (language === 'vi' ? 'Hợp đồng toàn hệ thống' : 'All System Contracts')
            : t('contracts.myContracts')}
        </h3>

        {displayContracts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs leading-relaxed">
            {t('contracts.noContracts')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayContracts.map((c) => {
              const statusColor: Record<string, string> = {
                SIGNED: 'bg-amber-50 text-amber-700 border-amber-100',
                ACTIVE: 'bg-blue-50 text-blue-700 border-blue-100',
                COMPLETED: 'bg-green-50 text-green-700 border-green-100'
              };

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContract(c)}
                  className={`border rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-all ${
                    selectedContract?.id === c.id
                      ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                      {getJobTitle(c.jobId, language, c.jobTitle)}
                    </h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t('common.client')}: <strong className="text-slate-700">{c.clientName}</strong>
                  </p>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50 text-[10px]">
                    <div>
                      <span className="text-slate-400">{t('contracts.value')}</span>{' '}
                      <span className="font-bold text-slate-800">${c.amount}</span>
                    </div>
                    <span className="text-blue-600 font-bold hover:underline">{t('contracts.detailArrow')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-2">
        {selectedContract ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header section with actions depending on role */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('contracts.contractLabel', { id: selectedContract.id })}
                </span>
                <h3 className="font-extrabold text-xl text-slate-900 mt-1">
                  {getJobTitle(selectedContract.jobId, language, selectedContract.jobTitle)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('common.client')}:{' '}
                  <span className="font-semibold text-slate-700">{selectedContract.clientName}</span> ·{' '}
                  {t('contracts.startedOn', { date: selectedContract.createdAt })}
                </p>
              </div>

              {/* Action: Sign Contract (Freelancer Only) */}
              {selectedContract.status === 'SIGNED' && currentRole === 'FREELANCER' && (
                <button
                  onClick={() => handleSignContract(selectedContract.id)}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm animate-pulse"
                >
                  {t('contracts.signContract')}
                </button>
              )}

              {/* Action: Sign Contract status indicator (Client or Admin view) */}
              {selectedContract.status === 'SIGNED' && currentRole !== 'FREELANCER' && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-xl">
                  ⌛ {language === 'vi' ? 'Chờ Freelancer ký nhận' : 'Awaiting signature'}
                </span>
              )}

              {/* Action: Rate Client (Freelancer view when completed) */}
              {selectedContract.status === 'COMPLETED' &&
                !selectedContract.clientReviewed &&
                currentRole === 'FREELANCER' && (
                  <button
                    onClick={() => setReviewContractId(selectedContract.id)}
                    className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {t('contracts.rateClient')}
                  </button>
                )}

              {/* Action: Rate Freelancer (Client view when completed) */}
              {selectedContract.status === 'COMPLETED' &&
                !selectedContract.clientReviewed &&
                currentRole === 'CLIENT' && (
                  <button
                    onClick={() => setClientReviewingContractId(selectedContract.id)}
                    className="h-9 px-4 bg-amber-500 hover:bg-amber-650 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    ⭐ {language === 'vi' ? 'Đánh giá Freelancer' : 'Rate Freelancer'}
                  </button>
                )}
            </div>

            {/* Price Escrow Info Cards */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-3">
              <div>
                <span className="text-slate-400">{t('contracts.totalValue')}</span>
                <p className="font-black text-slate-800 text-sm mt-0.5">${selectedContract.amount} USD</p>
              </div>
              <div>
                <span className="text-slate-400">{t('contracts.escrowStatus')}</span>
                <p className="font-semibold text-green-600 text-sm mt-0.5">{t('contracts.escrowFull')}</p>
              </div>
            </div>

            {/* Milestones timeline */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{t('contracts.milestones')}</h4>

              {selectedContract.status === 'SIGNED' ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 border rounded-xl">
                  {currentRole === 'FREELANCER' 
                    ? t('contracts.needSign')
                    : (language === 'vi' ? 'Hợp đồng chưa được kích hoạt cho đến khi freelancer ký.' : 'Contract is inactive until the freelancer signs.')}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedContract.milestones.map((ms, idx) => {
                    const isFreelancer = currentRole === 'FREELANCER';
                    const isClient = currentRole === 'CLIENT';

                    return (
                      <div key={ms.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        {/* Milestone info */}
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs">
                              {t('contracts.milestoneN', { n: idx + 1, name: getMilestoneName(ms, language) })}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">{t('contracts.milestoneValue', { amount: ms.amount })}</p>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            ms.status === 'ACCEPTED'
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : ms.status === 'SUBMITTED'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {ms.status === 'ACCEPTED' 
                              ? t('milestoneStatus.paid') 
                              : ms.status === 'SUBMITTED' 
                              ? t('milestoneStatus.awaiting') 
                              : t('milestoneStatus.notSubmitted')}
                          </span>
                        </div>

                        {/* Progress slider (Freelancer Only, while PENDING) */}
                        {ms.status === 'PENDING' && isFreelancer && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>{t('contracts.progress')}</span>
                              <span className="text-blue-600">{ms.progress}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={ms.progress}
                              onChange={(e) => handleProgressSliderChange(selectedContract.id, ms.id, Number(e.target.value))}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}

                        {/* Progress Display (Client/Admin, or Freelancer if NOT pending) */}
                        {(ms.status !== 'PENDING' || !isFreelancer) && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>{t('contracts.progress')}</span>
                              <span>{ms.status === 'ACCEPTED' || ms.status === 'SUBMITTED' ? 100 : ms.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${ms.status === 'ACCEPTED' || ms.status === 'SUBMITTED' ? 100 : ms.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Deliverable submission action (Freelancer Only) */}
                        {ms.status === 'PENDING' && ms.progress === 100 && isFreelancer && (
                          <button
                            onClick={() => handleOpenDeliverableModal(ms)}
                            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                          >
                            {t('contracts.submitDeliverable')}
                          </button>
                        )}

                        {/* Deliverable display and Approve action (Client Only) */}
                        {ms.status === 'SUBMITTED' && (
                          <div className="space-y-2 bg-white/70 border border-slate-100 p-2.5 rounded-lg text-[10px]">
                            <p className="text-slate-400">
                              {t('contracts.fileLabel')} <span className="font-semibold text-slate-700">{ms.deliverable}</span>
                            </p>
                            {ms.deliverableDesc && (
                              <p className="text-slate-400">
                                {t('contracts.noteLabel')} <span className="text-slate-650 italic">"{ms.deliverableDesc}"</span>
                              </p>
                            )}

                            {/* Client Approval Action */}
                            {isClient && (
                              <button
                                onClick={() => handleClientApproveMilestone(selectedContract.id, ms.id)}
                                className="w-full h-7 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded shadow-sm mt-1.5 transition-colors"
                              >
                                💸 {language === 'vi' ? 'Phê duyệt & Giải ngân' : 'Approve & Release Payment'}
                              </button>
                            )}

                            {/* Freelancer Demo/Simulate approval button */}
                            {isFreelancer && (
                              <button
                                onClick={() => handleClientApproveMilestone(selectedContract.id, ms.id)}
                                className="w-full h-7 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded shadow-sm mt-1.5"
                              >
                                {t('contracts.demoApprove')}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Accepted display message */}
                        {ms.status === 'ACCEPTED' && (
                          <div className="text-[10px] text-green-700 font-semibold flex items-center gap-1 bg-green-50/50 p-2 rounded">
                            {language === 'vi' 
                              ? `✓ Cột mốc hoàn thành. Đã thanh toán $${ms.amount} USD.`
                              : `✓ Milestone completed. $${ms.amount} USD paid.`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm shadow-sm h-full flex flex-col justify-center items-center">
            {t('contracts.selectContract')}
          </div>
        )}
      </div>

      {/* FREELANCER: DELIVERABLE UPLOAD MODAL */}
      {submittingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{t('contracts.deliverableTitle')}</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {t('contracts.deliverableMilestone', { name: getMilestoneName(submittingMilestone, language) })}
              </p>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">{t('contracts.filePath')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('contracts.filePathPlaceholder')}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">{t('contracts.clientNote')}</label>
                <textarea
                  rows={4}
                  placeholder={t('contracts.clientNotePlaceholder')}
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingMilestone(null)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm"
                >
                  {t('contracts.submitReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FREELANCER: CLIENT RATING REVIEW DIALOG */}
      {reviewContractId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">{t('contracts.rateClientTitle')}</h3>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-3">
                <span className="text-3xl block">⭐</span>
                <p className="font-bold text-green-600">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">{t('contracts.cooperation')}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCommRating(star)}
                          className={`text-base ${star <= commRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">{t('contracts.payment')}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setPayRating(star)}
                          className={`text-base ${star <= payRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">{t('contracts.clarity')}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setClarityRating(star)}
                          className={`text-base ${star <= clarityRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">{t('contracts.reviewNote')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('contracts.reviewPlaceholder')}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500/20"
                  />
                  <label htmlFor="anon" className="text-slate-500 font-semibold cursor-pointer">
                    {t('contracts.anonymous')}
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewContractId(null)}
                    className="h-9 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    {t('contracts.sendReview')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CLIENT: FREELANCER RATING REVIEW DIALOG */}
      {clientReviewingContractId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">
              {language === 'vi' ? 'Đánh giá Freelancer' : 'Rate Freelancer'}
            </h3>

            {clientReviewSuccess ? (
              <div className="py-8 text-center space-y-3">
                <span className="text-3xl block">⭐</span>
                <p className="font-bold text-green-600">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleClientReviewSubmit} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Kỹ năng chuyên môn:' : 'Professional Skills:'}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFlSkillRating(star)}
                          className={`text-base ${star <= flSkillRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Tiến độ & Hạn chót:' : 'Deadline & Speed:'}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFlSpeedRating(star)}
                          className={`text-base ${star <= flSpeedRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Giao tiếp & Trao đổi:' : 'Communication:'}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFlCommRating(star)}
                          className={`text-base ${star <= flCommRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">{language === 'vi' ? 'Ghi chú nhận xét:' : 'Review comments:'}</label>
                  <textarea
                    rows={3}
                    placeholder={language === 'vi' ? 'Mô tả trải nghiệm làm việc cùng freelancer...' : 'Describe your experience working with the freelancer...'}
                    value={clientReviewNote}
                    onChange={(e) => setClientReviewNote(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClientReviewingContractId(null)}
                    className="h-9 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    {t('contracts.sendReview')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
