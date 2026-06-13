'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { authApi } from '@/lib/api/auth.api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading2fa, setLoading2fa] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    bio: '',
    avatarUrl: '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA Setup state
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [provisioningUri, setProvisioningUri] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Login sessions
  const [sessions, setSessions] = useState<Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    deviceType: string | null;
    deviceName: string | null;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
  }>>([]);

  // Load user data on mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Load sessions when active tab changes
  useEffect(() => {
    if (activeTab === 'sessions' && user) {
      fetchSessions();
    }
  }, [activeTab, user]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await authApi.getSessions();
      setSessions(res.data.data);
    } catch {
      showFeedback('error', 'Không thể tải lịch sử đăng nhập.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone || null as any,
        bio: profileForm.bio || null as any,
        avatarUrl: profileForm.avatarUrl || null as any,
      });
      updateUser(res.data.data);
      showFeedback('success', 'Cập nhật thông tin cá nhân thành công!');
    } catch {
      showFeedback('error', 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showFeedback('error', 'Mật khẩu mới không trùng khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showFeedback('success', 'Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'CURRENT_PASSWORD_INCORRECT') {
        showFeedback('error', 'Mật khẩu cũ không chính xác.');
      } else if (msg === 'SAME_AS_CURRENT_PASSWORD') {
        showFeedback('error', 'Mật khẩu mới không được trùng mật khẩu cũ.');
      } else {
        showFeedback('error', 'Đổi mật khẩu thất bại.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStart2faSetup = async () => {
    setLoading2fa(true);
    try {
      const res = await authApi.generate2fa();
      setTotpSecret(res.data.data.secret);
      setProvisioningUri(res.data.data.provisioningUri);
      setShow2faSetup(true);
    } catch {
      showFeedback('error', 'Không thể khởi tạo xác thực 2 lớp.');
    } finally {
      setLoading2fa(false);
    }
  };

  const handleVerifyEnable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading2fa(true);
    try {
      await authApi.enable2fa(totpCode);
      updateUser({ twoFactorEnabled: true });
      setShow2faSetup(false);
      setTotpCode('');
      showFeedback('success', 'Đã bật xác thực 2 lớp (2FA) thành công!');
    } catch {
      showFeedback('error', 'Mã xác thực không chính xác.');
    } finally {
      setLoading2fa(false);
    }
  };

  const handleDisable2fa = async () => {
    const code = prompt('Vui lòng nhập mã 2FA hiện tại để tắt:');
    if (!code) return;

    setLoading2fa(true);
    try {
      await authApi.disable2fa(code);
      updateUser({ twoFactorEnabled: false });
      showFeedback('success', 'Đã tắt xác thực 2 lớp thành công.');
    } catch {
      showFeedback('error', 'Tắt 2FA thất bại. Mã xác thực không đúng.');
    } finally {
      setLoading2fa(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất thiết bị này không?')) return;

    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showFeedback('success', 'Đã đăng xuất thiết bị thành công.');
    } catch {
      showFeedback('error', 'Đăng xuất thiết bị thất bại.');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm">B</span>
              </div>
              <span className="font-bold text-slate-900 text-lg">BidWise</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-950 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Banner feedback */}
        {feedback && (
          <div
            className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý hồ sơ cá nhân và cấu hình bảo mật tài khoản.</p>
        </div>

        {/* Sidebar Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Navigation Tabs */}
          <div className="md:col-span-1 flex flex-row md:flex-col gap-1 overflow-x-auto pb-3 md:pb-0 border-b md:border-b-0 border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              👤 Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🔒 Bảo mật & 2FA
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🕒 Lịch sử đăng nhập
            </button>
          </div>

          {/* Right Contents Area */}
          <div className="md:col-span-3 space-y-6">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Hồ sơ cá nhân</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-inner">
                      {profileForm.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : initials}
                    </div>
                    <div className="flex-1 w-full space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Đường dẫn ảnh đại diện (Avatar URL)</label>
                      <input
                        type="url"
                        value={profileForm.avatarUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Họ và tên</label>
                      <input
                        type="text"
                        required
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Số điện thoại</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                        placeholder="09xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Giới thiệu bản thân (Bio)</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                      placeholder="Viết một chút giới thiệu về kinh nghiệm, sở trường của bạn..."
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-60"
                    >
                      {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password Form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Đổi mật khẩu</h2>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Mật khẩu cũ</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                          placeholder="Tối thiểu 8 ký tự"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-60"
                      >
                        {savingPassword ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2FA Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Xác thực 2 lớp (2FA)</h2>
                      <p className="text-slate-500 text-xs mt-0.5">Tăng cường bảo mật cho tài khoản bằng cách yêu cầu mã OTP khi đăng nhập.</p>
                    </div>
                    <div>
                      {user.twoFactorEnabled ? (
                        <button
                          onClick={handleDisable2fa}
                          disabled={loading2fa}
                          className="h-10 px-4 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition-all"
                        >
                          Tắt 2FA
                        </button>
                      ) : (
                        <button
                          onClick={handleStart2faSetup}
                          disabled={loading2fa || show2faSetup}
                          className="h-10 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5"
                        >
                          {loading2fa ? 'Đang tải...' : 'Bật 2FA'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2FA Setup Instructions */}
                  {show2faSetup && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
                      <h3 className="font-bold text-slate-800 text-sm">Cấu hình Google Authenticator</h3>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Render QR code from Google Authenticator provisioning URI */}
                        <div className="bg-white p-3 border border-slate-200 rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(provisioningUri)}`}
                            alt="Mã QR 2FA"
                            className="w-[180px] h-[180px]"
                          />
                        </div>

                        <div className="flex-1 space-y-3">
                          <p className="text-slate-600 text-xs leading-relaxed">
                            1. Quét mã QR bên cạnh bằng ứng dụng **Google Authenticator** hoặc **Microsoft Authenticator**.
                          </p>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            2. Nếu không thể quét mã, bạn có thể nhập thủ công khóa bí mật này vào ứng dụng:
                          </p>
                          <div className="bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-mono text-slate-800 inline-block font-bold tracking-wider">
                            {totpSecret}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleVerifyEnable2fa} className="border-t border-slate-200 pt-4 mt-2 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">Mã OTP gồm 6 chữ số từ ứng dụng</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                              placeholder="000000"
                            />
                            <button
                              type="submit"
                              disabled={loading2fa}
                              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all"
                            >
                              Kích hoạt
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShow2faSetup(false);
                                setTotpCode('');
                              }}
                              className="h-11 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 bg-blue-50/50 border border-blue-100/50 p-3.5 rounded-xl">
                    <span className="text-base">🛡️</span>
                    <span>Xác thực 2 lớp bảo vệ tài khoản của bạn khỏi việc truy cập trái phép ngay cả khi mật khẩu bị lộ.</span>
                  </div>
                </div>
              </div>
            )}

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Lịch sử đăng nhập</h2>
                  <button
                    onClick={fetchSessions}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Tải lại 🔄
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="py-10 flex justify-center">
                    <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">Không tìm thấy thông tin phiên đăng nhập.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <div key={s.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="text-xl mt-0.5">
                            {s.userAgent.toLowerCase().includes('mobile') ? '📱' : '💻'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {s.ipAddress === '::1' || s.ipAddress === '127.0.0.1' ? 'Localhost (IP cá nhân)' : s.ipAddress}
                              </span>
                              {s.isCurrent && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                  Thiết bị hiện tại
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-md" title={s.userAgent}>
                              {s.userAgent}
                            </p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                              Đăng nhập: {new Date(s.createdAt).toLocaleString('vi-VN')} · Hoạt động cuối: {new Date(s.lastActiveAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                          >
                            Đăng xuất thiết bị
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
