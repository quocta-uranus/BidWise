'use client';

import { useState } from 'react';
import { useCreateAdminUser } from '@/hooks/useAdminUsers';
import { X, Loader2, UserPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function CreateUserModal({ onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ADMIN');

  const createAdminUser = useCreateAdminUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminUser.mutate(
      { email, password, fullName, role },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Add New Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              User will bypass email verification and be ACTIVE immediately.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAdminUser.isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {createAdminUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
