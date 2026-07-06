'use client';

import { useState } from 'react';
import { X, AlertOctagon } from 'lucide-react';
import { Contract, contractsApi } from '@/lib/api/contracts.api';
import MilestoneTimeline from './MilestoneTimeline';
import { toast } from 'sonner';

interface Props {
  contract: Contract;
  userRole: 'client' | 'freelancer';
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Tranh chấp',
  CANCELLED: 'Đã hủy',
};

export default function ContractDetail({ contract, userRole, onClose, onRefresh }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackModal, setFeedbackModal] = useState<{
    milestoneId: string;
    action: 'approve' | 'revision' | 'reject';
  } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitModal, setSubmitModal] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [deliverables, setDeliverables] = useState<{ fileName: string; fileUrl: string; description: string }[]>([
    { fileName: '', fileUrl: '', description: '' },
  ]);

  const handleMilestoneAction = (milestoneId: string, action: string) => {
    if (action === 'submit') {
      setSubmitModal(milestoneId);
    } else if (action === 'approve') {
      setFeedbackModal({ milestoneId, action: 'approve' });
    } else if (action === 'revision') {
      setFeedbackModal({ milestoneId, action: 'revision' });
    } else if (action === 'reject') {
      setFeedbackModal({ milestoneId, action: 'reject' });
    }
  };

  const executeSubmit = async () => {
    if (!submitModal) return;
    setActionLoading(submitModal);
    const validDeliverables = deliverables.filter((d) => d.fileName.trim() && d.fileUrl.trim());
    try {
      await contractsApi.submitMilestone(contract.id, submitModal, {
        freelancerNotes: submitNotes,
        deliverables: validDeliverables.length > 0 ? validDeliverables : undefined,
      });
      toast.success('Đã nộp milestone thành công!');
      setSubmitModal(null);
      setSubmitNotes('');
      setDeliverables([{ fileName: '', fileUrl: '', description: '' }]);
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const executeReview = async () => {
    if (!feedbackModal) return;
    setActionLoading(feedbackModal.milestoneId);
    const actionMap = {
      approve: 'APPROVED' as const,
      revision: 'REVISION_REQUESTED' as const,
      reject: 'REJECTED' as const,
    };
    try {
      await contractsApi.reviewMilestone(
        contract.id,
        feedbackModal.milestoneId,
        actionMap[feedbackModal.action],
        feedback,
      );
      toast.success(
        feedbackModal.action === 'approve'
          ? 'Đã duyệt milestone!'
          : feedbackModal.action === 'revision'
          ? 'Đã gửi yêu cầu sửa đổi'
          : 'Đã từ chối milestone',
      );
      setFeedbackModal(null);
      setFeedback('');
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const executeCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }
    setActionLoading('cancel');
    try {
      if (userRole === 'client') {
        await contractsApi.cancelClientContract(contract.id, cancelReason);
      } else {
        await contractsApi.cancelFreelancerContract(contract.id, cancelReason);
      }
      toast.success('Đã hủy hợp đồng');
      setShowCancel(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">{contract.title}</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {STATUS_LABELS[contract.status] ?? contract.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {userRole === 'client' ? 'Freelancer' : 'Client'}:{' '}
              {userRole === 'client' ? contract.freelancer.fullName : contract.client.fullName}
              {' · '}${contract.totalAmount.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Contract info */}
          {contract.description && (
            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 font-semibold mb-1">Mô tả hợp đồng</p>
              <p className="text-sm text-slate-700">{contract.description}</p>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Milestones</h3>
            <MilestoneTimeline
              milestones={contract.milestones}
              totalAmount={contract.totalAmount}
              userRole={userRole}
              onAction={handleMilestoneAction}
              actionLoading={actionLoading}
            />
          </div>

          {/* Cancel button */}
          {['ACTIVE', 'PAUSED'].includes(contract.status) && (
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCancel(true)}
                className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <AlertOctagon size={12} /> Hủy hợp đồng
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit milestone modal */}
      {submitModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900">Nộp nghiệm thu milestone — FL-22</h3>

            {/* FL-20: progress notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú tiến độ (FL-20)</label>
              <textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả những gì đã hoàn thành trong milestone này..."
              />
            </div>

            {/* FL-21: Deliverables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Sản phẩm bàn giao (FL-21)</label>
                <button
                  type="button"
                  onClick={() => setDeliverables((prev) => [...prev, { fileName: '', fileUrl: '', description: '' }])}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Thêm file
                </button>
              </div>
              <div className="space-y-3">
                {deliverables.map((d, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">File {idx + 1}</span>
                      {deliverables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeliverables((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-rose-400 hover:text-rose-600"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <input
                      value={d.fileName}
                      onChange={(e) => setDeliverables((prev) => prev.map((item, i) => i === idx ? { ...item, fileName: e.target.value } : item))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tên file (vd: final-design.fig)"
                    />
                    <input
                      value={d.fileUrl}
                      onChange={(e) => setDeliverables((prev) => prev.map((item, i) => i === idx ? { ...item, fileUrl: e.target.value } : item))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="URL file (Google Drive, GitHub, Figma...)"
                    />
                    <input
                      value={d.description}
                      onChange={(e) => setDeliverables((prev) => prev.map((item, i) => i === idx ? { ...item, description: e.target.value } : item))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Mô tả ngắn (tùy chọn)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setSubmitModal(null); setDeliverables([{ fileName: '', fileUrl: '', description: '' }]); }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={executeSubmit}
                disabled={!!actionLoading}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {actionLoading ? '...' : 'Nộp nghiệm thu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review milestone modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-slate-900">
              {feedbackModal.action === 'approve'
                ? 'Duyệt milestone'
                : feedbackModal.action === 'revision'
                ? 'Yêu cầu sửa đổi'
                : 'Từ chối milestone'}
            </h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5">
                Feedback {feedbackModal.action !== 'approve' ? '(bắt buộc)' : '(tùy chọn)'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhận xét của bạn..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFeedbackModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={executeReview}
                disabled={!!actionLoading}
                className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${
                  feedbackModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : feedbackModal.action === 'revision'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {actionLoading ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-rose-600">Hủy hợp đồng</h3>
            <p className="text-sm text-slate-600">
              Hành động này không thể hoàn tác. Các milestone chưa được duyệt sẽ được hoàn tiền.
            </p>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5">Lý do hủy *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Nhập lý do hủy hợp đồng..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Quay lại
              </button>
              <button
                onClick={executeCancel}
                disabled={!!actionLoading}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? '...' : 'Hủy hợp đồng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
