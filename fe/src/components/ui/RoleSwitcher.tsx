'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function RoleSwitcher() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const currentRole = user.roles[0] || 'FREELANCER';

  const roles = [
    { key: 'FREELANCER', label: t('roles.FREELANCER'), icon: '🚀' },
    { key: 'CLIENT', label: t('roles.CLIENT'), icon: '💼' },
    { key: 'ADMIN', label: t('roles.ADMIN'), icon: '🛡️' },
  ];

  const handleRoleChange = (roleKey: string) => {
    // Temporarily override user roles to switch view
    updateUser({ roles: [roleKey] });
    setIsOpen(false);
    
    if (roleKey === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all focus:outline-none"
      >
        <span>{roles.find((r) => r.key === currentRole)?.icon}</span>
        <span className="hidden sm:inline">
          {roles.find((r) => r.key === currentRole)?.label || currentRole}
        </span>
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => handleRoleChange(r.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  currentRole === r.key
                    ? 'bg-blue-50 text-blue-600 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
