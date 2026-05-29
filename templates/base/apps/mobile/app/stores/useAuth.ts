import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
      
      const response = await api.get('me').json<{ user: User | null }>();
      set({ user: response.user, isInitialized: true });
    } catch {
      await SecureStore.deleteItemAsync('jwt_token');
      set({ user: null, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('login', { json: { email, password } }).json<{ user: User, token: string }>();
      await SecureStore.setItemAsync('jwt_token', response.token);
      set({ user: response.user });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('signup', { json: { email, password } }).json<{ user: User, token: string }>();
      await SecureStore.setItemAsync('jwt_token', response.token);
      set({ user: response.user });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.delete('logout');
    } finally {
      await SecureStore.deleteItemAsync('jwt_token');
      set({ user: null });
    }
  },
}));
