"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { X, AlertOctagon, Star, MessageSquare } from "lucide-react";
import { Contract, contractsApi } from "@/lib/api/contracts.api";
import { createConversation } from "@/lib/api/chat.api";
import MilestoneTimeline from "./MilestoneTimeline";
import { useFreelancer } from "@/lib/hooks/useFreelancer";
import { toast } from "sonner";

interface Props {
  contract: Contract;
  userRole: "client" | "freelancer";
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Đang thực hiện",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Tranh chấp",
  CANCELLED: "Đã hủy",
};

export default function ContractDetail({
  contract,
  userRole,
  onClose,
  onRefresh,
}: Props) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [feedbackModal, setFeedbackModal] = useState<{
    milestoneId: string;
    action: "approve" | "revision" | "reject";
  } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitModal, setSubmitModal] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [qualityRating, setQualityRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(5);
  const [scopeRating, setScopeRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const executeReviewFreelancer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("review");
    try {
      await contractsApi.reviewFreelancer(contract.id, {
        qualityRating,
        commRating,
        speedRating,
        fourthRating: scopeRating,
        comment: reviewComment,
        anonymous,
      });
      toast.success("Đã gửi đánh giá freelancer thành công!");
      setShowReviewModal(false);
      onRefresh();
      useFreelancer.getState().fetchWallet();
      useFreelancer.getState().fetchTransactions();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Đánh giá thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMilestoneAction = (milestoneId: string, action: string) => {
    if (action === "submit") {
      setSubmitModal(milestoneId);
    } else if (action === "approve") {
      setFeedbackModal({ milestoneId, action: "approve" });
    } else if (action === "revision") {
      setFeedbackModal({ milestoneId, action: "revision" });
    } else if (action === "reject") {
      setFeedbackModal({ milestoneId, action: "reject" });
    }
  };

  const executeSubmit = async () => {
    if (!submitModal || !selectedFile) {
      toast.error('Vui lòng chọn file để nộp!');
      return;
    }
    setActionLoading(submitModal);
    try {
      await contractsApi.submitMilestone(contract.id, submitModal, selectedFile, submitNotes);
      toast.success("Đã nộp milestone thành công!");
      setSubmitModal(null);
      setSubmitNotes("");
      setSelectedFile(null);
      onRefresh();
      useFreelancer.getState().fetchWallet();
      useFreelancer.getState().fetchTransactions();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const executeReview = async () => {
    if (!feedbackModal) return;
    setActionLoading(feedbackModal.milestoneId);
    const actionMap = {
      approve: "APPROVED" as const,
      revision: "REVISION_REQUESTED" as const,
      reject: "REJECTED" as const,
    };
    try {
      await contractsApi.reviewMilestone(
        contract.id,
        feedbackModal.milestoneId,
        actionMap[feedbackModal.action],
        feedback,
      );
      toast.success(
        feedbackModal.action === "approve"
          ? "Đã duyệt milestone!"
          : feedbackModal.action === "revision"
            ? "Đã gửi yêu cầu sửa đổi"
            : "Đã từ chối milestone",
      );
      setFeedbackModal(null);
      setFeedback("");
      onRefresh();
      useFreelancer.getState().fetchWallet();
      useFreelancer.getState().fetchTransactions();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const executeCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    setActionLoading("cancel");
    try {
      if (userRole === "client") {
        await contractsApi.cancelClientContract(contract.id, cancelReason);
      } else {
        await contractsApi.cancelFreelancerContract(contract.id, cancelReason);
      }
      toast.success("Đã hủy hợp đồng");
      setShowCancel(false);
      onRefresh();
      useFreelancer.getState().fetchWallet();
      useFreelancer.getState().fetchTransactions();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const openChat = async () => {
    setOpeningChat(true);
    try {
      const conversation = await createConversation({
        otherUserId:
          userRole === "client" ? contract.freelancerId : contract.clientId,
        jobId: contract.jobId,
      });
      onClose();
      router.push(
        `/messages?conversation=${encodeURIComponent(conversation.id)}`,
      );
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "Không thể mở cuộc trò chuyện")
          : "Không thể mở cuộc trò chuyện",
      );
    } finally {
      setOpeningChat(false);
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
              {userRole === "client" ? "Freelancer" : "Client"}:{" "}
              {userRole === "client"
                ? contract.freelancer.fullName
                : contract.client.fullName}
              {" · "}${contract.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openChat}
              disabled={openingChat}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <MessageSquare size={14} />{" "}
              {openingChat ? "Đang mở..." : "Nhắn tin"}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Contract info */}
          {contract.description && (
            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 font-semibold mb-1">
                Mô tả hợp đồng
              </p>
              <p className="text-sm text-slate-700">{contract.description}</p>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">
              Milestones
            </h3>
            <MilestoneTimeline
              milestones={contract.milestones}
              totalAmount={contract.totalAmount}
              userRole={userRole}
              onAction={handleMilestoneAction}
              actionLoading={actionLoading}
            />
          </div>

          {/* Review Freelancer banner */}
          {contract.status === 'COMPLETED' && userRole === 'client' && !contract.freelancerReviewed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-800">Hợp đồng đã hoàn thành!</p>
                <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Vui lòng dành chút thời gian đánh giá freelancer để nâng cao chất lượng nền tảng.</p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Đánh giá ngay
              </button>
            </div>
          )}

          {/* Cancel button */}
          {["ACTIVE", "PAUSED"].includes(contract.status) && (
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
            <h3 className="font-bold text-slate-900">
              Nộp nghiệm thu milestone — FL-22
            </h3>

            {/* FL-20: progress notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ghi chú tiến độ (FL-20)
              </label>
              <textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả những gì đã hoàn thành trong milestone này..."
              />
            </div>

            {/* FL-21: Deliverables */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Sản phẩm bàn giao (FL-21)</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50/50 hover:bg-slate-50 transition-all">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="font-bold text-slate-700">
                    {selectedFile ? `✓ Đã chọn: ${selectedFile.name}` : "Kéo thả hoặc nhấp để chọn file"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ zip, pdf, docx, png, jpg (tối đa 50MB)</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setSubmitModal(null); setSelectedFile(null); }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={executeSubmit}
                disabled={!selectedFile || !!actionLoading}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "..." : "Nộp nghiệm thu"}
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
              {feedbackModal.action === "approve"
                ? "Duyệt milestone"
                : feedbackModal.action === "revision"
                  ? "Yêu cầu sửa đổi"
                  : "Từ chối milestone"}
            </h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5">
                Feedback{" "}
                {feedbackModal.action !== "approve"
                  ? "(bắt buộc)"
                  : "(tùy chọn)"}
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
                  feedbackModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : feedbackModal.action === "revision"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-rose-500 hover:bg-rose-600"
                }`}
              >
                {actionLoading ? "..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-rose-600">
              Hủy hợp đồng
            </h3>
            <p className="text-sm text-slate-600">
              Hành động này không thể hoàn tác. Các milestone chưa được duyệt sẽ
              được hoàn tiền.
            </p>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5">
                Lý do hủy *
              </label>
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
                {actionLoading ? "..." : "Hủy hợp đồng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Freelancer Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                  Đánh giá Freelancer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Đánh giá của bạn sẽ giúp cập nhật Skill Score của freelancer.</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={executeReviewFreelancer} className="space-y-4">
              <div className="space-y-3.5">
                {/* Quality */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Chất lượng bàn giao</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQualityRating(s)}
                        className="transition-all duration-150 transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${s <= qualityRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Giao tiếp & Phối hợp</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCommRating(s)}
                        className="transition-all duration-150 transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${s <= commRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Tốc độ hoàn thành</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeedRating(s)}
                        className="transition-all duration-150 transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${s <= speedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope compliance */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Tuân thủ phạm vi công việc</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScopeRating(s)}
                        className="transition-all duration-150 transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${s <= scopeRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nhận xét chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm làm việc với freelancer này..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans transition-all"
                />
              </div>

              {/* Anonymous check */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4 transition-all"
                />
                <span className="text-xs text-slate-500 font-bold">Ẩn danh tính của tôi</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'review'}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {actionLoading === 'review' ? '...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
