import { get, post } from './client';
import type { ActivitySummary, AuditEntry, BackupPayload } from './types';

export function getActivitySummary(): Promise<ActivitySummary> {
    return get<ActivitySummary>('/activity');
}

export function getAuditTrail(): Promise<AuditEntry[]> {
    return get<AuditEntry[]>('/audit');
}

export function exportBackup(): Promise<BackupPayload> {
    return get<BackupPayload>('/backup/export');
}

export function restoreBackup(data: BackupPayload): Promise<{ estimates_restored: number; line_items_restored: number }> {
    return post('/backup/restore', data);
}
