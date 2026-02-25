import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
    ClipboardList, Plus, Search, ArrowRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';
import * as estimatesApi from '@/api/estimates';
import { toast } from 'sonner';

export function EstimateListPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCustomer, setNewCustomer] = useState('');

    const { data: estimates = [], isLoading } = useQuery({
        queryKey: ['estimates'],
        queryFn: estimatesApi.listEstimates,
    });

    const createMutation = useMutation({
        mutationFn: estimatesApi.createEstimate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
            setShowCreateForm(false);
            setNewTitle('');
            setNewCustomer('');
            toast.success('Estimate created');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create estimate'),
    });

    const filtered = estimates.filter((e) => {
        const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.customer_name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Estimates"
                description="Create and manage project estimates"
                icon={ClipboardList}
                actions={
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
                    >
                        <Plus size={18} />
                        New Estimate
                    </button>
                }
            />

            {/* Create estimate form */}
            {showCreateForm && (
                <div className="rounded-2xl border border-primary/20 bg-surface p-6 shadow-glow">
                    <h3 className="mb-4 font-heading text-lg font-semibold">Create New Estimate</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!newTitle.trim()) return;
                            createMutation.mutate({ title: newTitle, customer_name: newCustomer || undefined });
                        }}
                        className="space-y-4"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title *</label>
                                <input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Smith Bathroom Remodel"
                                    className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Customer Name</label>
                                <input
                                    value={newCustomer}
                                    onChange={(e) => setNewCustomer(e.target.value)}
                                    placeholder="e.g. Jane Smith"
                                    className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50"
                            >
                                {createMutation.isPending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                ) : (
                                    <Plus size={16} />
                                )}
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="rounded-xl bg-transparent px-4 py-2.5 text-sm text-muted-foreground shadow-none hover:text-foreground"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search estimates..."
                        className="w-full rounded-xl border border-input-border bg-input py-2.5 pl-10 pr-4 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-input-border bg-input px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="locked">Locked</option>
                </select>
            </div>

            {/* Estimate cards */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-skeleton rounded-2xl border border-border bg-surface/80 p-6">
                            <div className="mb-3 h-5 w-2/3 rounded bg-border" />
                            <div className="mb-2 h-4 w-1/2 rounded bg-border" />
                            <div className="h-4 w-1/3 rounded bg-border" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title={search || statusFilter !== 'all' ? 'No estimates match your filters' : 'No estimates yet'}
                    description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Click "New Estimate" to get started'}
                    action={
                        !search && statusFilter === 'all' ? (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover"
                            >
                                <Plus size={16} /> Create Estimate
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((est) => (
                        <Link
                            key={est.id}
                            to={`/estimates/${est.id}`}
                            className="group rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface-hover hover:shadow-glow"
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <h3 className="truncate font-heading text-base font-semibold group-hover:text-primary">{est.title}</h3>
                                <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </div>
                            <p className="mb-4 truncate text-sm text-muted-foreground">
                                {est.customer_name || 'No customer assigned'}
                            </p>
                            <div className="flex items-center justify-between">
                                <StatusBadge status={est.status} />
                                <MoneyDisplay value={est.total} size="lg" />
                            </div>
                            {est.updated_at && (
                                <p className="mt-3 text-xs text-muted">{formatRelativeTime(est.updated_at)}</p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
