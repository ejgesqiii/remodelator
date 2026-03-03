import { post } from './client';
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequestResponse,
} from './types';

export function login(data: LoginRequest): Promise<AuthResponse> {
    return post<AuthResponse>('/auth/login', data);
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
    return post<AuthResponse>('/auth/register', data);
}

export function requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetRequestResponse> {
    return post<PasswordResetRequestResponse>('/auth/password-reset/request', data);
}

export function confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<AuthResponse> {
    return post<AuthResponse>('/auth/password-reset/confirm', data);
}
