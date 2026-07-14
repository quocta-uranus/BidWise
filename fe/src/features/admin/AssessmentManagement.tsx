'use client';

import { useState } from 'react';
import {
  useAssessmentQuestions, useAssessmentStats,
  useCreateAssessmentQuestion, useUpdateAssessmentQuestion, useDeleteAssessmentQuestion,
} from '@/hooks/useAdmin';
import { Plus, Trash2, Loader2, BarChart3 } from 'lucide-react';

export default function AssessmentManagement() {
  const { data: questions, isLoading } = useAssessmentQuestions();
  const { data: stats } = useAssessmentStats();
  const createQ = useCreateAssessmentQuestion();
  const updateQ = useUpdateAssessmentQuestion();
  const deleteQ = useDeleteAssessmentQuestion();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0 });

  const handleCreate = () => {
    const opts = form.options.filter((o) => o.trim());
    if (!form.question.trim() || opts.length < 2) return;
    createQ.mutate({
      question: form.question,
      options: opts,
      correctIndex: form.correctIndex,
      order: (questions?.length ?? 0) + 1,
    }, { onSuccess: () => { setShowForm(false); setForm({ question: '', options: ['', '', '', ''], correctIndex: 0 }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý Skill Assessment</h2>
          <p className="text-sm text-slate-500">Tạo/sửa bộ câu hỏi, xem kết quả và phân bố điểm</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase">Hoàn thành</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalCompleted}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase">Điểm trung bình</p>
            <p className="text-2xl font-bold text-slate-900">{stats.averageScore}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Phân bố level</p>
            <div className="flex gap-3 mt-1 text-sm">
              {Object.entries(stats.levelDistribution).map(([level, count]) => (
                <span key={level} className="text-slate-600">{level}: <b>{count}</b></span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(questions ?? []).map((q, idx) => (
              <div key={q.id} className={`p-4 ${!q.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">#{idx + 1}. {q.question}</p>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, i) => (
                        <p key={i} className={`text-xs ${i === q.correctIndex ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                          {String.fromCharCode(65 + i)}. {opt} {i === q.correctIndex && '✓'}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => updateQ.mutate({ id: q.id, isActive: !q.isActive })}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                      {q.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => { if (confirm('Xóa?')) deleteQ.mutate(q.id); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-semibold mb-4">Thêm câu hỏi</h3>
            <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Câu hỏi" rows={2} className="w-full border rounded-xl p-3 text-sm mb-3" />
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" checked={form.correctIndex === i} onChange={() => setForm({ ...form, correctIndex: i })} />
                <input value={opt} onChange={(e) => {
                  const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts });
                }} placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                  className="flex-1 border rounded-xl p-2 text-sm" />
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Hủy</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
