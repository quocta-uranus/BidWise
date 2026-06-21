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
  updateUser: (partialUser: Partial<AuthUser>) => void;
}

let loadSessionPromise: Promise<void> | null = null;

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
    if (loadSessionPromise) return loadSessionPromise;
    loadSessionPromise = (async () => {
      try {
        const refreshRes = await authApi.refresh();
        const newAt = refreshRes.data.data.accessToken;
        setAccessToken(newAt);
        const meRes = await authApi.getMe();
        set({ user: meRes.data.data, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } finally {
        loadSessionPromise = null;
      }
    })();
    return loadSessionPromise;
  },

  logout: async (logoutAll = false) => {
    try {
      await authApi.logout(logoutAll);
    } finally {
      get().clearAuth();
      // Clear React Query cache when logging out
      if (typeof window !== 'undefined') {
        // Clear Zustand persist stores (freelancer & client demo data)
        try {
          localStorage.removeItem('bidwise-freelancer-store');
          localStorage.removeItem('bidwise-client-store');
          localStorage.removeItem('bidwise-admin-store');
        } catch {}
      }
    }
  },

  updateUser: (partialUser) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    }));
  },
}));

