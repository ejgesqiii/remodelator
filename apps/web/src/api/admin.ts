import { get, post } from './client';
import type { AdminSummary, AdminUserRow, AdminActivityRow, AdminBillingRow } from './types';

export function getAdminSummary(): Promise<AdminSummary> {
    return get<AdminSummary>('/admin/summary');
}

export function getAdminUsers(params?: { limit?: number; search?: string }): Promise<AdminUserRow[]> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const q = qs.toString();
    return get<AdminUserRow[]>(`/admin/users${q ? `?${q}` : ''}`);
}

export function getAdminActivity(params?: { limit?: number; user_id?: string; action?: string; entity_type?: string }): Promise<AdminActivityRow[]> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.user_id) qs.set('user_id', params.user_id);
    if (params?.action) qs.set('action', params.action);
    if (params?.entity_type) qs.set('entity_type', params.entity_type);
    const q = qs.toString();
    return get<AdminActivityRow[]>(`/admin/activity${q ? `?${q}` : ''}`);
}

export function getAdminBillingLedger(params?: { limit?: number; user_id?: string; event_type?: string }): Promise<AdminBillingRow[]> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.user_id) qs.set('user_id', params.user_id);
    if (params?.event_type) qs.set('event_type', params.event_type);
    const q = qs.toString();
    return get<AdminBillingRow[]>(`/admin/billing-ledger${q ? `?${q}` : ''}`);
}

export function pruneAudit(params?: { retention_days?: number; dry_run?: boolean }): Promise<{ status: string; deleted: number; retention_days: number; cutoff_utc: string; dry_run: boolean }> {
    const qs = new URLSearchParams();
    if (params?.retention_days) qs.set('retention_days', String(params.retention_days));
    if (params?.dry_run !== undefined) qs.set('dry_run', String(params.dry_run));
    const q = qs.toString();
    return post(`/admin/audit-prune${q ? `?${q}` : ''}`);
}

export function demoReset(): Promise<{ status: string }> {
    return post('/admin/demo-reset');
}
