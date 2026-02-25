import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
    ClipboardList, Plus, Trash2, Pencil, ChevronUp, ChevronDown,
    RotateCcw, Copy, GitBranch, Lock, Unlock, FileText,
    ArrowLeft, Save, Zap, Download,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney, formatStatus } from '@/lib/formatters';
import * as estimatesApi from '@/api/estimates';
import { toast } from 'sonner';
import { LlmAssistPanel } from './LlmAssistPanel';
import { QuickstartDialog } from './QuickstartDialog';
import { LineItemEditor } from './LineItemEditor';
import type { LineItem } from '@/api/types';

export function EstimateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: estimate, isLoading } = useQuery({
        queryKey: ['estimate', id],
        queryFn: () => estimatesApi.getEstimate(id!),
        enabled: !!id,
    });

    const [editingDetails, setEditingDetails] = useState(false);
    const [detailForm, setDetailForm] = useState({
        customer_name: '', customer_email: '', customer_phone: '',
        job_address: '', estimate_markup_pct: '', tax_rate_pct: '',
    });

    const [addingItem, setAddingItem] = useState(false);
    const [itemForm, setItemForm] = useState({
        item_name: '', quantity: '', unit_price: '', labor_hours: '0',
        item_markup_pct: '0', discount_value: '0', group_name: '',
    });

    const [quickstartOpen, setQuickstartOpen] = useState(false);
    const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['estimate', id] });
        queryClient.invalidateQueries({ queryKey: ['estimates'] });
    };

    const updateMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => estimatesApi.updateEstimate(id!, data),
        onSuccess: () => { invalidate(); setEditingDetails(false); toast.success('Estimate updated'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
    });

    const addItemMutation = useMutation({
        mutationFn: (data: Parameters<typeof estimatesApi.addLineItem>[1]) => estimatesApi.addLineItem(id!, data),
        onSuccess: () => { invalidate(); setAddingItem(false); setItemForm({ item_name: '', quantity: '', unit_price: '', labor_hours: '0', item_markup_pct: '0', discount_value: '0', group_name: '' }); toast.success('Line item added'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add item'),
    });

    const deleteItemMutation = useMutation({
        mutationFn: (lineItemId: string) => estimatesApi.deleteLineItem(id!, lineItemId),
        onSuccess: () => { invalidate(); toast.success('Line item removed'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove item'),
    });

    const reorderMutation = useMutation({
        mutationFn: ({ lineItemId, direction }: { lineItemId: string; direction: number }) =>
            estimatesApi.reorderLineItem(id!, lineItemId, direction),
        onSuccess: () => invalidate(),
    });

    const recalcMutation = useMutation({
        mutationFn: () => estimatesApi.recalcEstimate(id!),
        onSuccess: () => { invalidate(); toast.success('Totals recalculated'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Recalc failed'),
    });

    const exportMutation = useMutation({
        mutationFn: () => estimatesApi.exportEstimate(id!),
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estimate-${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Estimate exported');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Export failed'),
    });

    const actionMutation = useMutation({
        mutationFn: (action: string) => {
            switch (action) {
                case 'duplicate': return estimatesApi.duplicateEstimate(id!);
                case 'version': return estimatesApi.versionEstimate(id!);
                case 'unlock': return estimatesApi.unlockEstimate(id!);
                default: return Promise.reject(new Error('Unknown action'));
            }
        },
        onSuccess: (_, action) => {
            invalidate();
            toast.success(`Estimate ${action === 'duplicate' ? 'duplicated' : action === 'version' ? 'versioned' : 'unlocked'}`);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Action failed'),
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => estimatesApi.setEstimateStatus(id!, status),
        onSuccess: () => { invalidate(); toast.success('Status updated'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Status update failed'),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-skeleton h-10 w-1/3 rounded-xl bg-border" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="animate-skeleton h-48 rounded-2xl bg-border" />
                        <div className="animate-skeleton h-72 rounded-2xl bg-border" />
                    </div>
                    <div className="space-y-4">
                        <div className="animate-skeleton h-40 rounded-2xl bg-border" />
                        <div className="animate-skeleton h-56 rounded-2xl bg-border" />
                    </div>
                </div>
            </div>
        );
    }

    if (!estimate) {
        return (
            <div className="flex flex-col items-center py-20 text-center">
                <p className="text-lg text-muted-foreground">Estimate not found</p>
                <Link to="/estimates" className="mt-4 text-sm text-primary hover:underline">Back to estimates</Link>
            </div>
        );
    }

    const lines = estimate.line_items || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/estimates" className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
                    <ArrowLeft size={20} />
                </Link>
                <PageHeader
                    title={estimate.title}
                    icon={ClipboardList}
                    actions={
                        <div className="flex items-center gap-2">
                            <StatusBadge status={estimate.status} size="md" />
                            <span className="font-mono text-sm text-muted-foreground">v{estimate.version}</span>
                        </div>
                    }
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ─── Main content (2 cols) ─── */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Customer Details */}
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-heading text-base font-semibold">Customer & Project</h2>
                            <button
                                onClick={() => {
                                    if (!editingDetails) {
                                        setDetailForm({
                                            customer_name: estimate.customer_name || '',
                                            customer_email: estimate.customer_email || '',
                                            customer_phone: estimate.customer_phone || '',
                                            job_address: estimate.job_address || '',
                                            estimate_markup_pct: estimate.estimate_markup_pct || '',
                                            tax_rate_pct: estimate.tax_rate_pct || '',
                                        });
                                    }
                                    setEditingDetails(!editingDetails);
                                }}
                                className="rounded-lg bg-transparent p-2 text-muted shadow-none transition-colors hover:bg-surface-hover hover:text-foreground"
                            >
                                <Pencil size={16} />
                            </button>
                        </div>

                        {editingDetails ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    updateMutation.mutate({
                                        customer_name: detailForm.customer_name,
                                        customer_email: detailForm.customer_email,
                                        customer_phone: detailForm.customer_phone,
                                        job_address: detailForm.job_address,
                                        estimate_markup_pct: detailForm.estimate_markup_pct ? parseFloat(detailForm.estimate_markup_pct) : undefined,
                                        tax_rate_pct: detailForm.tax_rate_pct ? parseFloat(detailForm.tax_rate_pct) : undefined,
                                    });
                                }}
                                className="space-y-3"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {(['customer_name', 'customer_email', 'customer_phone', 'job_address', 'estimate_markup_pct', 'tax_rate_pct'] as const).map((field) => (
                                        <input
                                            key={field}
                                            value={detailForm[field]}
                                            onChange={(e) => setDetailForm({ ...detailForm, [field]: e.target.value })}
                                            placeholder={field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                            className="w-full rounded-xl border border-input-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover disabled:opacity-50">
                                        <Save size={14} /> Save
                                    </button>
                                    <button type="button" onClick={() => setEditingDetails(false)} className="rounded-xl bg-transparent px-4 py-2 text-sm text-muted-foreground shadow-none hover:text-foreground">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{estimate.customer_name || '—'}</span></div>
                                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{estimate.customer_email || '—'}</span></div>
                                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{estimate.customer_phone || '—'}</span></div>
                                <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{estimate.job_address || '—'}</span></div>
                                <div><span className="text-muted-foreground">Markup:</span> <span className="font-medium">{estimate.estimate_markup_pct || '0'}%</span></div>
                                <div><span className="text-muted-foreground">Tax Rate:</span> <span className="font-medium">{estimate.tax_rate_pct || '0'}%</span></div>
                            </div>
                        )}
                    </div>

                    {/* Line Items */}
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-heading text-base font-semibold">Line Items ({lines.length})</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setQuickstartOpen(true)}
                                    className="flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning shadow-none transition-colors hover:bg-warning/20"
                                >
                                    <Zap size={14} /> Quick Start
                                </button>
                                <button
                                    onClick={() => setAddingItem(!addingItem)}
                                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary-hover"
                                >
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>
                        </div>

                        {/* Add item form */}
                        {addingItem && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addItemMutation.mutate({
                                        item_name: itemForm.item_name,
                                        quantity: parseFloat(itemForm.quantity) || 1,
                                        unit_price: parseFloat(itemForm.unit_price) || 0,
                                        labor_hours: parseFloat(itemForm.labor_hours) || 0,
                                        item_markup_pct: parseFloat(itemForm.item_markup_pct) || 0,
                                        discount_value: parseFloat(itemForm.discount_value) || 0,
                                        group_name: itemForm.group_name || undefined,
                                    });
                                }}
                                className="mb-4 space-y-3 rounded-xl border border-primary/20 bg-background/50 p-4"
                            >
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <input value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} placeholder="Item name *" required className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} placeholder="Quantity" type="number" step="any" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })} placeholder="Unit price" type="number" step="0.01" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <input value={itemForm.labor_hours} onChange={(e) => setItemForm({ ...itemForm, labor_hours: e.target.value })} placeholder="Labor hours" type="number" step="any" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.item_markup_pct} onChange={(e) => setItemForm({ ...itemForm, item_markup_pct: e.target.value })} placeholder="Markup %" type="number" step="any" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.group_name} onChange={(e) => setItemForm({ ...itemForm, group_name: e.target.value })} placeholder="Group" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={addItemMutation.isPending} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover disabled:opacity-50">
                                        {addItemMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Plus size={14} />}
                                        Add
                                    </button>
                                    <button type="button" onClick={() => setAddingItem(false)} className="rounded-xl bg-transparent px-3 py-2 text-sm text-muted-foreground shadow-none hover:text-foreground">Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Line items table */}
                        {lines.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="No line items yet"
                                description="Add items manually or use Quick Start to populate from catalog"
                                action={
                                    <button
                                        onClick={() => setQuickstartOpen(true)}
                                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover"
                                    >
                                        <Zap size={16} /> Quick Start from Catalog
                                    </button>
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                                            <th className="py-3 pr-4">Item</th>
                                            <th className="px-3 py-3 text-right">Qty</th>
                                            <th className="px-3 py-3 text-right">Price</th>
                                            <th className="px-3 py-3 text-right">Total</th>
                                            <th className="px-3 py-3">Group</th>
                                            <th className="py-3 pl-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {lines.map((line, idx) => (
                                            <tr key={line.id} className="group transition-colors hover:bg-surface-hover">
                                                <td className="py-3 pr-4">
                                                    <button
                                                        onClick={() => setEditingLineItem(line)}
                                                        className="font-medium text-foreground transition-colors hover:text-primary"
                                                    >
                                                        {line.item_name}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono">{line.quantity}</td>
                                                <td className="px-3 py-3 text-right font-mono">{formatMoney(line.unit_price)}</td>
                                                <td className="px-3 py-3 text-right font-mono font-semibold">{formatMoney(line.total_price)}</td>
                                                <td className="px-3 py-3 text-muted-foreground">{line.group_name || '—'}</td>
                                                <td className="py-3 pl-3">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button onClick={() => setEditingLineItem(line)} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground" aria-label="Edit">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => reorderMutation.mutate({ lineItemId: line.id, direction: -1 })} disabled={idx === 0} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground disabled:opacity-30" aria-label="Move up"><ChevronUp size={14} /></button>
                                                        <button onClick={() => reorderMutation.mutate({ lineItemId: line.id, direction: 1 })} disabled={idx === lines.length - 1} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground disabled:opacity-30" aria-label="Move down"><ChevronDown size={14} /></button>
                                                        <button onClick={() => { if (confirm(`Remove "${line.item_name}"?`)) deleteItemMutation.mutate(line.id); }} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Right sidebar ─── */}
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <h3 className="mb-4 font-heading text-base font-semibold">Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><MoneyDisplay value={estimate.subtotal} size="sm" /></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({estimate.tax_rate_pct || '0'}%)</span><MoneyDisplay value={estimate.tax} size="sm" /></div>
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between"><span className="font-semibold">Total</span><MoneyDisplay value={estimate.total} size="xl" className="text-primary" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <h3 className="mb-4 font-heading text-base font-semibold">Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => recalcMutation.mutate()} disabled={recalcMutation.isPending} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active disabled:opacity-50"><RotateCcw size={16} className="text-muted" /> Recalculate</button>
                            <button onClick={() => actionMutation.mutate('duplicate')} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"><Copy size={16} className="text-muted" /> Duplicate</button>
                            <button onClick={() => actionMutation.mutate('version')} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"><GitBranch size={16} className="text-muted" /> Create Version</button>
                            <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active disabled:opacity-50"><Download size={16} className="text-muted" /> Export JSON</button>
                            {estimate.status === 'locked' ? (
                                <button onClick={() => actionMutation.mutate('unlock')} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"><Unlock size={16} className="text-muted" /> Unlock</button>
                            ) : (
                                <button onClick={() => statusMutation.mutate('locked')} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"><Lock size={16} className="text-muted" /> Lock</button>
                            )}
                            <div className="border-t border-border pt-2">
                                <Link to={`/estimates/${id}/proposal`} className="flex w-full items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-active"><FileText size={16} className="text-muted" /> View Proposal</Link>
                            </div>
                        </div>
                    </div>

                    {/* Status control */}
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <h3 className="mb-4 font-heading text-base font-semibold">Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['draft', 'in_progress', 'completed', 'locked'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => statusMutation.mutate(s)}
                                    disabled={estimate.status === s || statusMutation.isPending}
                                    className={cn(
                                        'rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-30',
                                        estimate.status === s
                                            ? 'border border-primary/30 bg-primary/10 text-primary'
                                            : 'border border-border bg-surface-hover text-muted-foreground shadow-none hover:text-foreground'
                                    )}
                                >
                                    {formatStatus(s)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LLM Assist */}
                    {lines.length > 0 && (
                        <LlmAssistPanel
                            estimateId={id!}
                            lineItems={lines}
                            onApplied={invalidate}
                        />
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <QuickstartDialog
                estimateId={id!}
                open={quickstartOpen}
                onClose={() => setQuickstartOpen(false)}
            />

            {editingLineItem && (
                <LineItemEditor
                    estimateId={id!}
                    lineItem={editingLineItem}
                    onClose={() => setEditingLineItem(null)}
                />
            )}
        </div>
    );
}
