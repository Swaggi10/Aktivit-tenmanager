import { create } from 'zustand';
import { User } from '@/types';
import { socketService } from '@/services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  isLoading: false,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Socket.io verbinden
    socketService.connect(token);

    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Socket.io trennen
    socketService.disconnect();

    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
