'use client';

import { useState, useEffect } from 'react';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useAdmin';
import { Loader2, Save } from 'lucide-react';

export default function SystemConfigPanel() {
  const { data: configs, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (configs) {
      const map: Record<string, string> = {};
      configs.forEach((c) => { map[c.key] = c.value; });
      setValues(map);
    }
  }, [configs]);

  const handleSave = () => {
    const entries = Object.entries(values).map(([key, value]) => ({ key, value }));
    updateConfig.mutate(entries);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cấu hình Hệ thống</h2>
          <p className="text-sm text-slate-500">Thiết lập tham số nền tảng</p>
        </div>
        <button onClick={handleSave} disabled={updateConfig.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50">
          {updateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu thay đổi
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {(configs ?? []).map((config) => (
          <div key={config.key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{config.label ?? config.key}</p>
              <p className="text-xs text-slate-400 font-mono">{config.key}</p>
            </div>
            <input
              value={values[config.key] ?? config.value}
              onChange={(e) => setValues({ ...values, [config.key]: e.target.value })}
              className="w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
