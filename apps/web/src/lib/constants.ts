export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ROUTES = {
    login: '/login',
    register: '/register',
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
