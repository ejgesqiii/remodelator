import { useAuthStore } from '@/stores/authStore';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
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

function normalizedPath(path: string): string {
    const [base] = path.split('?');
    return base;
}

export function requiresAdminKeyHeader(path: string, method: string): boolean {
    const basePath = normalizedPath(path);
    const upperMethod = method.toUpperCase();
    if (upperMethod !== 'POST') {
        return false;
    }
    return basePath === '/admin/demo-reset' || basePath === '/admin/audit-prune';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = useAuthStore.getState().token;
    const adminApiKey = useAdminAuthStore.getState().adminApiKey.trim();
    const method = (options?.method ?? 'GET').toUpperCase();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
        ...(adminApiKey && requiresAdminKeyHeader(path, method) ? { 'x-admin-key': adminApiKey } : {}),
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
