import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, X } from 'lucide-react';
import * as estimatesApi from '@/api/estimates';
import * as catalogApi from '@/api/catalog';
import { toast } from 'sonner';

interface QuickstartDialogProps {
    estimateId: string;
    open: boolean;
    onClose: () => void;
}

export function QuickstartDialog({ estimateId, open, onClose }: QuickstartDialogProps) {
    const queryClient = useQueryClient();
    const [selectedRoom, setSelectedRoom] = useState('');
    const [maxItems, setMaxItems] = useState('10');

    const { data: tree = [] } = useQuery({
        queryKey: ['catalog-tree'],
        queryFn: catalogApi.getCatalogTree,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: () =>
            estimatesApi.quickstartEstimate(estimateId, {
                catalog_node_name: selectedRoom,
                max_items: parseInt(maxItems) || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
            toast.success('Starter items added!');
            onClose();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Quickstart failed'),
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
                        <Zap size={20} className="text-warning" />
                        Quick Start
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    Populate this estimate with common items from a catalog category.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room / Category</label>
                        <select
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value)}
                            className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Select a category...</option>
                            {tree.map((node) => (
                                <option key={node.name} value={node.name}>
                                    {node.name} ({node.items.length} items)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Max Items</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={maxItems}
                            onChange={(e) => setMaxItems(e.target.value)}
                            className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={!selectedRoom || mutation.isPending}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                            ) : (
                                <Zap size={16} />
                            )}
                            Add Items
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-xl bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
