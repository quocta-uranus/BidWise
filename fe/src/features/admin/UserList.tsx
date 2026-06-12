'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin.api';

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

const ROLE_COLORS: Record<string, string> = {
  CLIENT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  FREELANCER: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  MODERATOR: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  ADMIN: 'bg-red-50 text-red-700 ring-red-600/20',
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  FREELANCER: 'Freelancer',
  MODERATOR: 'Moderator',
  ADMIN: 'Admin',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n: string) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

interface UserListProps {
  users: AdminUser[];
  isLoading: boolean;
  page: number;
  total: number;
  limit: number;
  search: string;
  selectedUserId: string | null;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelectUser: (user: AdminUser) => void;
}

export default function UserList({
  users,
  isLoading,
  page,
  total,
  limit,
  search,
  selectedUserId,
  onSearchChange,
  onPageChange,
  onSelectUser,
}: UserListProps) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    {search ? 'No users matching your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                      selectedUserId === u.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{getInitials(u.fullName)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.userRoles.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          u.userRoles.map((ur) => (
                            <span
                              key={ur.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${
                                ROLE_COLORS[ur.role.name] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ROLE_LABELS[ur.role.name] ?? ur.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${
                          STATUS_COLORS[u.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectUser(u); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total} users)
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-7 text-xs font-medium rounded-lg transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}