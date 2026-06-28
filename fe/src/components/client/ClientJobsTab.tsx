'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getJobTitle } from '@/lib/i18n/demo-content';
import { jobsApi } from '@/lib/api/jobs.api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import CreateJobModal from './CreateJobModal';
import EditJobModal from './EditJobModal';
import RankedBidsList from './RankedBidsList';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus, Lock, Unlock, Calendar, DollarSign, Send, Inbox, FolderOpen, Check } from 'lucide-react';

export default function ClientJobsTab() {
  const { t, language } = useTranslation();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
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
      const jobs = await jobsApi.findMyJobs();
      console.log('Jobs loaded:', jobs);
      setJobs(jobs);
      if (selectedJob) {
        const updatedSelected = jobs.find((j: any) => j.id === selectedJob.id);
        if (updatedSelected) {
          setSelectedJob(updatedSelected);
          fetchBidsForJob(updatedSelected.id);
        }
      }
    } catch {
      // API unavailable - use mock data
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Xây dựng Landing Page Next.js cho dự án SaaS',
          description: 'Chúng tôi cần một lập trình viên frontend dựng giao diện Landing Page chuyên nghiệp.',
          budget: 800,
          fixedBudget: 800,
          budgetFormat: 'FIXED',
          deadline: '2026-07-01',
          categoryId: 'frontend',
          auctionType: 'OPEN_BID',
          status: 'OPEN',
          skills: ['React', 'Next.js', 'Tailwind CSS'],
          createdAt: '2026-06-12',
          category: { id: 'frontend', name: 'Frontend' },
          client: { id: 'client-1', fullName: 'SaaSify Inc.', avatarUrl: null },
          _count: { bids: 4 }
        },
        {
          id: 'job-2',
          title: 'Phát triển Auth Service bằng NestJS & Redis',
          description: 'Cần thiết kế module Authentication/Authorization bảo mật cao.',
          budget: 1200,
          fixedBudget: 1200,
          budgetFormat: 'FIXED',
          deadline: '2026-06-30',
          categoryId: 'backend',
          auctionType: 'SEALED_BID',
          status: 'OPEN',
          skills: ['NestJS', 'Redis', 'PostgreSQL'],
          createdAt: '2026-06-11',
          category: { id: 'backend', name: 'Backend' },
          client: { id: 'client-2', fullName: 'Fintech Solutions', avatarUrl: null },
          _count: { bids: 2 }
        }
      ];
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const STATUS_TABS = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'];
  const filteredJobs = filterTab === 'ALL' ? jobs : jobs.filter((j) => j.status === filterTab);

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
          <Check className="w-5 h-5 text-emerald-600 bg-emerald-100 p-0.5 rounded-full shrink-0 border border-emerald-200" />
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
              <Plus className="w-3.5 h-3.5" />
              {language === 'vi' ? 'Đăng mới' : 'Post Job'}
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
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {filterTab !== 'ALL'
                  ? `No ${filterTab} jobs.`
                  : language === 'vi'
                    ? 'Bạn chưa đăng dự án nào. Nhấn "Đăng dự án mới" để bắt đầu!'
                    : 'No jobs posted yet. Click "Post New Job" to get started!'}
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
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
                      <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                        {job.auctionType === 'SEALED' || job.auctionType === 'SEALED_BID' ? (
                          <Lock className="w-3 h-3 text-slate-400" />
                        ) : (
                          <Unlock className="w-3 h-3 text-slate-400" />
                        )}
                        {job.auctionType}
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          title={t('jobs.deleteJobBtn')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                className="w-full h-9 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/30 text-blue-500 hover:text-blue-700 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {t('jobs.postJobBtn')}
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
                      <span className="flex items-center gap-1">
                        {selectedJob.auctionType === 'SEALED' || selectedJob.auctionType === 'SEALED_BID' ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {selectedJob.auctionType === 'SEALED' || selectedJob.auctionType === 'SEALED_BID'
                          ? (language === 'vi' ? 'Đấu thầu kín' : 'Sealed Bid')
                          : (language === 'vi' ? 'Đấu thầu công khai' : 'Open Bid')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {language === 'vi' ? 'Hạn:' : 'Deadline:'} {new Date(selectedJob.deadline).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {formatBudget(selectedJob)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedJob.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(selectedJob.id, 'OPEN')}
                        className="h-8 px-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {language === 'vi' ? 'Xuất bản' : 'Publish'}
                      </button>
                    )}
                    {selectedJob.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusChange(selectedJob.id, 'CLOSED')}
                        className="h-8 px-3 rounded-lg border border-amber-100 text-amber-600 hover:bg-amber-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {language === 'vi' ? 'Đóng thầu' : 'Close Job'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(selectedJob.id)}
                      className="h-8 px-3 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('jobs.deleteJobBtn')}
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

              {/* Bids section — AHP-TOPSIS ranked */}
              <div>
                <RankedBidsList
                  jobId={selectedJob.id}
                  jobTitle={getJobTitle(selectedJob.id, language, selectedJob.title)}
                  onBidAccepted={fetchJobs}
                />
              </div>
            </div>
          ) : (
            /* Empty-state right panel */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm shadow-sm flex flex-col items-center justify-center min-h-[320px] space-y-4">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
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
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {t('jobs.postJobBtn')}
              </button>
            </div>
          )}
        </div>
      </div>

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
