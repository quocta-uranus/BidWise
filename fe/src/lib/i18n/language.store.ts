'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'vi' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'bidwise-language' }
  )
);
