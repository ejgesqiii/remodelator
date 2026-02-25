import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    userId: string | null;
    email: string | null;
    role: string | null;
    setAuth: (data: { session_token: string; user_id: string; email: string; role: string }) => void;
    clearAuth: () => void;
    isAuthenticated: () => boolean;
    isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            userId: null,
            email: null,
            role: null,
            setAuth: (data) =>
                set({
                    token: data.session_token,
                    userId: data.user_id,
                    email: data.email,
                    role: data.role,
                }),
            clearAuth: () => set({ token: null, userId: null, email: null, role: null }),
            isAuthenticated: () => !!get().token,
            isAdmin: () => get().role === 'admin',
        }),
        {
            name: 'remodelator-auth',
        }
    )
);
