import { create } from 'zustand';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  checkSession: async () => {
    try {
      const { user } = await api.get('me').json<{ user: User }>();
      set({ user, isInitialized: true });
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await api.post('login', { json: { email, password } }).json<{ user: User }>();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await api.post('signup', { json: { email, password } }).json<{ user: User }>();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.delete('logout');
    } finally {
      set({ user: null });
    }
  },
}));
