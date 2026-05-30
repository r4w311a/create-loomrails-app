import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getCurrentUser, login as apiLogin, signup as apiSignup, logout as apiLogout, User } from '@loomrails/types';

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
      const token = await SecureStore.getItemAsync('jwt_token');
      if (!token) {
        set({ user: null, isInitialized: true });
        return;
      }
      
      const { data, error } = await getCurrentUser();
      if (error || !data) {
        await SecureStore.deleteItemAsync('jwt_token');
        set({ user: null, isInitialized: true });
        return;
      }
      set({ user: data.user, isInitialized: true });
    } catch {
      await SecureStore.deleteItemAsync('jwt_token');
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
      if (data && data.token) {
        await SecureStore.setItemAsync('jwt_token', data.token);
        set({ user: data.user });
      } else {
        throw new Error('Authentication failed');
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
      if (data && data.token) {
        await SecureStore.setItemAsync('jwt_token', data.token);
        set({ user: data.user });
      } else {
        throw new Error('Registration failed');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      await SecureStore.deleteItemAsync('jwt_token');
      set({ user: null });
    }
  },
}));
