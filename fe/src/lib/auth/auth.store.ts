'use client';

import { create } from 'zustand';
import { AuthUser, authApi } from '../api/auth.api';
import { setAccessToken } from '../api/client';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  loadSession: () => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Gọi khi app khởi động — dùng RT từ cookie để lấy AT mới
  loadSession: async () => {
    try {
      const refreshRes = await authApi.refresh();
      const newAt = refreshRes.data.data.accessToken;
      setAccessToken(newAt);
      const meRes = await authApi.getMe();
      set({ user: meRes.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async (logoutAll = false) => {
    try {
      await authApi.logout(logoutAll);
    } finally {
      get().clearAuth();
    }
  },
}));
