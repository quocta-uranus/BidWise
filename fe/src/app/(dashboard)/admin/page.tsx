'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useAdminUsers, useAssignRole, useRevokeRole, useSuspendUser, useUnsuspendUser } from '@/hooks/useAdminUsers';
import { useQueryClient } from '@tanstack/react-query';
import CreateUserModal from '@/features/admin/CreateUserModal';
import { Shield, Lock, Unlock, X, Loader2, Users, AlertTriangle, Plus, FileText } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin.api';
import UserList from '@/features/admin/UserList';
import RoleManager from '@/features/admin/RoleManager';
import ContractsTab from '@/components/freelancer/ContractsTab';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-600/20',
  DEACTIVATED: 'bg-slate-50 text-slate-600 ring-slate-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING_VERIFICATION: 'Pending',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase();
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'contracts'>('users');

  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useAdminUsers(
    { page, limit: 15, search: debouncedSearch || undefined },
    { enabled: !authLoading && isAuthenticated && !!user && (user.roles.includes('ADMIN') || user.roles.includes('MODERATOR')) },
  );

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login/admin'); return; }
    if (user && !user.roles.includes('ADMIN') && !user.roles.includes('MODERATOR')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleAssignRole = (roleType: string) => {
    if (!selectedUser) return;
    assignRole.mutate({ userId: selectedUser.id, roleType });
  };

  const handleRevokeRole = (roleType: string) => {
    if (!selectedUser) return;
    if (confirm(`Revoke role from this user?`)) {
      revokeRole.mutate({ userId: selectedUser.id, roleType });
    }
  };

  const handleSuspend = () => {
    if (!selectedUser || !suspendReason.trim()) return;
    suspendUser.mutate(
      { userId: selectedUser.id, reason: suspendReason.trim() },
      { onSettled: () => { setShowSuspendForm(false); setSuspendReason(''); } },
    );
  };

  const handleUnsuspend = () => {
    if (!selectedUser) return;
    if (confirm('Unsuspend this account?')) {
      unsuspendUser.mutate(selectedUser.id);
    }
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
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-sm text-slate-500">User management — role & status control</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}
        {/* Tab Selector */}
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            User Accounts
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'contracts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Contracts Monitoring
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: User list */}
            <div className="xl:col-span-2">
              {data ? (
                <UserList
                  users={data.users}
                  isLoading={isLoading}
                  page={page}
                  total={data.total}
                  limit={data.limit}
                  search={search}
                  selectedUserId={selectedUser?.id ?? null}
                  onSearchChange={setSearch}
                  onPageChange={setPage}
                  onSelectUser={setSelectedUser}
                />
              ) : isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Selected user management */}
            <div className="xl:col-span-1">
              {selectedUser ? (
                <div className="space-y-6">
                  {/* User info card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{getInitials(selectedUser.fullName)}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{selectedUser.fullName}</h3>
                          <p className="text-xs text-slate-500">{selectedUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedUser(null); setShowSuspendForm(false); }}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedUser.userRoles.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No roles</span>
                      ) : (
                        selectedUser.userRoles.map((ur) => (
                          <span
                            key={ur.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${
                              ur.role.name === 'ADMIN' ? 'bg-red-50 text-red-700 ring-red-600/20'
                              : ur.role.name === 'MODERATOR' ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              : ur.role.name === 'FREELANCER' ? 'bg-violet-50 text-violet-700 ring-violet-600/20'
                              : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                            }`}
                          >
                            {ur.role.name === 'ADMIN' ? 'Admin' : ur.role.name === 'MODERATOR' ? 'Moderator' : ur.role.name === 'FREELANCER' ? 'Freelancer' : 'Client'}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[selectedUser.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[selectedUser.status] ?? selectedUser.status}
                      </span>
                    </div>
                  </div>

                  {/* Role Manager */}
                  <RoleManager
                    user={selectedUser}
                    onAssign={handleAssignRole}
                    onRevoke={handleRevokeRole}
                    isAssigning={assignRole.isPending}
                    isRevoking={revokeRole.isPending}
                  />

                  {/* Suspend management */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-slate-500" />
                      Account Status
                    </h3>

                    {selectedUser.status === 'SUSPENDED' ? (
                      <button
                        onClick={handleUnsuspend}
                        disabled={unsuspendUser.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {unsuspendUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        Unsuspend Account
                      </button>
                    ) : (
                      <>
                        {showSuspendForm ? (
                          <div className="space-y-3">
                            <textarea
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="Reason for suspension..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSuspend}
                                disabled={!suspendReason.trim() || suspendUser.isPending}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {suspendUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Confirm Suspend
                              </button>
                              <button onClick={() => { setShowSuspendForm(false); setSuspendReason(''); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                                Cancel
                              </button>
                            </div>
                            <p className="text-xs text-slate-400">User will receive an email with the suspension reason.</p>
                          </div>
                        ) : (
                          <button onClick={() => setShowSuspendForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
                            <Lock className="w-4 h-4" /> Suspend Account
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                  <Users className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Select a user</h3>
                  <p className="text-xs text-slate-500">Click on a user from the list to manage their roles and account status.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <ContractsTab />
          </div>
        )}
      </main>
    </div>
  );
}