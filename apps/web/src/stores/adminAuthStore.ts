import { create } from 'zustand';

interface AdminAuthState {
    adminApiKey: string;
    setAdminApiKey: (value: string) => void;
    clearAdminApiKey: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
    adminApiKey: '',
    setAdminApiKey: (value) => set({ adminApiKey: value }),
    clearAdminApiKey: () => set({ adminApiKey: '' }),
}));
