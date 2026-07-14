'use client';

import { useEffect, useState } from 'react';
import { useAdminUsers, useAssignRole, useRevokeRole, useSuspendUser, useUnsuspendUser } from '@/hooks/useAdminUsers';
import CreateUserModal from '@/features/admin/CreateUserModal';
import { Lock, Unlock, X, Loader2, Users, AlertTriangle, Plus } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin.api';
import UserList from '@/features/admin/UserList';
import RoleManager from '@/features/admin/RoleManager';

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

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useAdminUsers({ page, limit: 15, search: debouncedSearch || undefined });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý User</h2>
          <p className="text-sm text-slate-500">Tìm kiếm, xem profile, khóa/mở khóa, đổi role</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl">
          <Plus className="w-4 h-4" /> Thêm tài khoản
        </button>
      </div>

      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {data ? (
            <UserList
              users={data.users ?? []} isLoading={isLoading} page={page} total={data.total}
              limit={data.limit} search={search} selectedUserId={selectedUser?.id ?? null}
              onSearchChange={setSearch} onPageChange={setPage} onSelectUser={setSelectedUser}
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

        <div className="xl:col-span-1">
          {selectedUser ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{getInitials(selectedUser.fullName)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{selectedUser.fullName}</h3>
                      <p className="text-xs text-slate-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setShowSuspendForm(false); }}
                    className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedUser.userRoles.map((ur) => (
                    <span key={ur.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                      {ur.role.name}
                    </span>
                  ))}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[selectedUser.status] ?? ''}`}>
                  {STATUS_LABELS[selectedUser.status] ?? selectedUser.status}
                </span>
              </div>

              <RoleManager user={selectedUser}
                onAssign={(roleType) => assignRole.mutate({ userId: selectedUser.id, roleType })}
                onRevoke={(roleType) => { if (confirm('Revoke role?')) revokeRole.mutate({ userId: selectedUser.id, roleType }); }}
                isAssigning={assignRole.isPending} isRevoking={revokeRole.isPending} />

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-500" /> Trạng thái tài khoản
                </h3>
                {selectedUser.status === 'SUSPENDED' ? (
                  <button onClick={() => { if (confirm('Mở khóa?')) unsuspendUser.mutate(selectedUser.id); }}
                    disabled={unsuspendUser.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl disabled:opacity-50">
                    {unsuspendUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    Mở khóa
                  </button>
                ) : showSuspendForm ? (
                  <div className="space-y-3">
                    <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Lý do khóa..." rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (!suspendReason.trim()) return;
                        suspendUser.mutate({ userId: selectedUser.id, reason: suspendReason.trim() },
                          { onSettled: () => { setShowSuspendForm(false); setSuspendReason(''); } });
                      }} disabled={!suspendReason.trim() || suspendUser.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-xl disabled:opacity-50">
                        {suspendUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Xác nhận khóa
                      </button>
                      <button onClick={() => { setShowSuspendForm(false); setSuspendReason(''); }}
                        className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowSuspendForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-xl">
                    <Lock className="w-4 h-4" /> Khóa tài khoản
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Chọn user</h3>
              <p className="text-xs text-slate-500">Click vào user để quản lý role và trạng thái</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
