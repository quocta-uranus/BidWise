'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/lib/i18n/language.store';

export default function LanguageSync() {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
