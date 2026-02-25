import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Sparkles, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/formatters';
import * as llmApi from '@/api/llm';
import type { LineItem } from '@/api/types';
import { toast } from 'sonner';

interface LlmAssistPanelProps {
    estimateId: string;
    lineItems: LineItem[];
    onApplied: () => void;
}

export function LlmAssistPanel({ estimateId, lineItems, onApplied }: LlmAssistPanelProps) {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [context, setContext] = useState('');

    const { data: status } = useQuery({
        queryKey: ['llm-status'],
        queryFn: llmApi.getLlmStatus,
        staleTime: 60_000,
    });

    const suggestMutation = useMutation({
        mutationFn: (item: LineItem) =>
            llmApi.getLlmSuggestion({
                item_name: item.item_name,
                current_unit_price: parseFloat(item.unit_price),
                context: context || undefined,
            }),
    });

    const applyMutation = useMutation({
        mutationFn: (data: { line_item_id: string; suggested_price: number }) =>
            llmApi.applyLlmSuggestion({
                estimate_id: estimateId,
                line_item_id: data.line_item_id,
                suggested_price: data.suggested_price,
            }),
        onSuccess: () => {
            toast.success('Price suggestion applied');
            setSelectedItemId(null);
            suggestMutation.reset();
            onApplied();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Apply failed'),
    });

    const selectedItem = lineItems.find((li) => li.id === selectedItemId);
    const isReady = status?.api_key_configured && status?.ready_for_live;
    const suggestion = suggestMutation.data;

    return (
        <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
                    <Bot size={18} className="text-accent" />
                    LLM Assist
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'inline-block h-2 w-2 rounded-full',
                            isReady ? 'bg-success' : status?.simulation_available ? 'bg-warning' : 'bg-destructive'
                        )}
                    />
                    <span className="text-xs text-muted-foreground">
                        {isReady ? 'Live' : status?.simulation_available ? 'Simulation' : 'Offline'}
                    </span>
                </div>
            </div>

            {status?.blocker_reason && (
                <div className="mb-3 rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
                    <AlertCircle size={12} className="mr-1 inline" />
                    {status.blocker_reason}
                </div>
            )}

            {/* Item selector */}
            <div className="mb-3 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Select line item</label>
                <select
                    value={selectedItemId || ''}
                    onChange={(e) => {
                        setSelectedItemId(e.target.value || null);
                        suggestMutation.reset();
                    }}
                    className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                    <option value="">Choose an item...</option>
                    {lineItems.map((li) => (
                        <option key={li.id} value={li.id}>
                            {li.item_name} — {formatMoney(li.unit_price)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Context */}
            <div className="mb-3 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Context (optional)</label>
                <input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. mid-range, commercial grade"
                    className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Get suggestion button */}
            <button
                disabled={!selectedItem || suggestMutation.isPending}
                onClick={() => selectedItem && suggestMutation.mutate(selectedItem)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent shadow-none transition-colors hover:bg-accent/25 disabled:opacity-40"
            >
                {suggestMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Sparkles size={16} />
                )}
                Get Price Suggestion
            </button>

            {/* Suggestion result */}
            {suggestion && (
                <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted">Suggestion</span>
                        {suggestion.confidence && (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                                {suggestion.confidence} confidence
                            </span>
                        )}
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-mono font-semibold">{formatMoney(suggestion.current_unit_price)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Suggested</p>
                            <p className="font-mono font-semibold text-accent">{formatMoney(suggestion.suggested_unit_price)}</p>
                        </div>
                    </div>

                    {suggestion.rationale && (
                        <p className="mb-3 text-xs text-muted-foreground">{suggestion.rationale}</p>
                    )}

                    {suggestion.provider && (
                        <p className="mb-3 text-xs text-muted">
                            via {suggestion.provider}/{suggestion.model} ({suggestion.mode})
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                applyMutation.mutate({
                                    line_item_id: selectedItemId!,
                                    suggested_price: parseFloat(suggestion.suggested_unit_price),
                                })
                            }
                            disabled={applyMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground shadow-md transition-colors hover:bg-accent/90 disabled:opacity-50"
                        >
                            <Check size={14} /> Apply
                        </button>
                        <button
                            onClick={() => suggestMutation.reset()}
                            className="flex items-center gap-1.5 rounded-xl bg-surface-hover px-3 py-2 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground"
                        >
                            <X size={14} /> Dismiss
                        </button>
                    </div>
                </div>
            )}

            {suggestMutation.isError && (
                <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive-muted px-3 py-2 text-xs text-destructive">
                    {suggestMutation.error instanceof Error ? suggestMutation.error.message : 'Suggestion failed'}
                </div>
            )}
        </div>
    );
}
