const rawApiBase = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && rawApiBase === undefined) {
    throw new Error('VITE_API_URL must be set for production builds. Use an empty string for same-origin deployments.');
}

export const API_BASE = rawApiBase ?? 'http://localhost:8000';

export const ROUTES = {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    dashboard: '/',
    estimates: '/estimates',
    estimateNew: '/estimates/new',
    estimateDetail: (id: string) => `/estimates/${id}`,
    estimateProposal: (id: string) => `/estimates/${id}/proposal`,
    catalog: '/catalog',
    templates: '/templates',
    billing: '/billing',
    billingLedger: '/billing/ledger',
    settings: '/settings',
    settingsBackup: '/settings/backup',
    admin: '/admin',
    adminUsers: '/admin/users',
    adminActivity: '/admin/activity',
    adminBilling: '/admin/billing',
} as const;
