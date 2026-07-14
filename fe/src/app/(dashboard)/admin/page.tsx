'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import {
  Shield, Loader2, LayoutDashboard, Users, Briefcase, AlertTriangle,
  Tags, DollarSign, Settings, GraduationCap,
} from 'lucide-react';
import DashboardOverview from '@/features/admin/DashboardOverview';
import UserManagement from '@/features/admin/UserManagement';
import JobManagement from '@/features/admin/JobManagement';
import ReportManagement from '@/features/admin/ReportManagement';
import CategorySkillManagement from '@/features/admin/CategorySkillManagement';
import TransactionManagement from '@/features/admin/TransactionManagement';
import SystemConfigPanel from '@/features/admin/SystemConfigPanel';
import AssessmentManagement from '@/features/admin/AssessmentManagement';

const TABS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'reports', label: 'Reports', icon: AlertTriangle },
  { id: 'categories', label: 'Category & Skill', icon: Tags },
  { id: 'transactions', label: 'Giao dịch', icon: DollarSign },
  { id: 'config', label: 'Cấu hình', icon: Settings },
  { id: 'assessment', label: 'Assessment', icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab') as TabId | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login/admin'); return; }
    if (user && !user.roles.includes('ADMIN') && !user.roles.includes('MODERATOR')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-[#f4f7fb] min-h-[calc(100vh-5rem)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">Quản trị nền tảng BidWise</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-6 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'jobs' && <JobManagement />}
          {activeTab === 'reports' && <ReportManagement />}
          {activeTab === 'categories' && <CategorySkillManagement />}
          {activeTab === 'transactions' && <TransactionManagement />}
          {activeTab === 'config' && <SystemConfigPanel />}
          {activeTab === 'assessment' && <AssessmentManagement />}
        </div>
      </main>
    </div>
  );
}
