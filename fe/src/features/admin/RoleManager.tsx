'use client';

import { Shield, ShieldOff, Plus, Loader2 } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin.api';

const ROLES_CONFIG = [
  { value: 'CLIENT', label: 'Client', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  { value: 'FREELANCER', label: 'Freelancer', color: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
  { value: 'MODERATOR', label: 'Moderator', color: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  { value: 'ADMIN', label: 'Admin', color: 'bg-red-50 text-red-700 ring-red-600/20' },
];

interface RoleManagerProps {
  user: AdminUser;
  onAssign: (roleType: string) => void;
  onRevoke: (roleType: string) => void;
  isAssigning: boolean;
  isRevoking: boolean;
}

export default function RoleManager({
  user,
  onAssign,
  onRevoke,
  isAssigning,
  isRevoking,
}: RoleManagerProps) {
  const currentRoles = user.userRoles.map((ur) => ur.role.name);
  const availableRoles = ROLES_CONFIG.filter((r) => !currentRoles.includes(r.value));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-500" />
        Role Management
      </h3>

      {/* Current roles */}
      <div className="space-y-2 mb-4">
        {ROLES_CONFIG.filter((r) => currentRoles.includes(r.value)).map((role) => (
          <div key={role.value} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${role.color}`}>
              {role.label}
            </span>
            <button
              onClick={() => onRevoke(role.value)}
              disabled={isRevoking}
              className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 transition-colors"
            >
              <ShieldOff className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {currentRoles.length === 0 && (
          <p className="text-xs text-slate-400 italic">No roles assigned</p>
        )}
      </div>

      {/* Assignable roles */}
      {availableRoles.length > 0 && (
        <>
          <p className="text-xs font-medium text-slate-500 mb-2">Assign role:</p>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <button
                key={role.value}
                onClick={() => onAssign(role.value)}
                disabled={isAssigning}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor:
                    role.value === 'ADMIN'
                      ? '#fca5a5'
                      : role.value === 'MODERATOR'
                        ? '#fcd34d'
                        : role.value === 'FREELANCER'
                          ? '#c4b5fd'
                          : '#93c5fd',
                  color:
                    role.value === 'ADMIN'
                      ? '#dc2626'
                      : role.value === 'MODERATOR'
                        ? '#d97706'
                        : role.value === 'FREELANCER'
                          ? '#7c3aed'
                          : '#2563eb',
                }}
              >
                {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {role.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}