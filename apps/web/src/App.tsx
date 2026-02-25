import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { AuthGuard } from '@/features/auth/AuthGuard';

const AppShell = lazy(() => import('@/components/layout/AppShell').then((m) => ({ default: m.AppShell })));
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EstimateListPage = lazy(() =>
    import('@/features/estimates/EstimateListPage').then((m) => ({ default: m.EstimateListPage }))
);
const EstimateDetailPage = lazy(() =>
    import('@/features/estimates/EstimateDetailPage').then((m) => ({ default: m.EstimateDetailPage }))
);
const ProposalPage = lazy(() => import('@/features/proposals/ProposalPage').then((m) => ({ default: m.ProposalPage })));
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const TemplateListPage = lazy(() =>
    import('@/features/templates/TemplateListPage').then((m) => ({ default: m.TemplateListPage }))
);
const BillingPage = lazy(() => import('@/features/billing/BillingPage').then((m) => ({ default: m.BillingPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminDashboardPage = lazy(() =>
    import('@/features/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);

function RouteFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
            Loading...
        </div>
    );
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <BrowserRouter>
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* Authenticated routes */}
                            <Route
                                element={
                                    <AuthGuard>
                                        <AppShell />
                                    </AuthGuard>
                                }
                            >
                                <Route index element={<DashboardPage />} />
                                <Route path="estimates" element={<EstimateListPage />} />
                                <Route path="estimates/:id" element={<EstimateDetailPage />} />
                                <Route path="estimates/:id/proposal" element={<ProposalPage />} />
                                <Route path="catalog" element={<CatalogPage />} />
                                <Route path="templates" element={<TemplateListPage />} />
                                <Route path="billing" element={<BillingPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="admin" element={<AdminDashboardPage />} />
                            </Route>

                            {/* Catch-all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </ErrorBoundary>

            <Toaster
                position="bottom-right"
                theme="dark"
                toastOptions={{
                    style: {
                        background: 'hsl(224 18% 13%)',
                        border: '1px solid hsl(224 15% 20%)',
                        color: 'hsl(210 40% 98%)',
                    },
                }}
            />
        </QueryClientProvider>
    );
}
