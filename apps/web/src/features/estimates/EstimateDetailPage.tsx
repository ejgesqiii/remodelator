import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
    ClipboardList, Plus, Trash2, Pencil, ChevronUp, ChevronDown,
    RotateCcw, Copy, GitBranch, Lock, Unlock, FileText,
    ArrowLeft, Save, Download, Search, ChevronRight, Package,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDecimal, formatMoney, formatPercent, formatQuantity, formatStatus } from '@/lib/formatters';
import * as estimatesApi from '@/api/estimates';
import * as catalogApi from '@/api/catalog';
import * as profileApi from '@/api/profile';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { LineItemEditor } from './LineItemEditor';
import type { LineItem } from '@/api/types';

export function EstimateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: estimate, isLoading } = useQuery({
        queryKey: ['estimate', id],
        queryFn: () => estimatesApi.getEstimate(id!),
        enabled: !!id,
    });
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: profileApi.getProfile,
    });

    const [editingDetails, setEditingDetails] = useState(false);
    const [detailForm, setDetailForm] = useState({
        customer_name: '', customer_email: '', customer_phone: '',
        job_address: '', estimate_markup_pct: '', tax_rate_pct: '',
        remodeler_labor_rate: '', plumber_labor_rate: '', tinner_labor_rate: '',
        electrician_labor_rate: '', designer_labor_rate: '',
    });

    const [addingItem, setAddingItem] = useState(false);
    const [addItemMode, setAddItemMode] = useState<'catalog' | 'manual'>('catalog');
    const [itemForm, setItemForm] = useState({
        item_name: '', quantity: '', unit_price: '', labor_hours: '0',
        labor_trade: 'remodeler',
        remodeler_labor_hours: '0',
        plumber_labor_hours: '0',
        tinner_labor_hours: '0',
        electrician_labor_hours: '0',
        designer_labor_hours: '0',
        item_markup_pct: '0', discount_value: '0', group_name: '',
    });
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogExpandedNodes, setCatalogExpandedNodes] = useState<Set<string>>(new Set());
    const [catalogSelectedCategory, setCatalogSelectedCategory] = useState<string | null>(null);
    const [closeCatalogAfterAdd, setCloseCatalogAfterAdd] = useState(false);
    const debouncedCatalogSearch = useDebounce(catalogSearch, 250);

    const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);
    const [pendingDeleteLineItem, setPendingDeleteLineItem] = useState<LineItem | null>(null);
    const [confirmDeleteEstimateOpen, setConfirmDeleteEstimateOpen] = useState(false);
    const [selectedLineItemIds, setSelectedLineItemIds] = useState<Set<string>>(new Set());
    const [bulkGroupTarget, setBulkGroupTarget] = useState('');
    const [bulkCustomGroupName, setBulkCustomGroupName] = useState('');
    const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [showPerTradeLaborTotals, setShowPerTradeLaborTotals] = useState(false);

    const { data: catalogTree = [], isLoading: catalogTreeLoading } = useQuery({
        queryKey: ['catalog-tree'],
        queryFn: catalogApi.getCatalogTree,
        enabled: addingItem,
    });
    const { data: catalogSearchResults = [] } = useQuery({
        queryKey: ['catalog-search', debouncedCatalogSearch],
        queryFn: () => catalogApi.searchCatalog(debouncedCatalogSearch),
        enabled: addingItem && debouncedCatalogSearch.length >= 2,
    });

    const resetItemForm = () => {
        setItemForm({
            item_name: '',
            quantity: '',
            unit_price: '',
            labor_hours: '0',
            labor_trade: 'remodeler',
            remodeler_labor_hours: '0',
            plumber_labor_hours: '0',
            tinner_labor_hours: '0',
            electrician_labor_hours: '0',
            designer_labor_hours: '0',
            item_markup_pct: '0',
            discount_value: '0',
            group_name: '',
        });
    };

    const resetAddItemPanel = () => {
        setAddingItem(false);
        setAddItemMode('catalog');
        setCatalogSearch('');
        setCatalogSelectedCategory(null);
        setCatalogExpandedNodes(new Set());
        resetItemForm();
    };

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
        onSuccess: () => { invalidate(); toast.success('Line item added'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add item'),
    });

    const deleteItemMutation = useMutation({
        mutationFn: (lineItemId: string) => estimatesApi.deleteLineItem(id!, lineItemId),
        onSuccess: () => {
            invalidate();
            setPendingDeleteLineItem(null);
            toast.success('Line item removed');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove item'),
    });

    const deleteEstimateMutation = useMutation({
        mutationFn: () => estimatesApi.deleteEstimate(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
            queryClient.removeQueries({ queryKey: ['estimate', id] });
            toast.success('Estimate deleted');
            setConfirmDeleteEstimateOpen(false);
            navigate('/estimates');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete estimate'),
    });

    const bulkMoveGroupMutation = useMutation({
        mutationFn: async ({ lineItemIds, groupName }: { lineItemIds: string[]; groupName: string }) => {
            await Promise.all(
                lineItemIds.map((lineItemId) =>
                    estimatesApi.updateLineItem(id!, lineItemId, { group_name: groupName })
                )
            );
        },
        onSuccess: () => {
            invalidate();
            setSelectedLineItemIds(new Set());
            toast.success('Selected items moved');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to move selected items'),
    });

    const reorderMutation = useMutation({
        mutationFn: ({ lineItemId, newIndex }: { lineItemId: string; newIndex: number }) =>
            estimatesApi.reorderLineItem(id!, lineItemId, newIndex),
        onSuccess: () => invalidate(),
    });

    const recalcMutation = useMutation({
        mutationFn: () => estimatesApi.recalcEstimate(id!),
        onSuccess: () => { invalidate(); toast.success('Totals recalculated'); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Recalc failed'),
    });

    const exportMutation = useMutation({
        mutationFn: () => estimatesApi.exportEstimate(id!, `exports/estimate_${id}.json`),
        onSuccess: (data) => {
            toast.success(`Estimate exported to ${data.path}`);
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

    const toggleCatalogNode = (name: string) => {
        setCatalogExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    const categoryItems = useMemo(() => {
        if (!catalogSelectedCategory) return [];
        const selectedNode = catalogTree.find((node) => node.name === catalogSelectedCategory);
        return selectedNode?.items ?? [];
    }, [catalogSelectedCategory, catalogTree]);

    const catalogDisplayItems = debouncedCatalogSearch.length >= 2 ? catalogSearchResults : categoryItems;

    const addCatalogItemToEstimate = (item: { name: string; unit_price?: string; labor_hours?: string; labor_trade?: string }) => {
        const defaultCatalogLaborHours = parseFloat(item.labor_hours ?? '0') || 0;
        const defaultCatalogTrade = (item.labor_trade || 'remodeler').toLowerCase();
        addItemMutation.mutate(
            {
                item_name: item.name,
                quantity: 1,
                unit_price: parseFloat(item.unit_price ?? '0') || 0,
                labor_hours: defaultCatalogLaborHours,
                item_markup_pct: parseFloat(itemForm.item_markup_pct) || 0,
                labor_trade: defaultCatalogTrade,
                remodeler_labor_hours: defaultCatalogTrade === 'remodeler' ? defaultCatalogLaborHours : 0,
                plumber_labor_hours: defaultCatalogTrade === 'plumber' ? defaultCatalogLaborHours : 0,
                tinner_labor_hours: defaultCatalogTrade === 'tinner' ? defaultCatalogLaborHours : 0,
                electrician_labor_hours: defaultCatalogTrade === 'electrician' ? defaultCatalogLaborHours : 0,
                designer_labor_hours: defaultCatalogTrade === 'designer' ? defaultCatalogLaborHours : 0,
                discount_value: 0,
                group_name: itemForm.group_name || undefined,
            },
            {
                onSuccess: () => {
                    if (closeCatalogAfterAdd) {
                        resetAddItemPanel();
                        return;
                    }
                    setItemForm((prev) => ({
                        ...prev,
                        item_name: item.name,
                        quantity: '1',
                        unit_price: item.unit_price ?? prev.unit_price,
                        labor_hours: item.labor_hours ?? prev.labor_hours,
                        remodeler_labor_hours: defaultCatalogTrade === 'remodeler' ? (item.labor_hours ?? prev.remodeler_labor_hours) : '0',
                        plumber_labor_hours: defaultCatalogTrade === 'plumber' ? (item.labor_hours ?? prev.plumber_labor_hours) : '0',
                        tinner_labor_hours: defaultCatalogTrade === 'tinner' ? (item.labor_hours ?? prev.tinner_labor_hours) : '0',
                        electrician_labor_hours: defaultCatalogTrade === 'electrician' ? (item.labor_hours ?? prev.electrician_labor_hours) : '0',
                        designer_labor_hours: defaultCatalogTrade === 'designer' ? (item.labor_hours ?? prev.designer_labor_hours) : '0',
                    }));
                },
            }
        );
    };

    const lines = estimate?.line_items || [];

    const groupedLineItems = useMemo(() => {
        const groups = new Map<string, LineItem[]>();
        for (const line of lines) {
            const groupName = line.group_name?.trim() || 'General';
            const currentGroup = groups.get(groupName) ?? [];
            currentGroup.push(line);
            groups.set(groupName, currentGroup);
        }
        return Array.from(groups.entries());
    }, [lines]);

    const lineIndexById = useMemo(
        () => new Map(lines.map((line, index) => [line.id, index])),
        [lines]
    );

    const existingGroups = useMemo(
        () => groupedLineItems.map(([groupName]) => groupName),
        [groupedLineItems]
    );

    useEffect(() => {
        setSelectedLineItemIds((prev) => {
            const validIds = new Set(lines.map((line) => line.id));
            const next = new Set([...prev].filter((lineId) => validIds.has(lineId)));
            return next;
        });
    }, [lines]);

    const allSelected = lines.length > 0 && lines.every((line) => selectedLineItemIds.has(line.id));

    const toggleLineSelection = (lineItemId: string, checked: boolean) => {
        setSelectedLineItemIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(lineItemId);
            else next.delete(lineItemId);
            return next;
        });
    };

    const toggleAllSelection = (checked: boolean) => {
        if (!checked) {
            setSelectedLineItemIds(new Set());
            return;
        }
        setSelectedLineItemIds(new Set(lines.map((line) => line.id)));
    };

    const toggleGroupSelection = (groupLines: LineItem[], checked: boolean) => {
        setSelectedLineItemIds((prev) => {
            const next = new Set(prev);
            for (const line of groupLines) {
                if (checked) next.add(line.id);
                else next.delete(line.id);
            }
            return next;
        });
    };

    const effectiveBulkGroupTarget =
        bulkGroupTarget === '__custom__' ? bulkCustomGroupName.trim() : bulkGroupTarget;

    const toNumber = (value: string | number | undefined | null): number => {
        const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const parsePositive = (value: string | number | undefined | null): number => {
        const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) return 0;
        return parsed;
    };

    const defaultLaborRateValue = useMemo(() => {
        if (!estimate) return 0;
        return (
            parsePositive(estimate.remodeler_labor_rate)
            || parsePositive(profile?.remodeler_labor_rate)
            || parsePositive(profile?.labor_rate)
            || 0
        );
    }, [estimate, profile]);

    const effectiveTradeRate = (value: string | number | undefined | null): string => {
        const tradeSpecific = parsePositive(value);
        if (tradeSpecific > 0) return formatDecimal(tradeSpecific);
        return formatDecimal(defaultLaborRateValue);
    };

    const laborTotalsForLines = (sourceLines: LineItem[]) => sourceLines.reduce((acc, line) => {
        const remodeler = toNumber(line.remodeler_labor_hours);
        const plumber = toNumber(line.plumber_labor_hours);
        const tinner = toNumber(line.tinner_labor_hours);
        const electrician = toNumber(line.electrician_labor_hours);
        const designer = toNumber(line.designer_labor_hours);
        acc.remodeler += remodeler;
        acc.plumber += plumber;
        acc.tinner += tinner;
        acc.electrician += electrician;
        acc.designer += designer;
        acc.total += remodeler + plumber + tinner + electrician + designer;
        return acc;
    }, {
        remodeler: 0,
        plumber: 0,
        tinner: 0,
        electrician: 0,
        designer: 0,
        total: 0,
    });

    const estimateLaborTotals = useMemo(() => laborTotalsForLines(lines), [lines]);

    const tradeTotalsLabel = (totals: {
        remodeler: number; plumber: number; tinner: number; electrician: number; designer: number;
    }) => (
        `R:${formatDecimal(totals.remodeler)} `
        + `P:${formatDecimal(totals.plumber)} `
        + `T:${formatDecimal(totals.tinner)} `
        + `E:${formatDecimal(totals.electrician)} `
        + `D:${formatDecimal(totals.designer)}`
    );

    const laborBreakdownLabel = (line: LineItem) => {
        const parts = [
            { label: 'R', value: toNumber(line.remodeler_labor_hours) },
            { label: 'P', value: toNumber(line.plumber_labor_hours) },
            { label: 'T', value: toNumber(line.tinner_labor_hours) },
            { label: 'E', value: toNumber(line.electrician_labor_hours) },
            { label: 'D', value: toNumber(line.designer_labor_hours) },
        ].filter((part) => part.value > 0);
        if (parts.length === 0) return 'Labor 0.00h';
        return parts.map((part) => `${part.label}:${formatDecimal(part.value)}`).join(' ');
    };

    useEffect(() => {
        if (!actionsMenuOpen && !statusMenuOpen) return;
        const closeMenu = () => {
            setActionsMenuOpen(false);
            setStatusMenuOpen(false);
        };
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [actionsMenuOpen, statusMenuOpen]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-skeleton h-10 w-1/3 rounded-xl bg-border" />
                <div className="space-y-6">
                    <div className="animate-skeleton h-56 rounded-2xl bg-border" />
                    <div className="animate-skeleton h-56 rounded-2xl bg-border" />
                    <div className="animate-skeleton h-72 rounded-2xl bg-border" />
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/estimates" className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex flex-1 items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <ClipboardList size={20} className="text-primary" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">{estimate.title}</h1>
                        <StatusBadge status={estimate.status} size="md" />
                        <span className="font-mono text-sm text-muted-foreground">v{estimate.version}</span>
                    </div>

                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusMenuOpen((prev) => !prev);
                                    setActionsMenuOpen(false);
                                }}
                                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
                            >
                                Status
                                <ChevronDown size={14} />
                            </button>
                            {statusMenuOpen && (
                                <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg">
                                    {['draft', 'in_progress', 'completed', 'locked'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                statusMutation.mutate(s);
                                                setStatusMenuOpen(false);
                                            }}
                                            disabled={estimate.status === s || statusMutation.isPending}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm disabled:opacity-50',
                                                estimate.status === s ? 'bg-primary/10 text-primary' : 'hover:bg-surface-hover'
                                            )}
                                        >
                                            {formatStatus(s)}
                                            {estimate.status === s && <span className="text-xs">Current</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setActionsMenuOpen((prev) => !prev);
                                    setStatusMenuOpen(false);
                                }}
                                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
                            >
                                Actions
                                <ChevronDown size={14} />
                            </button>
                            {actionsMenuOpen && (
                                <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg">
                                    <button onClick={() => { recalcMutation.mutate(); setActionsMenuOpen(false); }} disabled={recalcMutation.isPending} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover disabled:opacity-50"><RotateCcw size={14} /> Recalculate</button>
                                    <button onClick={() => { actionMutation.mutate('duplicate'); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"><Copy size={14} /> Duplicate</button>
                                    <button onClick={() => { actionMutation.mutate('version'); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"><GitBranch size={14} /> Create Version</button>
                                    <button onClick={() => { exportMutation.mutate(); setActionsMenuOpen(false); }} disabled={exportMutation.isPending} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover disabled:opacity-50"><Download size={14} /> Export JSON</button>
                                    {estimate.status === 'locked' ? (
                                        <button onClick={() => { actionMutation.mutate('unlock'); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"><Unlock size={14} /> Unlock</button>
                                    ) : (
                                        <button onClick={() => { statusMutation.mutate('locked'); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"><Lock size={14} /> Lock</button>
                                    )}
                                    <button onClick={() => { navigate(`/estimates/${id}/proposal`); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"><FileText size={14} /> View Proposal</button>
                                    <button onClick={() => { setConfirmDeleteEstimateOpen(true); setActionsMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"><Trash2 size={14} /> Delete Estimate</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
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
                                            estimate_markup_pct: formatDecimal(estimate.estimate_markup_pct),
                                            tax_rate_pct: formatDecimal(estimate.tax_rate_pct),
                                            remodeler_labor_rate: effectiveTradeRate(estimate.remodeler_labor_rate),
                                            plumber_labor_rate: effectiveTradeRate(estimate.plumber_labor_rate),
                                            tinner_labor_rate: effectiveTradeRate(estimate.tinner_labor_rate),
                                            electrician_labor_rate: effectiveTradeRate(estimate.electrician_labor_rate),
                                            designer_labor_rate: effectiveTradeRate(estimate.designer_labor_rate),
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
                                        remodeler_labor_rate: detailForm.remodeler_labor_rate ? parseFloat(detailForm.remodeler_labor_rate) : undefined,
                                        plumber_labor_rate: detailForm.plumber_labor_rate ? parseFloat(detailForm.plumber_labor_rate) : undefined,
                                        tinner_labor_rate: detailForm.tinner_labor_rate ? parseFloat(detailForm.tinner_labor_rate) : undefined,
                                        electrician_labor_rate: detailForm.electrician_labor_rate ? parseFloat(detailForm.electrician_labor_rate) : undefined,
                                        designer_labor_rate: detailForm.designer_labor_rate ? parseFloat(detailForm.designer_labor_rate) : undefined,
                                    });
                                }}
                                className="space-y-3"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {([
                                        'customer_name',
                                        'customer_email',
                                        'customer_phone',
                                        'job_address',
                                        'estimate_markup_pct',
                                        'tax_rate_pct',
                                        'remodeler_labor_rate',
                                        'plumber_labor_rate',
                                        'tinner_labor_rate',
                                        'electrician_labor_rate',
                                        'designer_labor_rate',
                                    ] as const).map((field) => (
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
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Info</p>
                                    <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                                        <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{estimate.customer_name || '—'}</span></div>
                                        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{estimate.customer_email || '—'}</span></div>
                                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{estimate.customer_phone || '—'}</span></div>
                                        <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{estimate.job_address || '—'}</span></div>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rates</p>
                                    <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                                        <div><span className="text-muted-foreground">Markup:</span> <span className="font-medium">{formatPercent(estimate.estimate_markup_pct)}</span></div>
                                        <div><span className="text-muted-foreground">Tax Rate:</span> <span className="font-medium">{formatPercent(estimate.tax_rate_pct)}</span></div>
                                        <div><span className="text-muted-foreground">Remodeler Rate:</span> <span className="font-medium">${effectiveTradeRate(estimate.remodeler_labor_rate)}/hr</span></div>
                                        <div><span className="text-muted-foreground">Plumber Rate:</span> <span className="font-medium">${effectiveTradeRate(estimate.plumber_labor_rate)}/hr</span></div>
                                        <div><span className="text-muted-foreground">Tinner Rate:</span> <span className="font-medium">${effectiveTradeRate(estimate.tinner_labor_rate)}/hr</span></div>
                                        <div><span className="text-muted-foreground">Electrician Rate:</span> <span className="font-medium">${effectiveTradeRate(estimate.electrician_labor_rate)}/hr</span></div>
                                        <div><span className="text-muted-foreground">Designer Rate:</span> <span className="font-medium">${effectiveTradeRate(estimate.designer_labor_rate)}/hr</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                        <h3 className="mb-4 font-heading text-base font-semibold">Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><MoneyDisplay value={estimate.subtotal} size="sm" /></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({formatPercent(estimate.tax_rate_pct)})</span><MoneyDisplay value={estimate.tax} size="sm" /></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor Total</span><span className="font-mono text-sm font-semibold text-foreground">{formatDecimal(estimateLaborTotals.total)}h</span></div>
                            {showPerTradeLaborTotals && (
                                <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs font-mono text-muted-foreground">
                                    {tradeTotalsLabel(estimateLaborTotals)}
                                </div>
                            )}
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between"><span className="font-semibold">Total</span><MoneyDisplay value={estimate.total} size="xl" className="text-primary" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-heading text-base font-semibold">Estimate</h2>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {lines.length > 0 && (
                            <>
                                <select
                                    value={bulkGroupTarget}
                                    onChange={(e) => setBulkGroupTarget(e.target.value)}
                                    className="rounded-xl border border-input-border bg-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="" disabled hidden>Select group...</option>
                                    {existingGroups.map((groupName) => (
                                        <option key={groupName} value={groupName}>
                                            {groupName}
                                        </option>
                                    ))}
                                    <option value="__custom__">New group...</option>
                                </select>
                                {bulkGroupTarget === '__custom__' && (
                                    <input
                                        value={bulkCustomGroupName}
                                        onChange={(e) => setBulkCustomGroupName(e.target.value)}
                                        placeholder="New group name"
                                        className="rounded-xl border border-input-border bg-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                )}
                                <button
                                    onClick={() =>
                                        bulkMoveGroupMutation.mutate({
                                            lineItemIds: Array.from(selectedLineItemIds),
                                            groupName: effectiveBulkGroupTarget,
                                        })
                                    }
                                    disabled={
                                        selectedLineItemIds.size === 0
                                        || !effectiveBulkGroupTarget
                                        || bulkMoveGroupMutation.isPending
                                    }
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover disabled:opacity-50"
                                >
                                    Move Selected
                                </button>
                                <label className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) => toggleAllSelection(e.target.checked)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                    />
                                    Select all ({selectedLineItemIds.size})
                                </label>
                                <label className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showPerTradeLaborTotals}
                                        onChange={(e) => setShowPerTradeLaborTotals(e.target.checked)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                    />
                                    Per-trade totals
                                </label>
                            </>
                        )}
                        <button
                            onClick={() => {
                                if (addingItem) {
                                    resetAddItemPanel();
                                    return;
                                }
                                setAddItemMode('catalog');
                                setAddingItem(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary-hover"
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    </div>
                </div>

                {/* Add item panel */}
                {addingItem && (
                    <div className="mb-4 space-y-3 rounded-xl border border-primary/20 bg-background/50 p-4">
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 p-1">
                            <button
                                type="button"
                                onClick={() => setAddItemMode('catalog')}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                    addItemMode === 'catalog'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Catalog
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddItemMode('manual')}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                    addItemMode === 'manual'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Manual
                            </button>
                        </div>

                        {addItemMode === 'manual' ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const parsedQuantity = Number(itemForm.quantity);
                                    if (itemForm.quantity && !Number.isInteger(parsedQuantity)) {
                                        toast.error('Quantity must be a whole number');
                                        return;
                                    }
                                    addItemMutation.mutate(
                                        {
                                            item_name: itemForm.item_name,
                                            quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
                                            unit_price: parseFloat(itemForm.unit_price) || 0,
                                            labor_hours: (parseFloat(itemForm.remodeler_labor_hours) || 0)
                                                + (parseFloat(itemForm.plumber_labor_hours) || 0)
                                                + (parseFloat(itemForm.tinner_labor_hours) || 0)
                                                + (parseFloat(itemForm.electrician_labor_hours) || 0)
                                                + (parseFloat(itemForm.designer_labor_hours) || 0),
                                            labor_trade: 'remodeler',
                                            remodeler_labor_hours: parseFloat(itemForm.remodeler_labor_hours) || 0,
                                            plumber_labor_hours: parseFloat(itemForm.plumber_labor_hours) || 0,
                                            tinner_labor_hours: parseFloat(itemForm.tinner_labor_hours) || 0,
                                            electrician_labor_hours: parseFloat(itemForm.electrician_labor_hours) || 0,
                                            designer_labor_hours: parseFloat(itemForm.designer_labor_hours) || 0,
                                            item_markup_pct: parseFloat(itemForm.item_markup_pct) || 0,
                                            discount_value: parseFloat(itemForm.discount_value) || 0,
                                            group_name: itemForm.group_name || undefined,
                                        },
                                        {
                                            onSuccess: () => {
                                                resetAddItemPanel();
                                            },
                                        }
                                    );
                                }}
                                className="space-y-3 rounded-xl border border-border bg-surface/60 p-4"
                            >
                                <h3 className="font-heading text-sm font-semibold">Manual Line Item</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <input value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} placeholder="Item name *" required className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} placeholder="Quantity" type="number" step="1" min="1" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })} placeholder="Unit price" type="number" step="0.01" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.remodeler_labor_hours} onChange={(e) => setItemForm({ ...itemForm, remodeler_labor_hours: e.target.value })} placeholder="Remodeler hours" type="number" step="0.01" min="0" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.plumber_labor_hours} onChange={(e) => setItemForm({ ...itemForm, plumber_labor_hours: e.target.value })} placeholder="Plumber hours" type="number" step="0.01" min="0" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.tinner_labor_hours} onChange={(e) => setItemForm({ ...itemForm, tinner_labor_hours: e.target.value })} placeholder="Tinner hours" type="number" step="0.01" min="0" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.electrician_labor_hours} onChange={(e) => setItemForm({ ...itemForm, electrician_labor_hours: e.target.value })} placeholder="Electrician hours" type="number" step="0.01" min="0" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.designer_labor_hours} onChange={(e) => setItemForm({ ...itemForm, designer_labor_hours: e.target.value })} placeholder="Designer hours" type="number" step="0.01" min="0" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.item_markup_pct} onChange={(e) => setItemForm({ ...itemForm, item_markup_pct: e.target.value })} placeholder="Markup %" type="number" step="any" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                    <input value={itemForm.group_name} onChange={(e) => setItemForm({ ...itemForm, group_name: e.target.value })} placeholder="Group" className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={addItemMutation.isPending} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover disabled:opacity-50">
                                        {addItemMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Plus size={14} />}
                                        Add
                                    </button>
                                    <button type="button" onClick={resetAddItemPanel} className="rounded-xl bg-transparent px-3 py-2 text-sm text-muted-foreground shadow-none hover:text-foreground">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="rounded-xl border border-border bg-surface/60 p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold">
                                    <Package size={15} />
                                    Catalog Picker
                                </h3>
                                <div className="relative mb-3">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        value={catalogSearch}
                                        onChange={(e) => setCatalogSearch(e.target.value)}
                                        placeholder="Search catalog..."
                                        className="w-full rounded-xl border border-input-border bg-input py-2.5 pl-9 pr-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="grid gap-3 lg:grid-cols-5">
                                    <div className="space-y-1 lg:col-span-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Categories</p>
                                        <div className="max-h-64 space-y-0.5 overflow-auto rounded-lg border border-border bg-background/50 p-2">
                                            {catalogTreeLoading ? (
                                                <p className="p-2 text-xs text-muted-foreground">Loading...</p>
                                            ) : catalogTree.length === 0 ? (
                                                <p className="p-2 text-xs text-muted-foreground">No categories</p>
                                            ) : (
                                                catalogTree.map((node) => {
                                                    const expanded = catalogExpandedNodes.has(node.name);
                                                    const selected = catalogSelectedCategory === node.name;
                                                    return (
                                                        <button
                                                            key={node.name}
                                                            onClick={() => {
                                                                toggleCatalogNode(node.name);
                                                                setCatalogSelectedCategory(node.name);
                                                                setCatalogSearch('');
                                                            }}
                                                            className={cn(
                                                                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                                                                selected
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                                            )}
                                                        >
                                                            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                            <span className="truncate">{node.name}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1 lg:col-span-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                            {debouncedCatalogSearch.length >= 2 ? 'Search Results' : 'Items'}
                                        </p>
                                        <div className="max-h-64 space-y-1 overflow-auto rounded-lg border border-border bg-background/50 p-2">
                                            {catalogDisplayItems.length === 0 ? (
                                                <p className="p-2 text-xs text-muted-foreground">
                                                    {debouncedCatalogSearch.length >= 2
                                                        ? 'No matching items'
                                                        : 'Select a category or search to pick an item'}
                                                </p>
                                            ) : (
                                                catalogDisplayItems.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-medium">{item.name}</p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {formatDecimal(item.labor_hours)}h {formatStatus(item.labor_trade || 'remodeler')} labor
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-foreground">{formatMoney(item.unit_price)}</span>
                                                            <button
                                                                onClick={() => addCatalogItemToEstimate(item)}
                                                                disabled={addItemMutation.isPending}
                                                                aria-label={`Add ${item.name}`}
                                                                className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {addItemMode === 'catalog' && (
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={closeCatalogAfterAdd}
                                    onChange={(e) => setCloseCatalogAfterAdd(e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                />
                                Close catalog after adding an item
                            </label>
                        )}
                    </div>
                )}

                {/* Grouped line items */}
                {lines.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No line items yet"
                        description="Add items manually or from the catalog"
                    />
                ) : (
                    <div className="space-y-4">
                        {groupedLineItems.map(([groupName, groupLines]) => {
                            const groupSelected = groupLines.every((line) => selectedLineItemIds.has(line.id));
                            const groupSubtotal = groupLines.reduce((sum, line) => {
                                const total = Number.parseFloat(line.total_price);
                                return sum + (Number.isNaN(total) ? 0 : total);
                            }, 0);
                            const groupLaborTotals = laborTotalsForLines(groupLines);

                            return (
                                <div key={groupName} className="overflow-hidden rounded-xl border border-border bg-background/40">
                                    <div className="flex items-center justify-between border-b border-border bg-surface/70 px-4 py-2.5">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={groupSelected}
                                                onChange={(e) => toggleGroupSelection(groupLines, e.target.checked)}
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                            />
                                            {groupName}
                                        </label>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <div>{groupLines.length} item{groupLines.length === 1 ? '' : 's'} · {formatMoney(groupSubtotal)}</div>
                                            <div className="mt-0.5">Labor {formatDecimal(groupLaborTotals.total)}h</div>
                                            {showPerTradeLaborTotals && (
                                                <div className="mt-0.5 font-mono">{tradeTotalsLabel(groupLaborTotals)}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted">
                                                    <th className="w-10 py-2 pl-4 pr-2" />
                                                    <th className="py-2 pr-4">Item</th>
                                                    <th className="px-3 py-2 text-right">Qty</th>
                                                    <th className="px-3 py-2 text-right">Price</th>
                                                    <th className="px-3 py-2 text-right">Total</th>
                                                    <th className="py-2 pl-3 pr-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {groupLines.map((line, groupLineIndex) => {
                                                    const prevInGroup = groupLineIndex > 0 ? groupLines[groupLineIndex - 1] : null;
                                                    const nextInGroup = groupLineIndex < groupLines.length - 1 ? groupLines[groupLineIndex + 1] : null;
                                                    const prevInGroupGlobalIndex = prevInGroup ? (lineIndexById.get(prevInGroup.id) ?? null) : null;
                                                    const nextInGroupGlobalIndex = nextInGroup ? (lineIndexById.get(nextInGroup.id) ?? null) : null;
                                                    return (
                                                        <tr key={line.id} className="group transition-colors hover:bg-surface-hover">
                                                            <td className="py-2 pl-4 pr-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedLineItemIds.has(line.id)}
                                                                    onChange={(e) => toggleLineSelection(line.id, e.target.checked)}
                                                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                                                />
                                                            </td>
                                                            <td className="py-2 pr-4">
                                                                <button
                                                                    onClick={() => setEditingLineItem(line)}
                                                                    className="font-medium text-foreground transition-colors hover:text-primary"
                                                                >
                                                                    {line.item_name}
                                                                </button>
                                                                <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                                                                    {laborBreakdownLabel(line)}
                                                                </p>
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-mono">{formatQuantity(line.quantity)}</td>
                                                            <td className="px-3 py-2 text-right font-mono">{formatMoney(line.unit_price)}</td>
                                                            <td className="px-3 py-2 text-right font-mono font-semibold">{formatMoney(line.total_price)}</td>
                                                            <td className="py-2 pl-3 pr-4">
                                                                <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                    <button onClick={() => setEditingLineItem(line)} className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground" aria-label="Edit">
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (prevInGroupGlobalIndex === null) return;
                                                                            reorderMutation.mutate({ lineItemId: line.id, newIndex: prevInGroupGlobalIndex });
                                                                        }}
                                                                        disabled={prevInGroupGlobalIndex === null}
                                                                        className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground disabled:opacity-30"
                                                                        aria-label="Move up"
                                                                    >
                                                                        <ChevronUp size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (nextInGroupGlobalIndex === null) return;
                                                                            reorderMutation.mutate({ lineItemId: line.id, newIndex: nextInGroupGlobalIndex });
                                                                        }}
                                                                        disabled={nextInGroupGlobalIndex === null}
                                                                        className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-surface-active hover:text-foreground disabled:opacity-30"
                                                                        aria-label="Move down"
                                                                    >
                                                                        <ChevronDown size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setPendingDeleteLineItem(line)}
                                                                        className="rounded-lg bg-transparent p-1.5 text-muted shadow-none transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                                        aria-label="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {editingLineItem && (
                <LineItemEditor
                    estimateId={id!}
                    lineItem={editingLineItem}
                    onClose={() => setEditingLineItem(null)}
                />
            )}

            {pendingDeleteLineItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
                        <h3 className="font-heading text-lg font-semibold">Remove Line Item</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Remove <span className="font-medium text-foreground">&quot;{pendingDeleteLineItem.item_name}&quot;</span> from this estimate?
                        </p>
                        <p className="mt-1 text-xs text-muted">This action cannot be undone.</p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => deleteItemMutation.mutate(pendingDeleteLineItem.id)}
                                disabled={deleteItemMutation.isPending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-md hover:bg-destructive-hover disabled:opacity-50"
                            >
                                {deleteItemMutation.isPending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
                                ) : (
                                    <Trash2 size={15} />
                                )}
                                Remove
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingDeleteLineItem(null)}
                                disabled={deleteItemMutation.isPending}
                                className="rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteEstimateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
                        <h3 className="font-heading text-lg font-semibold">Delete Estimate</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Delete <span className="font-medium text-foreground">&quot;{estimate.title}&quot;</span> and all its line items?
                        </p>
                        <p className="mt-1 text-xs text-muted">This action cannot be undone.</p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => deleteEstimateMutation.mutate()}
                                disabled={deleteEstimateMutation.isPending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-md hover:bg-destructive-hover disabled:opacity-50"
                            >
                                {deleteEstimateMutation.isPending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
                                ) : (
                                    <Trash2 size={15} />
                                )}
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteEstimateOpen(false)}
                                disabled={deleteEstimateMutation.isPending}
                                className="rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
