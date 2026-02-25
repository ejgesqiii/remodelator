import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import * as estimatesApi from '@/api/estimates';
import type { LineItem } from '@/api/types';
import { formatMoney } from '@/lib/formatters';
import { toast } from 'sonner';

interface LineItemEditorProps {
    estimateId: string;
    lineItem: LineItem;
    onClose: () => void;
}

export function LineItemEditor({ estimateId, lineItem, onClose }: LineItemEditorProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        quantity: lineItem.quantity,
        unit_price: lineItem.unit_price,
        item_markup_pct: lineItem.item_markup_pct,
        labor_hours: lineItem.labor_hours,
        labor_rate: lineItem.labor_rate,
        discount_value: lineItem.discount_value,
        discount_is_percent: lineItem.discount_is_percent,
        group_name: lineItem.group_name,
    });

    const mutation = useMutation({
        mutationFn: () =>
            estimatesApi.updateLineItem(estimateId, lineItem.id, {
                quantity: parseFloat(form.quantity) || undefined,
                unit_price: parseFloat(form.unit_price) || undefined,
                item_markup_pct: parseFloat(form.item_markup_pct) || undefined,
                labor_hours: parseFloat(form.labor_hours) || undefined,
                discount_value: parseFloat(form.discount_value) || undefined,
                discount_is_percent: form.discount_is_percent,
                group_name: form.group_name || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
            toast.success(`${lineItem.item_name} updated`);
            onClose();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
    });

    const update = (key: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const inputClass =
        'w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-heading text-lg font-semibold">{lineItem.item_name}</h3>
                        <p className="text-sm text-muted-foreground">
                            Current total: {formatMoney(lineItem.total_price)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutation.mutate();
                    }}
                    className="space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                            <input type="number" step="any" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Unit Price ($)</label>
                            <input type="number" step="0.01" value={form.unit_price} onChange={(e) => update('unit_price', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Markup %</label>
                            <input type="number" step="any" value={form.item_markup_pct} onChange={(e) => update('item_markup_pct', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Labor Hours</label>
                            <input type="number" step="any" value={form.labor_hours} onChange={(e) => update('labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Discount</label>
                            <input type="number" step="any" value={form.discount_value} onChange={(e) => update('discount_value', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Discount Type</label>
                            <select
                                value={form.discount_is_percent ? 'percent' : 'flat'}
                                onChange={(e) => update('discount_is_percent', e.target.value === 'percent')}
                                className={inputClass}
                            >
                                <option value="flat">Flat ($)</option>
                                <option value="percent">Percent (%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Group</label>
                        <input value={form.group_name} onChange={(e) => update('group_name', e.target.value)} placeholder="e.g. Plumbing" className={inputClass} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
