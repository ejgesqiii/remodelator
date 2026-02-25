// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './AdminGuard';

let mockRole: string | null = null;

vi.mock('@/stores/authStore', () => ({
    useAuthStore: (selector: (state: { role: string | null }) => unknown) =>
        selector({ role: mockRole }),
}));

function renderWithRole(role: string | null) {
    mockRole = role;

    return render(
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/" element={<div>Home Page</div>} />
                <Route
                    path="/admin"
                    element={
                        <AdminGuard>
                            <div>Admin Page</div>
                        </AdminGuard>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe('AdminGuard', () => {
    beforeEach(() => {
        mockRole = null;
    });

    it('renders admin content for admin role', () => {
        renderWithRole('admin');
        expect(screen.getByText('Admin Page')).toBeTruthy();
    });

    it('redirects non-admin users to home route', () => {
        renderWithRole('user');
        expect(screen.getByText('Home Page')).toBeTruthy();
    });
});
