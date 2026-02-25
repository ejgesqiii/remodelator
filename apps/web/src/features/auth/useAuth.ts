import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/api/auth';
import type { LoginRequest, RegisterRequest } from '@/api/types';

export function useAuth() {
    const navigate = useNavigate();
    const { setAuth, clearAuth, token, email, role, userId } = useAuthStore();

    const loginMutation = useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: (res) => {
            setAuth(res);
            navigate('/');
        },
    });

    const registerMutation = useMutation({
        mutationFn: (data: RegisterRequest) => authApi.register(data),
        onSuccess: (res) => {
            setAuth(res);
            navigate('/');
        },
    });

    const logout = useCallback(() => {
        clearAuth();
        navigate('/login');
    }, [clearAuth, navigate]);

    return {
        isAuthenticated: !!token,
        user: token ? { userId, email, role } : null,
        login: loginMutation,
        register: registerMutation,
        logout,
    };
}
