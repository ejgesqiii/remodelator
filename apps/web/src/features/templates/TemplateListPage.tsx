import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FileStack, Play, Clock, X } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import * as templatesApi from '@/api/templates';
import * as estimatesApi from '@/api/estimates';
import { toast } from 'sonner';

export function TemplateListPage() {
    const queryClient = useQueryClient();
    const [showApply, setShowApply] = useState<string | null>(null);
    const [applyEstimateId, setApplyEstimateId] = useState('');

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: templatesApi.listTemplates,
    });

    const { data: estimates = [] } = useQuery({
        queryKey: ['estimates'],
        queryFn: estimatesApi.listEstimates,
    });

    const applyMutation = useMutation({
        mutationFn: (data: { template_id: string; estimate_id: string }) =>
            templatesApi.applyTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
            toast.success('Template applied to estimate');
            setShowApply(null);
            setApplyEstimateId('');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Apply failed'),
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Templates" description="Save and reuse estimate templates" icon={FileStack} />

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
            ) : templates.length === 0 ? (
                <EmptyState
                    icon={FileStack}
                    title="No templates yet"
                    description="Save an estimate as a template to reuse it later. Templates preserve all line items and can be applied to new estimates."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => (
                        <div key={t.id} className="group rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-surface-hover">
                            <div className="mb-3 flex items-start justify-between">
                                <h3 className="font-heading text-base font-semibold group-hover:text-primary">{t.name}</h3>
                                <button
                                    onClick={() => setShowApply(t.id)}
                                    className="rounded-lg bg-primary/10 p-2 text-primary shadow-none transition-colors hover:bg-primary/20"
                                    aria-label={`Apply template ${t.name}`}
                                >
                                    <Play size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileStack size={14} className="text-muted" />
                                <span>{t.line_item_count} line items</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                                <Clock size={12} />
                                <span>{formatDate(t.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Apply template dialog */}
            {showApply && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-heading text-lg font-semibold">Apply Template</h3>
                            <button onClick={() => setShowApply(null)} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none hover:bg-surface-hover hover:text-foreground"><X size={18} /></button>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Select an estimate to apply template line items to.
                        </p>
                        <select
                            value={applyEstimateId}
                            onChange={(e) => setApplyEstimateId(e.target.value)}
                            className="mb-4 w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Choose an estimate...</option>
                            {estimates.map((e) => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => applyMutation.mutate({ template_id: showApply, estimate_id: applyEstimateId })}
                                disabled={!applyEstimateId || applyMutation.isPending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50"
                            >
                                {applyMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Play size={16} />}
                                Apply
                            </button>
                            <button onClick={() => setShowApply(null)} className="rounded-xl bg-transparent px-4 py-3 text-sm text-muted-foreground shadow-none hover:text-foreground">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
