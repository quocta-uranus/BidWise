'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useFreelancer } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import { getJobTitle } from '@/lib/i18n/demo-content';
import { jobsApi } from '@/lib/api/jobs.api';
import { Inbox } from 'lucide-react';

// Import subcomponents
import ProfileTab from '@/components/freelancer/ProfileTab';
import JobsTab from '@/components/freelancer/JobsTab';
import BidsTab from '@/components/freelancer/BidsTab';
import ContractsTab from '@/components/freelancer/ContractsTab';
import EarningsTab from '@/components/freelancer/EarningsTab';
import ClientJobsTab from '@/components/client/ClientJobsTab';
import CreateJobModal from '@/components/client/CreateJobModal';

// Client subcomponents
import ExploreFreelancersTab from '@/components/client/ExploreFreelancersTab';

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-50/10 text-blue-400 ring-blue-500/20',
  FREELANCER: 'bg-violet-50/10 text-violet-400 ring-violet-500/20',
  ADMIN: 'bg-red-50/10 text-red-400 ring-red-500/20',
  MODERATOR: 'bg-amber-50/10 text-amber-400 ring-amber-500/20',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const {
    profile,
    jobs,
    bids,
    contracts,
    wallet,
    setAvailability,
    fetchWallet,
    fetchTransactions,
    fetchContracts,
    fetchJobs,
    fetchMyBids,
  } = useFreelancer();
  const { bidTokens, bidTokensUsed, lastBidDate } = useFreelancer();
  const { t, language } = useTranslation();

  // Active Role can be changed via Role Switcher
  const activeRole = user?.roles[0] || 'FREELANCER';

  // Compute live token count
  const today = new Date().toISOString().split('T')[0];
  const usedToday = lastBidDate === today ? bidTokensUsed : 0;
  const tokensRemaining = Math.max(0, bidTokens - usedToday);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientJobs, setClientJobs] = useState<any[]>([]);

  // Fetch real client jobs for overview stats
  useEffect(() => {
    if (activeRole === 'CLIENT' && isAuthenticated) {
      jobsApi.findMyJobs()
        .then(jobs => setClientJobs(jobs)) // Backend returns array directly
        .catch((err) => {
          console.log('=== CLIENT JOBS ERROR ===');
          console.log('Status:', err?.response?.status);
          console.log('Data:', JSON.stringify(err?.response?.data));
          console.log('Message:', err?.message);
          console.log('Stack:', err?.stack);
          console.log('========================');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, isAuthenticated]);

  // Sync wallet, transactions, contracts, jobs and bids from database
  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchTransactions();
      fetchContracts();
      fetchJobs();
      fetchMyBids();
    }
  }, [isAuthenticated, activeRole, fetchWallet, fetchTransactions, fetchContracts, fetchJobs, fetchMyBids]);

  // Sync tab value when role changes to avoid non-existent tab
  useEffect(() => {
    setActiveTab('overview');
  }, [activeRole]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.roles.some((r) => r === 'ADMIN' || r === 'MODERATOR')) {
      router.replace('/admin');
      return;
    }
    // SECURITY: If user doesn't have CLIENT or FREELANCER role, redirect to login
    if (!user?.roles.some((r) => r === 'CLIENT' || r === 'FREELANCER')) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  // Calculations
  const activeBids = bids.filter((b) => b.status !== 'WITHDRAWN');
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');

  let completeness = 0;
  if (profile.bio) completeness += 15;
  if (profile.hourlyRate > 0) completeness += 10;
  if (profile.phone) completeness += 15;
  if (profile.portfolio.length > 0) completeness += 20;
  if (profile.cv) completeness += 15;
  if (profile.certificates.length > 0) completeness += 10;
  if (profile.assessmentCompleted) completeness += 15;

  const tabTitles: Record<string, string> = {
    overview: t('dashboard.titleOverview'),
    jobs: activeRole === 'CLIENT' ? (language === 'vi' ? 'Quản lý dự án đã đăng' : 'Posted Jobs Management') : t('dashboard.titleJobs'),
    bids: t('dashboard.titleBids'),
    contracts: t('dashboard.titleContracts'),
    freelancers: language === 'vi' ? 'Khám phá Freelancers' : 'Explore Freelancers',
    profile: t('dashboard.titleProfile'),
    wallet: activeRole === 'CLIENT' ? (language === 'vi' ? 'Chi phí thầu & Ví tiền' : 'Billing & Wallet') : t('dashboard.titleWallet'),
  };

  const freelancerStats = [
    { label: t('dashboard.statOpenJobs'), value: String(jobs.length), icon: '📋' },
    { label: t('dashboard.statBidsSent'), value: String(activeBids.length), icon: '🎯' },
    { label: t('dashboard.statActiveContracts'), value: String(activeContracts.length), icon: '📄' },
    { label: t('dashboard.statTotalEarnings'), value: `$${wallet.totalEarned}`, icon: '💰' },
  ];

  // Real stats from backend
  const totalBidsReceived = clientJobs.reduce((sum, j) => sum + (j._count?.bids || 0), 0);
  const openJobs = clientJobs.filter((j) => j.status === 'OPEN').length;
  const clientStats = [
    { label: language === 'vi' ? 'Dự án đã đăng' : 'Jobs Posted', value: String(clientJobs.length), icon: '📋' },
    { label: language === 'vi' ? 'Số thầu nhận được' : 'Bids Received', value: String(totalBidsReceived), icon: '🎯' },
    { label: language === 'vi' ? 'Hợp đồng đang chạy' : 'Active Contracts', value: String(activeContracts.length), icon: '📄' },
    { label: language === 'vi' ? 'Đang giữ Ký quỹ (Escrow)' : 'Escrow Hold', value: `$${wallet.escrow}`, icon: '🛡️' },
  ];

  const stats = activeRole === 'CLIENT' ? clientStats : freelancerStats;

  const freelancerNav = [
    {
      id: 'overview',
      name: t('dashboard.tabOverview'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'jobs',
      name: t('dashboard.tabJobs'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'bids',
      name: t('dashboard.tabBids'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'contracts',
      name: t('dashboard.tabContracts'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      name: t('dashboard.tabProfile'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'wallet',
      name: t('dashboard.tabWallet'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  const clientNav = [
    {
      id: 'overview',
      name: t('dashboard.tabOverview'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'jobs',
      name: language === 'vi' ? 'Quản lý dự án' : 'My Posted Jobs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'contracts',
      name: t('dashboard.tabContracts'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'freelancers',
      name: language === 'vi' ? 'Khám phá Freelancers' : 'Find Freelancers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'wallet',
      name: language === 'vi' ? 'Quản lý Tài chính' : 'Finance & Billing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  const navItems = activeRole === 'CLIENT' ? clientNav : freelancerNav;

  // Helper component to render sidebar contents (used twice for desktop/mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-indigo-950/40 gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white font-black text-base tracking-wider">B</span>
        </div>
        <div>
          <span className="font-extrabold text-white text-lg tracking-tight bg-gradient-to-r from-blue-100 to-indigo-200 bg-clip-text text-transparent">BidWise</span>
          <p className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase leading-none mt-0.5">
            {activeRole === 'CLIENT' ? 'Client Portal' : t('dashboard.portalSubtitle')}
          </p>
        </div>
      </div>

      {/* User Mini Profile Quick Card */}
      <div className="px-5 py-5 border-b border-indigo-950/40 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 p-0.5 overflow-hidden bg-slate-900 flex-shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-black shadow-inner">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-tight truncate">{user.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold ring-1 ring-inset ${roleColors[role] ?? 'bg-slate-800 text-slate-400'}`}
                >
                  {t(`roles.${role}` as 'roles.CLIENT') ?? role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Completeness Rating bar (Freelancer Only) */}
        {activeRole === 'FREELANCER' && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="text-slate-400">{t('dashboard.profileComplete')}</span>
              <span className="text-blue-400 font-bold">{completeness}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        )}

        {/* Available for work switch (Freelancer Only) */}
        {activeRole === 'FREELANCER' && (
          <div className="mt-4 flex items-center justify-between bg-slate-900/60 border border-indigo-950/40 px-3 py-2 rounded-xl text-[10px] font-bold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${profile.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              {t('dashboard.availableForWork')}
            </span>
            <button
              onClick={() => setAvailability(!profile.available)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                profile.available ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  profile.available ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tab Menu List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-150 border-l-4 ${
                isActive
                  ? 'border-blue-500 bg-blue-500/10 text-white font-extrabold shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-850 hover:border-slate-800'
              }`}
            >
              <div className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-350'}>
                {item.icon}
              </div>
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer details */}
      <div className="p-4 border-t border-indigo-950/40 bg-slate-950/20 text-[9px] text-slate-500 font-semibold space-y-2">
        {activeRole === 'FREELANCER' ? (
          <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded-lg border border-indigo-950/20">
            <span>{t('dashboard.bidQuota')}</span>
            <span className={`font-bold text-xs ${tokensRemaining <= 2 ? 'text-red-400' : 'text-slate-300'}`}>
              {t('dashboard.bidQuotaLive', { remaining: String(tokensRemaining), total: String(bidTokens) })}
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded-lg border border-indigo-950/20">
            <span>🛡️ Escrow Guarantee</span>
            <span className="text-emerald-400 font-bold">Secured</span>
          </div>
        )}
        <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded-lg border border-indigo-950/20">
          <span>{t('dashboard.trust')}</span>
          <span className="text-amber-400 font-bold">{t('dashboard.trustValue')}</span>
        </div>
        <p className="text-center pt-2">{t('common.copyright')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex overflow-hidden">
      {/* Mobile Drawer Menu Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-slate-900 to-indigo-950 text-slate-200 border-r border-indigo-900/30 animate-in slide-in-from-left duration-300">
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sticky Left Sidebar Navigation */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-20 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-slate-200 border-r border-indigo-900/30">
        <SidebarContent />
      </aside>

      {/* Main viewport area (Right panel) */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen overflow-hidden">
        {/* Top Header bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dynamic Active Section Title */}
            <h2 className="font-black text-slate-900 text-base sm:text-lg leading-tight uppercase tracking-tight">
              {tabTitles[activeTab]}
            </h2>
          </div>

          {/* User Settings, RoleSwitcher, LanguageSwitcher, and Logout */}
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <LanguageSwitcher />
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-blue-50 font-bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">{t('common.settings')}</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-650 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </header>

        {/* Content Scroll area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Tab: Overview Panel */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions / Content */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-10 overflow-hidden relative">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transform rotate-3">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome to your Workspace</h3>
                      <p className="text-slate-500 text-base max-w-lg mx-auto md:mx-0 mb-6">
                        Manage your projects, find the best freelancers, and grow your business with our AI-powered bidding system.
                      </p>
                      
                      {user.roles.includes('CLIENT') && (
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Post a New Job
                          </button>
                          <button onClick={() => setActiveTab('jobs')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
                            View My Projects
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Welcome Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                      {t('dashboard.welcome', { name: user.fullName.split(' ').pop() ?? user.fullName })}
                    </h1>
                    <p className="text-slate-400 text-xs font-semibold tracking-wide">
                      {activeRole === 'CLIENT' 
                        ? (language === 'vi' 
                            ? `Chào mừng quay lại Client Portal. Hệ thống đang theo dõi ${activeContracts.length} hợp đồng của bạn.`
                            : `Welcome back to the Client Portal. Currently tracking ${activeContracts.length} of your contracts.`)
                        : t('dashboard.welcomeBack', { count: activeContracts.length })}
                    </p>
                  </div>
                  <div className="text-xs bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-slate-500 font-bold flex items-center gap-2">
                    <span>🟢 {t('dashboard.active')}</span>
                    <span className="text-slate-800 font-extrabold">{new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <p className="text-2xl font-black text-slate-900 mb-0.5">{stat.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick dashboard feed columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Recent thầu & contracts */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Active Contracts summary list */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700">{t('dashboard.activeContracts')}</h3>
                        <button onClick={() => setActiveTab('contracts')} className="text-xs text-blue-600 font-bold hover:underline">
                          {t('common.viewAll')}
                        </button>
                      </div>
                      {activeContracts.length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-4">{t('dashboard.noActiveContracts')}</p>
                      ) : (
                        <div className="space-y-3.5">
                          {activeContracts.map((c) => {
                            const totalMs = c.milestones.length;
                            const acceptedMs = c.milestones.filter(m => m.status === 'ACCEPTED').length;
                            const percent = totalMs > 0 ? Math.round((acceptedMs / totalMs) * 100) : 0;
                            return (
                              <div key={c.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-slate-900 text-xs">{getJobTitle(c.jobId, language, c.jobTitle)}</h4>
                                  <span className="text-[10px] text-slate-400 font-bold">{t('dashboard.contractValue', { amount: c.amount })}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                    <span>{t('dashboard.milestonesDone', { done: acceptedMs, total: totalMs })}</span>
                                    <span>{percent}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${percent}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recent Bids proposal list (Freelancer only) */}
                    {activeRole === 'FREELANCER' && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700">{t('dashboard.recentBids')}</h3>
                          <button onClick={() => setActiveTab('bids')} className="text-xs text-blue-600 font-bold hover:underline">
                            {t('common.viewAll')}
                          </button>
                        </div>
                        {activeBids.length === 0 ? (
                          <p className="text-slate-400 text-xs text-center py-4">{t('dashboard.noRecentBids')}</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {activeBids.slice(0, 3).map((bid) => (
                              <div key={bid.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                                <div>
                                  <h4 className="font-bold text-slate-800">{getJobTitle(bid.jobId, language, bid.jobTitle)}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{t('dashboard.bidPrice', { amount: bid.amount, days: bid.days })}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  bid.status === 'ACCEPTED'
                                    ? 'bg-green-50 text-green-700 border-green-150'
                                    : 'bg-blue-50 text-blue-700 border-blue-155'
                                }`}>
                                  {bid.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Client recent jobs feed */}
                    {activeRole === 'CLIENT' && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700">
                            {language === 'vi' ? 'Dự án đã đăng' : 'My Posted Jobs'}
                          </h3>
                          <button onClick={() => setActiveTab('jobs')} className="text-xs text-blue-600 font-bold hover:underline">
                            {t('common.viewAll')}
                          </button>
                        </div>
                        {clientJobs.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                            <Inbox className="w-8 h-8 text-slate-300" />
                            <p>{language === 'vi' ? 'Chưa có dự án nào. Đăng ngay!' : 'No jobs posted yet. Post one now!'}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {clientJobs.slice(0, 4).map((job: any) => (
                              <div key={job.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-800 truncate">{job.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {job.category?.name} · {job._count?.bids || 0} {language === 'vi' ? 'đề xuất' : 'bids'}
                                  </p>
                                </div>
                                <span className={`ml-3 shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  job.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : job.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : job.status === 'IN_PROGRESS' ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {job.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Recommendations & completeness */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* Setup Profile Prompt */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs">
                        {activeRole === 'CLIENT' ? (language === 'vi' ? 'Quy chuẩn Thầu' : 'Bidding Compliance') : t('dashboard.profileAnalysis')}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        {activeRole === 'CLIENT' 
                          ? (language === 'vi' 
                              ? 'Tất cả thầu được kiểm định kỹ năng, đảm bảo mức độ khớp AHP tối đa và tính toán an toàn thông qua khế ước Escrow.'
                              : 'All bids are skill-verified, ensuring high AHP matching accuracy, and backed by escrow security.')
                          : t('dashboard.profileAnalysisDesc')}
                      </p>
                      <button
                        onClick={() => setActiveTab(activeRole === 'CLIENT' ? 'freelancers' : 'profile')}
                        className="w-full h-8 bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold text-xs rounded-xl transition-all"
                      >
                        {activeRole === 'CLIENT' ? (language === 'vi' ? 'Tìm Freelancers' : 'Find Freelancers') : t('dashboard.completeProfile')}
                      </button>
                    </div>

                    {/* Skill Test Promotion (Freelancer Only) */}
                    {activeRole === 'FREELANCER' && !profile.assessmentCompleted && (
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="font-extrabold text-sm">{t('dashboard.challengeTitle')}</h4>
                        <p className="text-white/80 text-[10px] leading-relaxed">
                          {t('dashboard.challengeDesc')}
                        </p>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="w-full h-8 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl shadow-sm"
                        >
                          {t('dashboard.startTest')}
                        </button>
                      </div>
                    )}
                    
                    {/* System notification info */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">{t('dashboard.systemNotif')}</h4>
                      <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
                        <div className="flex items-start gap-2">
                          <span>📢</span>
                          <p>{t('dashboard.notifAhp')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🛡️</span>
                          <p>{t('dashboard.notifEscrow')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Job Modal for Dashboard overview */}
                {showCreateModal && (
                  <CreateJobModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => setActiveTab('jobs')}
                  />
                )}
              </div>
            )}

            {/* Freelancer Tabs */}
            {activeTab === 'jobs' && activeRole === 'FREELANCER' && <JobsTab />}
            {activeTab === 'bids' && activeRole === 'FREELANCER' && <BidsTab />}
            {activeTab === 'profile' && activeRole === 'FREELANCER' && <ProfileTab />}

            {/* Client Tabs */}
            {activeTab === 'jobs' && activeRole === 'CLIENT' && <ClientJobsTab />}
            {activeTab === 'freelancers' && activeRole === 'CLIENT' && <ExploreFreelancersTab />}

            {/* Shared Tabs */}
            {activeTab === 'contracts' && <ContractsTab />}
            {activeTab === 'wallet' && <EarningsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}