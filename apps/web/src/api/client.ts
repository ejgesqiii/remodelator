import { useAuthStore } from '@/stores/authStore';
import { API_BASE } from '@/lib/constants';

export class ApiError extends Error {
    status: number;
    code: string;
    requestId?: string;

    constructor(status: number, body: Record<string, unknown>) {
        const message =
            (body?.error as Record<string, unknown>)?.message as string ||
            (body?.detail as string) ||
            'An unexpected error occurred';
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = ((body?.error as Record<string, unknown>)?.code as string) || 'unknown_error';
        this.requestId = body?.request_id as string | undefined;
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
        ...options?.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new ApiError(res.status, body);
    }

    // Some endpoints return empty responses
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

export function get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: 'PUT',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export function del<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
}
