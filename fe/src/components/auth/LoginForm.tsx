'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { authApi, type AuthUser } from '@/lib/api/auth.api';
import {
  type LoginPortal,
  userHasPortalAccess,
  getPortalRedirect,
  getPrimaryPortal,
  portalLabels,
} from '@/lib/auth/role-routing';

interface LoginFormProps {
  portal: LoginPortal;
  registerHref?: string;
}

export default function LoginForm({ portal, registerHref }: LoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const meta = portalLabels[portal];

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  function redirectAfterAuth(user: AuthUser) {
    if (!userHasPortalAccess(user, portal)) {
      clearAuth();
      const correctPortal = getPrimaryPortal(user);
      setError(
        `${meta.wrongRole} Hãy đăng nhập tại cổng ${portalLabels[correctPortal].title.replace('Đăng nhập ', '')}.`
      );
      return;
    }
    router.push(getPortalRedirect(portal));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const data = res.data.data as { requires2fa?: boolean; twoFactorToken?: string; user?: unknown; accessToken?: string };
      if (data.requires2fa && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
        setLoading(false);
        return;
      }
      const { user, accessToken } = data as { user: AuthUser; accessToken: string };
      setAuth(user, accessToken);
      redirectAfterAuth(user);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const messages: Record<string, string> = {
        INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
        ACCOUNT_SUSPENDED: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.',
        EMAIL_NOT_VERIFIED: 'Email chưa được xác thực.',
        ACCOUNT_LOCKED: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần.',
      };
      setError(messages[code ?? ''] ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verify2fa({ twoFactorToken, code: twoFactorCode });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      redirectAfterAuth(user);
    } catch {
      setError('Mã xác thực 2FA không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  if (twoFactorToken) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Xác thực 2 lớp (2FA)</h2>
          <p className="text-slate-500 text-sm">Nhập mã 6 chữ số từ ứng dụng Google Authenticator.</p>
        </div>
        <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Mã xác thực</label>
            <input
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-center text-lg tracking-[0.5em] font-mono outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10"
              placeholder="000000"
            />
          </div>
          {error && <ErrorBox message={error} />}
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Đang xác nhận...' : 'Xác nhận'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTwoFactorToken('');
              setError('');
            }}
            className={btnSecondary}
          >
            Quay lại
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium mb-6"
      >
        ← Chọn cổng khác
      </Link>

      <div className="mb-8">
        <PortalBadge portal={portal} />
        <h2 className="text-2xl font-bold text-slate-900 mb-1.5 mt-3">{meta.title}</h2>
        <p className="text-slate-500 text-sm">{meta.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${inputClass} pr-11`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && <ErrorBox message={error} />}

        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      {registerHref && meta.registerHint && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {meta.registerHint}{' '}
          <Link href={registerHref} className="text-blue-600 font-semibold hover:text-blue-700">
            Đăng ký ngay
          </Link>
        </p>
      )}
    </div>
  );
}

function PortalBadge({ portal }: { portal: LoginPortal }) {
  const styles = {
    CLIENT: 'bg-blue-50 text-blue-700 border-blue-100',
    FREELANCER: 'bg-violet-50 text-violet-700 border-violet-100',
    ADMIN: 'bg-red-50 text-red-700 border-red-100',
  };
  const labels = { CLIENT: 'Client Portal', FREELANCER: 'Freelancer Portal', ADMIN: 'Admin Portal' };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles[portal]}`}>
      {labels[portal]}
    </span>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3.5 py-3">
      <span className="flex-shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  );
}

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10';

const btnPrimary =
  'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed';

const btnSecondary =
  'w-full h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all';
