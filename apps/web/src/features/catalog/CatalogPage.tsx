import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import {
    Package, Search, Plus, ChevronRight, ChevronDown, Pencil, X, Save,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/useDebounce';
import * as catalogApi from '@/api/catalog';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { CatalogItem } from '@/api/types';

export function CatalogPage() {
    const queryClient = useQueryClient();
    const role = useAuthStore((s) => s.role);
    const canManageCatalog = role === 'admin';
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showUpsert, setShowUpsert] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [upsertForm, setUpsertForm] = useState({ name: '', unit_price: '', labor_hours: '', category: '' });

    const { data: tree = [], isLoading } = useQuery({
        queryKey: ['catalog-tree'],
        queryFn: catalogApi.getCatalogTree,
    });

    const { data: searchResults } = useQuery({
        queryKey: ['catalog-search', debouncedSearch],
        queryFn: () => catalogApi.searchCatalog(debouncedSearch),
        enabled: debouncedSearch.length >= 2,
    });

    const upsertMutation = useMutation({
        mutationFn: (data: { name: string; unit_price: number; labor_hours: number; category?: string }) =>
            catalogApi.upsertCatalogItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-tree'] });
            queryClient.invalidateQueries({ queryKey: ['catalog-search'] });
            toast.success(editingItem ? 'Item updated' : 'Item added');
            resetUpsert();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
    });

    const resetUpsert = () => {
        setShowUpsert(false);
        setEditingItem(null);
        setUpsertForm({ name: '', unit_price: '', labor_hours: '', category: '' });
    };

    const openEdit = (item: CatalogItem) => {
        setEditingItem(item);
        setUpsertForm({ name: item.name, unit_price: item.unit_price, labor_hours: item.labor_hours, category: '' });
        setShowUpsert(true);
    };

    const toggleNode = (name: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    // Get items for selected category
    const categoryItems = useMemo(() => {
        if (!selectedCategory) return [];
        const node = tree.find((n) => n.name === selectedCategory);
        return node?.items || [];
    }, [selectedCategory, tree]);

    const displayItems = debouncedSearch.length >= 2 ? searchResults : selectedCategory ? categoryItems : undefined;

    const inputClass = 'w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Catalog"
                description={
                    canManageCatalog
                        ? 'Browse and manage remodeling items'
                        : 'Browse remodeling items (catalog management is admin-only)'
                }
                icon={Package}
                actions={canManageCatalog ? (
                    <button
                        onClick={() => { setEditingItem(null); setShowUpsert(true); }}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                ) : null}
            />

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search catalog items..."
                    className="w-full rounded-xl border border-input-border bg-input py-2.5 pl-10 pr-4 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Upsert dialog */}
            {canManageCatalog && showUpsert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-heading text-lg font-semibold">
                                {editingItem ? 'Edit Item' : 'Add Catalog Item'}
                            </h3>
                            <button onClick={resetUpsert} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none hover:bg-surface-hover hover:text-foreground"><X size={18} /></button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                upsertMutation.mutate({
                                    name: upsertForm.name,
                                    unit_price: parseFloat(upsertForm.unit_price) || 0,
                                    labor_hours: parseFloat(upsertForm.labor_hours) || 0,
                                    category: upsertForm.category || undefined,
                                });
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Item Name *</label>
                                <input value={upsertForm.name} onChange={(e) => setUpsertForm({ ...upsertForm, name: e.target.value })} required className={inputClass} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Unit Price ($)</label>
                                    <input type="number" step="0.01" value={upsertForm.unit_price} onChange={(e) => setUpsertForm({ ...upsertForm, unit_price: e.target.value })} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Labor Hours</label>
                                    <input type="number" step="0.25" value={upsertForm.labor_hours} onChange={(e) => setUpsertForm({ ...upsertForm, labor_hours: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Category</label>
                                <select value={upsertForm.category} onChange={(e) => setUpsertForm({ ...upsertForm, category: e.target.value })} className={inputClass}>
                                    <option value="">Uncategorized</option>
                                    {tree.map((n) => <option key={n.name} value={n.name}>{n.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={upsertMutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50">
                                    {upsertMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Save size={16} />}
                                    {editingItem ? 'Update' : 'Add'}
                                </button>
                                <button type="button" onClick={resetUpsert} className="rounded-xl bg-transparent px-4 py-3 text-sm text-muted-foreground shadow-none hover:text-foreground">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tree sidebar */}
                <div className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Categories</h2>
                    {isLoading ? (
                        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="animate-skeleton h-8 rounded-lg bg-border" />)}</div>
                    ) : tree.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No categories yet</p>
                    ) : (
                        <div className="space-y-0.5">
                            {tree.map((node) => {
                                const expanded = expandedNodes.has(node.name);
                                const isSelected = selectedCategory === node.name;
                                return (
                                    <div key={node.name}>
                                        <button
                                            onClick={() => {
                                                toggleNode(node.name);
                                                setSelectedCategory(node.name);
                                                setSearch('');
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                                isSelected
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                            )}
                                        >
                                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            <span className="flex-1 truncate">{node.name}</span>
                                            <span className="shrink-0 rounded-full bg-surface-active px-2 py-0.5 text-xs">{node.items.length}</span>
                                        </button>
                                        {expanded && node.items.length > 0 && (
                                            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-3">
                                                {node.items.map((item) => (
                                                    <p key={item.id} className="truncate py-1 text-xs text-muted-foreground">{item.name}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Items area */}
                <div className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm lg:col-span-2">
                    <h2 className="mb-4 font-heading text-base font-semibold">
                        {debouncedSearch.length >= 2
                            ? `Search: "${debouncedSearch}" (${displayItems?.length || 0})`
                            : selectedCategory
                                ? `${selectedCategory} (${displayItems?.length || 0})`
                                : 'Items'}
                    </h2>

                    {displayItems && displayItems.length > 0 ? (
                        <div className="space-y-2">
                            {displayItems.map((item: CatalogItem | { id: string; name: string }) => (
                                <div
                                    key={item.id}
                                    className="group flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:bg-surface-hover"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{item.name}</p>
                                        {'labor_hours' in item && (
                                            <p className="text-xs text-muted-foreground">{item.labor_hours}h labor</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {'unit_price' in item && (
                                            <MoneyDisplay value={item.unit_price} size="sm" />
                                        )}
                                        {'unit_price' in item && canManageCatalog && (
                                            <button
                                                onClick={() => openEdit(item as CatalogItem)}
                                                className="rounded-lg bg-transparent p-1.5 text-muted opacity-0 shadow-none transition-all group-hover:opacity-100 hover:bg-surface-active hover:text-foreground"
                                                aria-label="Edit item"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Package}
                            title={debouncedSearch.length >= 2 ? 'No matching items' : 'Select a category'}
                            description={debouncedSearch.length >= 2 ? 'Try different search terms' : 'Choose a category from the tree to view its items'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
