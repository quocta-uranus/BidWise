import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
  status: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'CLIENT' | 'FREELANCER';
  }) => apiClient.post<{ data: { userId: string; message: string } }>('/auth/register', data),

  verifyEmail: (data: { userId: string; otp: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/verify-email', data),

  resendOtp: (userId: string) =>
    apiClient.post<{ data: { expiresAt: string } }>('/auth/resend-otp', { userId }),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data),

  // RT đọc từ httpOnly cookie tự động — không cần gửi body
  refresh: () =>
    apiClient.post<{ data: { accessToken: string } }>('/auth/refresh', {}),

  logout: (logoutAll = false) =>
    apiClient.post('/auth/logout', { logoutAll }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),

  getMe: () => apiClient.get<{ data: AuthUser }>('/users/me'),

  updateProfile: (data: { fullName?: string; bio?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch<{ data: AuthUser }>('/users/me', data),

  getSessions: () => apiClient.get('/users/me/sessions'),

  revokeSession: (sessionId: string) =>
    apiClient.delete(`/users/me/sessions/${sessionId}`),
};
