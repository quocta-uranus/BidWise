'use client';

import { create } from 'zustand';
import { AuthUser, authApi } from '../api/auth.api';
import { setAccessToken } from '../api/client';
import { clearQueryCache } from '../api/query-client';

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
    // Always wipe stale data from the previous account before
    // installing the new one — prevents cross-account data leak.
    clearQueryCache();
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    setAccessToken(null);
    clearQueryCache();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Called once on app boot. Uses the httpOnly refresh token cookie
  // to mint a fresh access token and fetch the current user.
  loadSession: async () => {
    if (loadSessionPromise) return loadSessionPromise;
    loadSessionPromise = (async () => {
      try {
        const refreshRes = await authApi.refresh();
        const newAt = refreshRes.data.data.accessToken;
        setAccessToken(newAt);
        const meRes = await authApi.getMe();
        const user = meRes.data.data;
        // Detect account change: if a different user is logged in,
        // discard any cached data from the previous session first.
        const prev = get().user;
        if (prev && prev.id !== user.id) {
          clearQueryCache();
        }
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        clearQueryCache();
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
    }
  },

  updateUser: (partialUser) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    }));
  },
}));
