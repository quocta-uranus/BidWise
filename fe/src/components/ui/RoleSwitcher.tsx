'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Briefcase, Cpu, Shield, ChevronDown } from 'lucide-react';

/**
 * Shows the *current* primary portal and a "switch portal" action.
 * Switching is intentionally done by logging out and routing to the
 * target portal's login page — never by mutating the local user
 * object, which was the source of the "data from a previous account
 * is still visible" bug.
 */
export default function RoleSwitcher() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Derive the active portal from the actual server-issued roles,
  // not from a local override.
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('MODERATOR');
  const isFreelancer = user.roles.includes('FREELANCER');
  const primary: 'ADMIN' | 'FREELANCER' | 'CLIENT' = isAdmin
    ? 'ADMIN'
    : isFreelancer
    ? 'FREELANCER'
    : 'CLIENT';

  const roleMeta = {
    FREELANCER: { label: t('roles.FREELANCER') ?? 'Freelancer', icon: Cpu, color: 'text-violet-500' },
    CLIENT: { label: t('roles.CLIENT') ?? 'Client', icon: Briefcase, color: 'text-blue-500' },
    ADMIN: { label: t('roles.ADMIN') ?? 'Admin', icon: Shield, color: 'text-red-500' },
  };

  const meta = roleMeta[primary];
  const Icon = meta.icon;

  // Other portals this user is *also* allowed to enter.
  const alternatives: Array<'CLIENT' | 'FREELANCER' | 'ADMIN'> = [];
  if (primary !== 'CLIENT' && user.roles.includes('CLIENT')) alternatives.push('CLIENT');
  if (primary !== 'FREELANCER' && user.roles.includes('FREELANCER'))
    alternatives.push('FREELANCER');
  if (primary !== 'ADMIN' && (user.roles.includes('ADMIN') || user.roles.includes('MODERATOR')))
    alternatives.push('ADMIN');

  async function switchTo(portal: 'CLIENT' | 'FREELANCER' | 'ADMIN') {
    setIsOpen(false);
    // Force a full re-authentication so the previous account's data
    // is wiped and the server re-validates the new portal.
    await logout();
    router.replace(`/login/${portal.toLowerCase()}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all focus:outline-none"
      >
        <Icon className={`w-4 h-4 ${meta.color}`} />
        <span className="hidden sm:inline">{meta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Cổng hiện tại
            </div>
            <div className="px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${meta.color}`} />
              <span>{meta.label}</span>
            </div>
            {alternatives.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Chuyển sang cổng khác
                </div>
                {alternatives.map((alt) => {
                  const altMeta = roleMeta[alt];
                  const AltIcon = altMeta.icon;
                  return (
                    <button
                      key={alt}
                      onClick={() => switchTo(alt)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                    >
                      <AltIcon className={`w-4 h-4 ${altMeta.color}`} />
                      <span>{altMeta.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400">(đăng xuất)</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
