'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { contractsApi, CreateContractDto } from '@/lib/api/contracts.api';
import { toast } from 'sonner';

interface Props {
  bidId: string;
  bidAmount: number;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MilestoneForm {
  order: number;
  title: string;
  description: string;
  percentage: number;
  deadline: string;
  maxRevisions: number;
}

export default function CreateContractModal({ bidId, bidAmount, jobTitle, onClose, onSuccess }: Props) {
  const [description, setDescription] = useState('');
  const [customTerms, setCustomTerms] = useState('');
  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { order: 1, title: 'Milestone 1', description: '', percentage: 100, deadline: '', maxRevisions: 3 },
  ]);
  const [loading, setLoading] = useState(false);

  const totalPct = milestones.reduce((s, m) => s + m.percentage, 0);

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        title: `Milestone ${prev.length + 1}`,
        description: '',
        percentage: 0,
        deadline: '',
        maxRevisions: 3,
      },
    ]);
  };

  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));
  };

  const updateMilestone = (idx: number, field: keyof MilestoneForm, value: any) => {
    setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = async () => {
    if (Math.abs(totalPct - 100) > 0.01) {
      toast.error('Tổng % phải đúng bằng 100%');
      return;
    }
    if (milestones.some((m) => !m.deadline)) {
      toast.error('Vui lòng điền deadline cho tất cả milestones');
      return;
    }
    if (milestones.some((m) => !m.title.trim())) {
      toast.error('Vui lòng điền tên cho tất cả milestones');
      return;
    }

    setLoading(true);
    try {
      const dto: CreateContractDto = {
        bidId,
        description,
        customTerms,
        milestones: milestones.map((m) => ({
          order: m.order,
          title: m.title,
          description: m.description,
          amount: Math.round((m.percentage / 100) * bidAmount * 100) / 100,
          percentage: m.percentage,
          deadline: new Date(m.deadline).toISOString(),
          maxRevisions: m.maxRevisions,
        })),
      };
      await contractsApi.createContract(dto);
      toast.success('Hợp đồng đã được tạo thành công!');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Không thể tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-slate-900">Tạo Hợp đồng</h2>
            <p className="text-xs text-slate-500">{jobTitle} · ${bidAmount.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả hợp đồng (tùy chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả phạm vi công việc..."
            />
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Milestones</h3>
                <p className={`text-xs mt-0.5 ${Math.abs(totalPct - 100) > 0.01 ? 'text-rose-500 font-semibold' : 'text-emerald-600'}`}>
                  Tổng: {totalPct}% {Math.abs(totalPct - 100) > 0.01 ? '(phải đúng 100%)' : '✓'}
                </p>
              </div>
              {milestones.length < 10 && (
                <button
                  onClick={addMilestone}
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  <Plus size={12} /> Thêm
                </button>
              )}
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Milestone {m.order}</span>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(idx)} className="text-rose-400 hover:text-rose-600">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Tên milestone *</label>
                      <input
                        value={m.title}
                        onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">% Giá trị *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={m.percentage}
                          onChange={(e) => updateMilestone(idx, 'percentage', Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          = ${Math.round((m.percentage / 100) * bidAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Deadline *</label>
                      <input
                        type="date"
                        value={m.deadline}
                        onChange={(e) => updateMilestone(idx, 'deadline', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Số lần revision tối đa</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={m.maxRevisions}
                        onChange={(e) => updateMilestone(idx, 'maxRevisions', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Mô tả (tùy chọn)</label>
                    <input
                      value={m.description}
                      onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Mô tả deliverable..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Điều khoản bổ sung (tùy chọn)</label>
            <textarea
              value={customTerms}
              onChange={(e) => setCustomTerms(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Các điều khoản bổ sung giữa hai bên..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || Math.abs(totalPct - 100) > 0.01}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Tạo hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}
