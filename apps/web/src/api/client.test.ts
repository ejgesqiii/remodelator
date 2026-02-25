import { describe, expect, it } from 'vitest';
import { requiresAdminKeyHeader } from './client';

describe('requiresAdminKeyHeader', () => {
    it('requires x-admin-key for destructive admin POST endpoints', () => {
        expect(requiresAdminKeyHeader('/admin/demo-reset', 'POST')).toBe(true);
        expect(requiresAdminKeyHeader('/admin/audit-prune', 'POST')).toBe(true);
        expect(requiresAdminKeyHeader('/admin/audit-prune?retention_days=7', 'POST')).toBe(true);
    });

    it('does not require x-admin-key for admin read endpoints or non-POST methods', () => {
        expect(requiresAdminKeyHeader('/admin/summary', 'GET')).toBe(false);
        expect(requiresAdminKeyHeader('/admin/users?limit=10', 'GET')).toBe(false);
        expect(requiresAdminKeyHeader('/admin/demo-reset', 'GET')).toBe(false);
        expect(requiresAdminKeyHeader('/admin/activity', 'POST')).toBe(false);
    });
});
