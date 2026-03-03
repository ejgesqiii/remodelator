import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import * as estimatesApi from '@/api/estimates';
import type { LineItem } from '@/api/types';
import { formatDecimal, formatMoney } from '@/lib/formatters';
import { toast } from 'sonner';

interface LineItemEditorProps {
    estimateId: string;
    lineItem: LineItem;
    onClose: () => void;
}

export function LineItemEditor({ estimateId, lineItem, onClose }: LineItemEditorProps) {
    const queryClient = useQueryClient();
    const initialQuantity = Number.isFinite(Number(lineItem.quantity))
        ? String(Math.trunc(Number(lineItem.quantity)))
        : lineItem.quantity;
    const [form, setForm] = useState({
        quantity: initialQuantity,
        unit_price: formatDecimal(lineItem.unit_price),
        item_markup_pct: formatDecimal(lineItem.item_markup_pct),
        labor_hours: formatDecimal(lineItem.labor_hours),
        labor_trade: lineItem.labor_trade || 'remodeler',
        remodeler_labor_hours: formatDecimal(lineItem.remodeler_labor_hours ?? ((lineItem.labor_trade || 'remodeler') === 'remodeler' ? lineItem.labor_hours : '0')),
        plumber_labor_hours: formatDecimal(lineItem.plumber_labor_hours ?? ((lineItem.labor_trade || 'remodeler') === 'plumber' ? lineItem.labor_hours : '0')),
        tinner_labor_hours: formatDecimal(lineItem.tinner_labor_hours ?? ((lineItem.labor_trade || 'remodeler') === 'tinner' ? lineItem.labor_hours : '0')),
        electrician_labor_hours: formatDecimal(lineItem.electrician_labor_hours ?? ((lineItem.labor_trade || 'remodeler') === 'electrician' ? lineItem.labor_hours : '0')),
        designer_labor_hours: formatDecimal(lineItem.designer_labor_hours ?? ((lineItem.labor_trade || 'remodeler') === 'designer' ? lineItem.labor_hours : '0')),
        labor_rate: formatDecimal(lineItem.labor_rate),
        discount_value: formatDecimal(lineItem.discount_value),
        discount_is_percent: lineItem.discount_is_percent,
        group_name: lineItem.group_name,
    });

    const mutation = useMutation({
        mutationFn: () =>
            estimatesApi.updateLineItem(estimateId, lineItem.id, {
                quantity: parseIntegerOrUndefined(form.quantity),
                unit_price: parseDecimalOrUndefined(form.unit_price),
                item_markup_pct: parseDecimalOrUndefined(form.item_markup_pct),
                labor_hours:
                    (parseDecimalOrUndefined(form.remodeler_labor_hours) ?? 0)
                    + (parseDecimalOrUndefined(form.plumber_labor_hours) ?? 0)
                    + (parseDecimalOrUndefined(form.tinner_labor_hours) ?? 0)
                    + (parseDecimalOrUndefined(form.electrician_labor_hours) ?? 0)
                    + (parseDecimalOrUndefined(form.designer_labor_hours) ?? 0),
                labor_trade: form.labor_trade || undefined,
                remodeler_labor_hours: parseDecimalOrUndefined(form.remodeler_labor_hours),
                plumber_labor_hours: parseDecimalOrUndefined(form.plumber_labor_hours),
                tinner_labor_hours: parseDecimalOrUndefined(form.tinner_labor_hours),
                electrician_labor_hours: parseDecimalOrUndefined(form.electrician_labor_hours),
                designer_labor_hours: parseDecimalOrUndefined(form.designer_labor_hours),
                discount_value: parseDecimalOrUndefined(form.discount_value),
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

    const parseDecimalOrUndefined = (value: string): number | undefined => {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const parseIntegerOrUndefined = (value: string): number | undefined => {
        if (value.trim() === '') return undefined;
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
            return undefined;
        }
        return parsed;
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
                        if (form.quantity !== '' && parseIntegerOrUndefined(form.quantity) === undefined) {
                            toast.error('Quantity must be a whole number');
                            return;
                        }
                        mutation.mutate();
                    }}
                    className="space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                            <input type="number" step="1" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className={inputClass} />
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
                            <label className="text-xs font-medium text-muted-foreground">Labor Hours Total</label>
                            <input type="number" value={(
                                (parseDecimalOrUndefined(form.remodeler_labor_hours) ?? 0)
                                + (parseDecimalOrUndefined(form.plumber_labor_hours) ?? 0)
                                + (parseDecimalOrUndefined(form.tinner_labor_hours) ?? 0)
                                + (parseDecimalOrUndefined(form.electrician_labor_hours) ?? 0)
                                + (parseDecimalOrUndefined(form.designer_labor_hours) ?? 0)
                            ).toFixed(2)} readOnly className={`${inputClass} bg-surface/60 text-muted-foreground`} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Remodeler Hours</label>
                            <input type="number" min="0" step="0.01" value={form.remodeler_labor_hours} onChange={(e) => update('remodeler_labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Plumber Hours</label>
                            <input type="number" min="0" step="0.01" value={form.plumber_labor_hours} onChange={(e) => update('plumber_labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tinner Hours</label>
                            <input type="number" min="0" step="0.01" value={form.tinner_labor_hours} onChange={(e) => update('tinner_labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Electrician Hours</label>
                            <input type="number" min="0" step="0.01" value={form.electrician_labor_hours} onChange={(e) => update('electrician_labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Designer Hours</label>
                            <input type="number" min="0" step="0.01" value={form.designer_labor_hours} onChange={(e) => update('designer_labor_hours', e.target.value)} className={inputClass} />
                        </div>
                        <div />
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
