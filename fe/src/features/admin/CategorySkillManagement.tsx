'use client';

import { useState } from 'react';
import {
  useAdminCategories, useAdminSkills,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateSkill, useUpdateSkill, useDeleteSkill,
} from '@/hooks/useAdmin';
import { Plus, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';

export default function CategorySkillManagement() {
  const [tab, setTab] = useState<'categories' | 'skills'>('categories');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const { data: categories, isLoading: catLoading } = useAdminCategories();
  const { data: skills, isLoading: skillLoading } = useAdminSkills();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const handleCreate = () => {
    if (!formName.trim()) return;
    if (tab === 'categories') {
      createCategory.mutate({ name: formName, description: formDesc || undefined }, {
        onSuccess: () => { setShowForm(false); setFormName(''); setFormDesc(''); },
      });
    } else {
      createSkill.mutate({ name: formName, description: formDesc || undefined }, {
        onSuccess: () => { setShowForm(false); setFormName(''); setFormDesc(''); },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Category & Skill</h2>
          <p className="text-sm text-slate-500">CRUD danh mục ngành và kỹ năng</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl">
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setTab('categories')}
          className={`pb-2 text-sm font-medium border-b-2 ${tab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
          Categories ({categories?.length ?? 0})
        </button>
        <button onClick={() => setTab('skills')}
          className={`pb-2 text-sm font-medium border-b-2 ${tab === 'skills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
          Skills ({skills?.length ?? 0})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {(tab === 'categories' ? catLoading : skillLoading) ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : tab === 'categories' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Tên</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mô tả</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Jobs</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(categories ?? []).map((c) => (
                <tr key={c.id} className={c.isHidden ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.description ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count.jobs}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => updateCategory.mutate({ id: c.id, isHidden: !c.isHidden })}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                        {c.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { if (confirm('Xóa?')) deleteCategory.mutate(c.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Tên</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(skills ?? []).map((s) => (
                <tr key={s.id} className={s.isHidden ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => updateSkill.mutate({ id: s.id, isHidden: !s.isHidden })}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">
                        {s.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { if (confirm('Xóa?')) deleteSkill.mutate(s.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Thêm {tab === 'categories' ? 'Category' : 'Skill'}</h3>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Tên"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-3" />
            <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Mô tả (tuỳ chọn)"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Hủy</button>
              <button onClick={handleCreate} disabled={!formName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
