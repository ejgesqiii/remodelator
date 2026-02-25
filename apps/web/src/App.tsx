import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EstimateListPage } from '@/features/estimates/EstimateListPage';
import { EstimateDetailPage } from '@/features/estimates/EstimateDetailPage';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { TemplateListPage } from '@/features/templates/TemplateListPage';
import { BillingPage } from '@/features/billing/BillingPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { ProposalPage } from '@/features/proposals/ProposalPage';

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <BrowserRouter>
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
