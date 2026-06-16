'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFreelancer, Bid } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getJobTitle } from '@/lib/i18n/demo-content';
import { jobsApi } from '@/lib/api/jobs.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import CreateJobModal from './CreateJobModal';
import EditJobModal from './EditJobModal';
import { toast } from 'sonner';

export default function ClientJobsTab() {
  const { bids, simulateClientAcceptBid } = useFreelancer();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.findMyJobs();
      setJobs(data);
      if (selectedJob) {
        const updatedSelected = data.find((j: any) => j.id === selectedJob.id);
        if (updatedSelected) setSelectedJob(updatedSelected);
      }
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Get bids for a specific job
  const getBidsForJob = (jobId: string) =>
    bids.filter((b) => b.jobId === jobId && b.status !== 'WITHDRAWN');

  const STATUS_TABS = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'];
  const filteredJobs = filterTab === 'ALL' ? jobs : jobs.filter((j) => j.status === filterTab);

  const handleAcceptBid = (bidId: string) => {
    simulateClientAcceptBid(bidId);
    setSuccessMsg(
      language === 'vi'
        ? 'Đã phê duyệt đề xuất thầu thành công! Hợp đồng mới đã được khởi tạo và số tiền đã được chuyển vào Ký quỹ (Escrow).'
        : 'Bid accepted! A new contract has been created and funds moved to Escrow.'
    );
    setSelectedBid(null);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const executeDelete = async (id: string) => {
    try {
      await jobsApi.remove(id);
      toast.success('Job deleted successfully');
      fetchJobs();
      if (selectedJob?.id === id) setSelectedJob(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleDeleteJob = (jobId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Job',
      message: 'Are you sure you want to delete this job? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => executeDelete(jobId),
    });
  };

  const executeStatusChange = async (id: string, newStatus: string) => {
    try {
      await jobsApi.update(id, { status: newStatus as any });
      toast.success('Job status updated');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const isPublish = newStatus === 'OPEN';
    setConfirmModal({
      isOpen: true,
      title: isPublish ? 'Publish Job' : 'Close Job',
      message: isPublish ? 'Are you sure you want to publish this job? Freelancers will be able to start bidding immediately.' : 'Are you sure you want to close this job? Freelancers will no longer be able to submit bids.',
      type: isPublish ? 'success' : 'warning',
      confirmText: isPublish ? 'Publish' : 'Close Job',
      onConfirm: () => executeStatusChange(id, newStatus),
    });
  };

  const formatBudget = (job: any) => {
    if (job.budgetFormat === 'HOURLY') return `$${job.minBudget} - $${job.maxBudget}/hr`;
    if (job.budgetFormat === 'FIXED_RANGE') return `$${job.minBudget} - $${job.maxBudget}`;
    return `$${job.fixedBudget || 0}`;
  };

  // Mock freelancer avatars/info keyed by bidId
  const mockFreelancers: Record<string, { name: string; avatar: string; title: string; rating: string }> = {
    'bid-1': { name: 'Nguyễn Văn Nam',  avatar: '👨‍💻', title: 'Senior Frontend Engineer', rating: '4.9 ⭐ (42 reviews)' },
    'bid-2': { name: 'Trần Minh Hoàng', avatar: '⚡',   title: 'Backend Tech Lead',       rating: '4.8 ⭐ (36 reviews)' },
    'bid-3': { name: 'Lê Thị Hồng',     avatar: '📱',   title: 'React Native Developer',  rating: '4.9 ⭐ (19 reviews)' },
  };
  const getFreelancer = (bidId: string) =>
    mockFreelancers[bidId] ?? { name: 'BidWise Freelancer', avatar: '👤', title: 'Professional Freelancer', rating: '5.0 ⭐ (1 review)' };

  const getCategoryColor = (categoryName: string) => {
    const map: Record<string, string> = {
      'Web Development': 'bg-blue-50 text-blue-700 border-blue-100',
      'Mobile Development': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Design': 'bg-violet-50 text-violet-700 border-violet-100',
    };
    return map[categoryName] || 'bg-indigo-50 text-indigo-700 border-indigo-100';
  };

  return (
    <div className="space-y-5">
      {/* Success toast */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xl shrink-0">✅</span>
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: jobs list ─────────────────────────────── */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-0 h-fit">
          {/* Panel header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm">
              {language === 'vi' ? 'Dự án đã đăng' : 'My Posted Jobs'}
              <span className="ml-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {jobs.length}
              </span>
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold transition-colors shadow-sm shadow-blue-600/30 flex items-center gap-1"
            >
              + {language === 'vi' ? 'Đăng mới' : 'Post Job'}
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="px-4 pt-2 pb-0 flex gap-1 overflow-x-auto scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                  filterTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
                {tab === 'ALL' ? (
                  <span className="ml-1 text-[9px] opacity-70">{jobs.length}</span>
                ) : (
                  <span className="ml-1 text-[9px] opacity-70">{jobs.filter(j => j.status === tab).length}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="px-4 py-3 space-y-2 max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 leading-relaxed">
                <p className="text-2xl mb-2">📭</p>
                {filterTab !== 'ALL'
                  ? `No ${filterTab} jobs.`
                  : language === 'vi'
                    ? 'Bạn chưa đăng dự án nào. Nhấn "+ Đăng mới" để bắt đầu!'
                    : 'No jobs posted yet. Click "+ Post Job" to get started!'}
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setSelectedBid(null); }}
                    className={`group border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                        : 'border-slate-100 bg-slate-50/40 hover:border-blue-300 hover:bg-blue-50/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug truncate max-w-[150px]">
                        {getJobTitle(job.id, language, job.title)}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          job.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-150' 
                          : job.status === 'IN_PROGRESS' || job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-150'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(job.category?.name || '')}`}>
                        {job.category?.name || 'Uncategorized'}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {job.auctionType === 'SEALED' ? '🔒' : '🔓'} {job.auctionType}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-500">
                        {t('jobs.budget')}: <strong className="text-slate-800">{formatBudget(job)}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">
                          {job._count?.bids || 0} {language === 'vi' ? 'đề xuất' : 'bids'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingJobId(job.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-600 font-black text-xs"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 font-black text-xs"
                          title={t('jobs.deleteJobBtn')}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Big CTA at bottom if no job selected */}
          {jobs.length > 0 && (
            <div className="px-4 pb-4 pt-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full h-9 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/30 text-blue-500 hover:text-blue-700 text-xs font-extrabold transition-all"
              >
                + {t('jobs.postJobBtn')}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: job detail + bids ─────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {selectedJob ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Job info header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'vi' ? 'Chi tiết dự án' : 'Job Details'} · #{selectedJob.id}
                    </span>
                    <h3 className="font-extrabold text-xl text-slate-900 mt-0.5 leading-snug">
                      {getJobTitle(selectedJob.id, language, selectedJob.title)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                      <span className={`px-2 py-0.5 rounded border font-bold ${getCategoryColor(selectedJob.category?.name || '')}`}>
                        {selectedJob.category?.name || 'Uncategorized'}
                      </span>
                      <span>{selectedJob.auctionType === 'SEALED' ? '🔒 Sealed Bid' : '🔓 Open Bid'}</span>
                      <span>📅 {language === 'vi' ? 'Hạn:' : 'Deadline:'} {new Date(selectedJob.deadline).toLocaleDateString()}</span>
                      <span>💰 {formatBudget(selectedJob)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedJob.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(selectedJob.id, 'OPEN')}
                        className="h-8 px-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors"
                      >
                        🚀 {language === 'vi' ? 'Xuất bản' : 'Publish'}
                      </button>
                    )}
                    {selectedJob.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusChange(selectedJob.id, 'CANCELLED')}
                        className="h-8 px-3 rounded-lg border border-amber-100 text-amber-600 hover:bg-amber-50 text-xs font-bold transition-colors"
                      >
                        🔒 {language === 'vi' ? 'Đóng thầu' : 'Close Job'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(selectedJob.id)}
                      className="h-8 px-3 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold transition-colors shrink-0"
                    >
                      🗑 {t('jobs.deleteJobBtn')}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{selectedJob.description}</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedJob.skills?.map((s: any) => (
                    <span key={s.id || s.name || s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bids section */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                  {language === 'vi' ? 'Hồ sơ ứng tuyển' : 'Proposals Received'}
                  <span className="ml-1.5 font-bold text-blue-600 normal-case text-xs">
                    ({getBidsForJob(selectedJob.id).length})
                  </span>
                </h4>

                {getBidsForJob(selectedJob.id).length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 space-y-1">
                    <p className="text-2xl">📬</p>
                    <p>{language === 'vi' ? 'Chưa có đề xuất thầu nào cho dự án này.' : 'No bids received for this project yet.'}</p>
                    <p className="text-[10px]">{language === 'vi' ? 'Freelancers sẽ sớm gửi đề xuất sau khi dự án được đăng.' : 'Freelancers will start submitting proposals shortly.'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getBidsForJob(selectedJob.id).map((bid) => {
                      const fl = getFreelancer(bid.id);
                      const isAccepted = bid.status === 'ACCEPTED';
                      const scoreColor =
                        bid.matchingScore >= 75 ? 'text-green-600 bg-green-50 border-green-100'
                        : bid.matchingScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-100'
                        : 'text-slate-500 bg-slate-50 border-slate-200';

                      return (
                        <div
                          key={bid.id}
                          className={`border rounded-xl p-4 transition-all ${
                            isAccepted ? 'border-green-400 bg-green-50/10' : 'border-slate-150 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            {/* Freelancer info */}
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                                {fl.avatar}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm">{fl.name}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold">{fl.title}</p>
                                <p className="text-[9px] text-amber-500 font-semibold">{fl.rating}</p>
                              </div>
                            </div>

                            {/* AHP Score */}
                            <div className="text-right shrink-0">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AHP MATCH</p>
                              <span className={`inline-block font-black text-xs px-2 py-0.5 rounded border mt-0.5 ${scoreColor}`}>
                                {bid.matchingScore}%
                              </span>
                            </div>
                          </div>

                          {/* Bid details */}
                          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5 my-3">
                            <div>
                              <span className="text-slate-400">{language === 'vi' ? 'Giá chào thầu' : 'Proposed'}</span>
                              <p className="font-bold text-slate-800 mt-0.5">${bid.amount.toLocaleString()} USD</p>
                            </div>
                            <div>
                              <span className="text-slate-400">{language === 'vi' ? 'Thời gian' : 'Delivery'}</span>
                              <p className="font-bold text-slate-800 mt-0.5">{bid.days} {t('common.days')}</p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 italic line-clamp-2">"{bid.coverLetter}"</p>

                          {/* Actions */}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => setSelectedBid(bid)}
                              className="text-xs text-blue-600 font-bold hover:underline"
                            >
                              {language === 'vi' ? '↗ Xem chi tiết đề xuất' : '↗ View full proposal'}
                            </button>

                            {!isAccepted && bid.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptBid(bid.id)}
                                  className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                                >
                                  ✓ {language === 'vi' ? 'Phê duyệt' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => alert(language === 'vi' ? 'Đã từ chối đề xuất.' : 'Proposal rejected.')}
                                  className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                                >
                                  {language === 'vi' ? 'Từ chối' : 'Reject'}
                                </button>
                              </div>
                            ) : isAccepted ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg">
                                ✓ {language === 'vi' ? 'Đã chọn' : 'Accepted'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty-state right panel */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm shadow-sm flex flex-col items-center justify-center min-h-[320px] space-y-4">
              <div className="text-5xl">📂</div>
              <div className="space-y-1.5">
                <p className="font-bold text-slate-700">
                  {language === 'vi' ? 'Chọn dự án để xem chi tiết' : 'Select a job to view details'}
                </p>
                <p className="text-xs text-slate-400">
                  {language === 'vi'
                    ? 'Nhấn vào một dự án bên trái để xem các đề xuất thầu và điểm AHP-TOPSIS.'
                    : 'Click a job on the left to review proposals and AHP-TOPSIS match scores.'}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
              >
                + {t('jobs.postJobBtn')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BID DETAIL MODAL ─────────────────────────────────── */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {language === 'vi' ? 'Chi tiết Đề xuất Đấu thầu' : 'Proposal Details'}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Bid ID: {selectedBid.id}</p>
              </div>
              <button onClick={() => setSelectedBid(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            {/* AHP analysis */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-150 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Điểm AHP-TOPSIS</span>
                <span className="font-black text-blue-600 text-sm">{selectedBid.matchingScore}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${selectedBid.matchingScore}%` }} />
              </div>
              <div className="space-y-1 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700 text-xs">💡 {language === 'vi' ? 'Phân tích từ hệ thống:' : 'System AHP analysis:'}</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>{language === 'vi' ? 'Kỹ năng:' : 'Skills:'}</strong> {language === 'vi' ? 'Freelancer đáp ứng yêu cầu kỹ năng (+50%)' : 'Freelancer meets skill requirements (+50%)'}</li>
                  <li><strong>{language === 'vi' ? 'Ngân sách:' : 'Budget:'}</strong> {language === 'vi' ? 'Giá thầu phù hợp ngân sách dự án (+30%)' : 'Bid amount fits project budget (+30%)'}</li>
                  <li><strong>{language === 'vi' ? 'Tín nhiệm:' : 'Trust:'}</strong> {language === 'vi' ? 'Đã qua kiểm định Skill Assessment (+20%)' : 'Passed BidWise Skill Assessment (+20%)'}</li>
                </ul>
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-3">
              <div>
                <span className="text-slate-400">{language === 'vi' ? 'Giá đề xuất' : 'Proposed bid'}</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">${selectedBid.amount.toLocaleString()} USD</p>
              </div>
              <div>
                <span className="text-slate-400">{language === 'vi' ? 'Tiến độ cam kết' : 'Committed delivery'}</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedBid.days} {t('common.days')}</p>
              </div>
            </div>

            {/* Cover letter */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('bids.coverLetterTitle')}</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                {selectedBid.coverLetter}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedBid(null)}
                className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 text-sm transition-colors"
              >
                {t('common.close')}
              </button>
              {selectedBid.status === 'PENDING' && (
                <button
                  onClick={() => handleAcceptBid(selectedBid.id)}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  ✓ {language === 'vi' ? 'Phê duyệt thầu' : 'Accept Bid'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMsg(t('jobs.publishJobSuccess'));
            setTimeout(() => setSuccessMsg(''), 4500);
            fetchJobs();
          }}
        />
      )}

      {editingJobId && (
        <EditJobModal
          jobId={editingJobId}
          onClose={() => setEditingJobId(null)}
          onSuccess={() => {
            fetchJobs();
            setEditingJobId(null);
          }}
        />
      )}
    </div>
  );
}
