import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/data-display/StatCard';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SkeletonCard } from '@/components/feedback/LoadingSkeleton';
import {
    LayoutDashboard, ClipboardList, Package, CreditCard,
    Plus, ArrowRight, Clock, AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import * as estimatesApi from '@/api/estimates';
import * as billingApi from '@/api/billing';
import * as llmApi from '@/api/llm';

export function DashboardPage() {
    const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
        queryKey: ['estimates'],
        queryFn: estimatesApi.listEstimates,
    });

    const { data: subscription } = useQuery({
        queryKey: ['billing-subscription'],
        queryFn: billingApi.getSubscriptionState,
    });

    const { data: llmStatus } = useQuery({
        queryKey: ['llm-status'],
        queryFn: llmApi.getLlmStatus,
        staleTime: 60_000,
    });

    const recentEstimates = estimates.slice(0, 5);
    const activeCount = estimates.filter((e) => e.status === 'in_progress' || e.status === 'draft').length;
    const completedCount = estimates.filter((e) => e.status === 'completed').length;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Dashboard"
                description="Your remodeling business at a glance"
                icon={LayoutDashboard}
            />

            {/* Stats */}
            {estimatesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Estimates" value={estimates.length} icon={ClipboardList} />
                    <StatCard label="Active" value={activeCount} icon={Clock} />
                    <StatCard label="Completed" value={completedCount} icon={Package} />
                    <StatCard
                        label="Subscription"
                        value={subscription?.active ? 'Active' : 'Inactive'}
                        icon={CreditCard}
                    />
                </div>
            )}

            {/* System status */}
            {(llmStatus?.blocker_reason || (subscription && !subscription.active)) && (
                <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-warning" />
                    <div className="space-y-1">
                        {llmStatus?.blocker_reason && (
                            <p className="text-warning">LLM: {llmStatus.blocker_reason}</p>
                        )}
                        {subscription && !subscription.active && (
                            <p className="text-warning">Subscription: {subscription.status}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick actions */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Quick Actions</h2>
                    <div className="space-y-2">
                        <Link
                            to="/estimates"
                            className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-xl"
                        >
                            <Plus size={18} /> New Estimate
                        </Link>
                        <Link
                            to="/catalog"
                            className="flex items-center gap-3 rounded-xl border border-border bg-surface-hover px-4 py-3 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"
                        >
                            <Package size={18} className="text-muted" /> Browse Catalog
                        </Link>
                        <Link
                            to="/billing"
                            className="flex items-center gap-3 rounded-xl border border-border bg-surface-hover px-4 py-3 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"
                        >
                            <CreditCard size={18} className="text-muted" /> Billing & Usage
                        </Link>
                    </div>
                </div>

                {/* Recent estimates */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-heading text-base font-semibold">Recent Estimates</h2>
                        <Link to="/estimates" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    {estimatesLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => <div key={i} className="animate-skeleton h-16 rounded-xl bg-border" />)}
                        </div>
                    ) : recentEstimates.length === 0 ? (
                        <EmptyState
                            icon={ClipboardList}
                            title="No estimates yet"
                            description="Create your first estimate to get started"
                            action={
                                <Link to="/estimates" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover">
                                    <Plus size={16} /> Create Estimate
                                </Link>
                            }
                        />
                    ) : (
                        <div className="space-y-2">
                            {recentEstimates.map((est) => (
                                <Link
                                    key={est.id}
                                    to={`/estimates/${est.id}`}
                                    className="group flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3 transition-all hover:border-primary/20 hover:bg-surface-hover"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium group-hover:text-primary">{est.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {est.customer_name || 'No customer'} · {formatDate(est.updated_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MoneyDisplay value={est.total} size="sm" />
                                        <StatusBadge status={est.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
