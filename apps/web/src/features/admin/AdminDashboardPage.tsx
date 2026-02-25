import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data-display/StatCard';
import { StatusBadge } from '@/components/data-display/StatusBadge';

import { EmptyState } from '@/components/feedback/EmptyState';
import { SkeletonCard } from '@/components/feedback/LoadingSkeleton';
import {
    ShieldCheck, Users, ClipboardList, CreditCard, Package,
    Activity, RotateCcw, Trash2, AlertCircle,
} from 'lucide-react';

import { formatMoney, formatDate } from '@/lib/formatters';
import * as adminApi from '@/api/admin';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { toast } from 'sonner';

export function AdminDashboardPage() {
    const queryClient = useQueryClient();
    const [resetConfirm, setResetConfirm] = useState('');
    const [pruneRetention, setPruneRetention] = useState('90');
    const adminApiKey = useAdminAuthStore((s) => s.adminApiKey);
    const setAdminApiKey = useAdminAuthStore((s) => s.setAdminApiKey);
    const clearAdminApiKey = useAdminAuthStore((s) => s.clearAdminApiKey);
    const hasAdminApiKey = adminApiKey.trim().length > 0;

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['admin-summary'],
        queryFn: adminApi.getAdminSummary,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getAdminUsers(),
    });

    const { data: activity = [] } = useQuery({
        queryKey: ['admin-activity'],
        queryFn: () => adminApi.getAdminActivity({ limit: 20 }),
    });

    const { data: billingLedger = [] } = useQuery({
        queryKey: ['admin-billing-ledger'],
        queryFn: () => adminApi.getAdminBillingLedger({ limit: 20 }),
    });

    const resetMutation = useMutation({
        mutationFn: adminApi.demoReset,
        onSuccess: () => {
            queryClient.invalidateQueries();
            toast.success('Demo data reset');
            setResetConfirm('');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Reset failed'),
    });

    const pruneMutation = useMutation({
        mutationFn: (dryRun: boolean) => {
            const retentionDays = Number.parseInt(pruneRetention, 10);
            return adminApi.pruneAudit({
                retention_days: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 90,
                dry_run: dryRun,
            });
        },
        onSuccess: (r, dryRun) => {
            queryClient.invalidateQueries({ queryKey: ['admin-activity'] });
            if (dryRun) {
                toast.success(`Preview: ${r.deleted} records would be pruned`);
                return;
            }
            toast.success(`Pruned ${r.deleted} records`);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Prune failed'),
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Admin" description="System administration and monitoring" icon={ShieldCheck} />

            <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                <h2 className="mb-2 font-heading text-base font-semibold">Admin API Key</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    Required for destructive admin actions like demo reset and audit prune.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 space-y-2">
                        <label htmlFor="admin-api-key" className="text-xs font-medium text-muted-foreground">
                            x-admin-key
                        </label>
                        <input
                            id="admin-api-key"
                            type="password"
                            autoComplete="off"
                            value={adminApiKey}
                            onChange={(e) => setAdminApiKey(e.target.value)}
                            placeholder="Enter admin API key"
                            className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={clearAdminApiKey}
                            disabled={!hasAdminApiKey}
                            className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground shadow-none hover:text-foreground disabled:opacity-40"
                        >
                            Clear Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {summaryLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : summary && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Users" value={summary.users} icon={Users} />
                    <StatCard label="Estimates" value={summary.estimates} icon={ClipboardList} />
                    <StatCard label="Line Items" value={summary.line_items} icon={Package} />
                    <StatCard label="Billing Total" value={formatMoney(summary.billing_total_amount)} icon={CreditCard} />
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Users */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Users ({users.length})</h2>
                    {users.length === 0 ? (
                        <EmptyState icon={Users} title="No users" />
                    ) : (
                        <div className="max-h-80 space-y-2 overflow-y-auto">
                            {users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:bg-surface-hover">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium">{u.full_name || u.email}</p>
                                            {u.stripe_subscription_id && (
                                                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-500 ring-1 ring-sky-500/20 ring-inset">Stripe Sub</span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 flex flex-col gap-1 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{u.email}</span>
                                                <StatusBadge status={u.role === 'admin' ? 'active' : 'draft'} className="text-[10px]" />
                                            </div>
                                            {u.stripe_customer_id && (
                                                <p className="font-mono text-[9px] text-muted-foreground/50">{u.stripe_customer_id}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-medium">{u.estimates_count}</p>
                                        <p className="text-xs text-muted">estimates</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Recent Activity</h2>
                    {activity.length === 0 ? (
                        <EmptyState icon={Activity} title="No recent activity" />
                    ) : (
                        <div className="max-h-80 space-y-1.5 overflow-y-auto">
                            {activity.map((a) => (
                                <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-2.5 transition-colors hover:bg-surface-hover">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={a.action} size="sm" />
                                            <span className="truncate text-xs text-muted-foreground">on {a.entity_type}</span>
                                        </div>
                                    </div>
                                    <p className="shrink-0 text-xs text-muted">{formatDate(a.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-destructive/30 bg-destructive-muted/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-destructive" />
                    <h2 className="font-heading text-base font-semibold text-destructive">Danger Zone</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Demo Reset */}
                    <div className="space-y-3 rounded-xl border border-destructive/20 bg-background/30 p-4">
                        <h3 className="text-sm font-semibold">Demo Reset</h3>
                        <p className="text-xs text-muted-foreground">Wipe all data and start fresh. Type "RESET" to confirm.</p>
                        <input
                            value={resetConfirm}
                            onChange={(e) => setResetConfirm(e.target.value)}
                            placeholder='Type "RESET"'
                            className="w-full rounded-xl border border-input-border bg-input px-3 py-2 text-sm placeholder:text-muted outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                        />
                        <button
                            onClick={() => resetMutation.mutate()}
                            disabled={resetConfirm !== 'RESET' || resetMutation.isPending || !hasAdminApiKey}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-md hover:bg-destructive-hover disabled:opacity-30"
                        >
                            {resetMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" /> : <RotateCcw size={14} />}
                            Reset Demo
                        </button>
                    </div>

                    {/* Audit Prune */}
                    <div className="space-y-3 rounded-xl border border-destructive/20 bg-background/30 p-4">
                        <h3 className="text-sm font-semibold">Audit Prune</h3>
                        <p className="text-xs text-muted-foreground">Preview or delete audit records older than retention days.</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={pruneRetention}
                                onChange={(e) => setPruneRetention(e.target.value)}
                                className="w-full rounded-xl border border-input-border bg-input px-3 py-2 text-sm outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                            />
                            <span className="shrink-0 text-xs text-muted-foreground">days</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                onClick={() => pruneMutation.mutate(true)}
                                disabled={pruneMutation.isPending || !hasAdminApiKey}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold text-foreground shadow-none hover:bg-surface-hover disabled:opacity-30"
                            >
                                {pruneMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" /> : <Trash2 size={14} />}
                                Preview
                            </button>
                            <button
                                onClick={() => pruneMutation.mutate(false)}
                                disabled={pruneMutation.isPending || !hasAdminApiKey}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive shadow-none hover:bg-destructive/20 disabled:opacity-30"
                            >
                                {pruneMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive/30 border-t-destructive" /> : <Trash2 size={14} />}
                                Prune Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-heading text-base font-semibold">Billing Ledger</h2>
                {billingLedger.length === 0 ? (
                    <EmptyState icon={CreditCard} title="No billing events" />
                ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                        {billingLedger.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:bg-surface-hover">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={entry.event_type} size="sm" />
                                            <span className="truncate text-xs text-muted-foreground">{entry.user_id}</span>
                                        </div>
                                        {entry.details && (
                                            <p className="mt-1 truncate text-xs text-muted-foreground">{entry.details}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold">{formatMoney(entry.amount)}</p>
                                        <p className="text-xs text-muted">{formatDate(entry.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
