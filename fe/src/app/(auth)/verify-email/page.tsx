'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { authApi } from '@/lib/api/auth.api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const email = searchParams.get('email') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto submit when all filled
    if (newOtp.every(Boolean) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  }

  async function handleVerify(code: string) {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ userId, otp: code });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch (err: unknown) {
      const code2 = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const messages: Record<string, string> = {
        OTP_INVALID: 'Mã OTP không đúng. Vui lòng kiểm tra lại.',
        OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.',
        OTP_MAX_ATTEMPTS_EXCEEDED: 'Nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.',
      };
      setError(messages[code2 ?? ''] ?? 'Xác thực thất bại.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setError('');
    try {
      await authApi.resendOtp(userId);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (code === 'OTP_RESEND_COOLDOWN') setError('Vui lòng đợi trước khi gửi lại.');
      else if (code === 'OTP_SEND_LIMIT_EXCEEDED') setError('Đã vượt giới hạn gửi OTP hôm nay.');
      else setError('Gửi lại OTP thất bại.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div>
      {/* Toast */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl shadow-lg shadow-green-900/10 transition-all duration-500 ${
          success ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        Email xác thực thành công! Đang chuyển trang...
      </div>

      <div className="mb-8">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Xác thực email</h2>
        <p className="text-slate-500 text-sm">
          Nhập mã 6 số đã gửi đến{' '}
          <span className="font-semibold text-slate-700">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex gap-2 mb-5" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-10 h-10 text-center text-base font-semibold rounded-lg border-2 outline-none transition-all ${
              digit
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-900'
            } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10`}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang xác thực...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3.5 py-3 mb-4">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={() => handleVerify(otp.join(''))}
        disabled={loading || otp.some((d) => !d)}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        Xác thực
      </button>

      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-slate-400">
            Gửi lại mã sau{' '}
            <span className="font-semibold text-slate-600 tabular-nums">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-60 transition-colors"
          >
            {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}