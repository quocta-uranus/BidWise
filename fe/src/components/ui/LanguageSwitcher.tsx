'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`px-2.5 py-1.5 rounded-md transition-colors ${
          language === 'vi'
            ? 'bg-blue-600 text-white'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
        aria-label="Tiếng Việt"
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1.5 rounded-md transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
