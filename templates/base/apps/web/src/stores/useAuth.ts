import { create } from 'zustand';
import { getCurrentUser, login as apiLogin, signup as apiSignup, logout as apiLogout } from '@loomrails/types';
import type { User } from '@loomrails/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  checkSession: async () => {
    if (get().isInitialized) return;
    try {
      const { data, error } = await getCurrentUser();
      if (error || !data) {
        set({ user: null, isInitialized: true });
        return;
      }
      set({ user: data.user, isInitialized: true });
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await apiLogin({ body: { email, password } });
      if (error) {
        throw error;
      }
      if (data) {
        set({ user: data.user });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await apiSignup({ body: { email, password } });
      if (error) {
        throw error;
      }
      if (data) {
        set({ user: data.user });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({ user: null });
    }
  },
}));
