// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CatalogPage } from './CatalogPage';

let mockRole: string | null = null;

vi.mock('@/stores/authStore', () => ({
    useAuthStore: (selector: (state: { role: string | null }) => unknown) =>
        selector({ role: mockRole }),
}));

const invalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries }),
    useQuery: (opts: { queryKey: unknown[] }) => {
        if (opts.queryKey[0] === 'catalog-tree') {
            return { data: [], isLoading: false };
        }
        return { data: [], isLoading: false };
    },
    useMutation: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('@/api/catalog', () => ({
    getCatalogTree: vi.fn(),
    searchCatalog: vi.fn(),
    upsertCatalogItem: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('CatalogPage RBAC', () => {
    beforeEach(() => {
        cleanup();
        mockRole = null;
        invalidateQueries.mockReset();
    });

    it('shows add-item management controls for admin role', () => {
        mockRole = 'admin';
        render(<CatalogPage />);

        expect(screen.getByRole('button', { name: /add item/i })).toBeTruthy();
    });

    it('hides add-item management controls for non-admin role', () => {
        mockRole = 'user';
        render(<CatalogPage />);

        expect(screen.queryByRole('button', { name: /add item/i })).toBeNull();
        expect(screen.getByText(/catalog management is admin-only/i)).toBeTruthy();
    });
});
