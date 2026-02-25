import { post } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';

export function login(data: LoginRequest): Promise<AuthResponse> {
    return post<AuthResponse>('/auth/login', data);
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
    return post<AuthResponse>('/auth/register', data);
}
