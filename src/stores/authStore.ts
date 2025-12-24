import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserData } from '../utils/storage';

interface AuthState {
    user: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: UserData | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: UserData) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setLoading: (isLoading) => set({ isLoading }),
            login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
            logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
        }),
        {
            name: 'auth-store',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
