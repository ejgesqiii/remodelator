import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { Timeline } from '@/components/data-display/Timeline';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CreditCard, Zap, RefreshCw, Key, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import * as billingApi from '@/api/billing';
import { toast } from 'sonner';

export function BillingPage() {
    const queryClient = useQueryClient();
    const [idempotencyKey, setIdempotencyKey] = useState('');

    const { data: subscription } = useQuery({
        queryKey: ['billing-subscription'],
        queryFn: billingApi.getSubscriptionState,
    });

    const { data: provider } = useQuery({
        queryKey: ['billing-provider'],
        queryFn: billingApi.getBillingProviderStatus,
    });

    const { data: policy } = useQuery({
        queryKey: ['billing-policy'],
        queryFn: billingApi.getBillingPolicy,
    });

    const { data: ledger = [] } = useQuery({
        queryKey: ['billing-ledger'],
        queryFn: billingApi.getBillingLedger,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['billing-ledger'] });
    };

    const simSubMutation = useMutation({
        mutationFn: () => billingApi.simulateSubscription(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        onSuccess: (r) => {
            // If the backend returned a Stripe checkout URL, redirect immediately
            if (r.checkout_url) {
                window.location.href = r.checkout_url;
                return;
            }
            invalidate();
            toast.success(
                `Subscription: ${r.event_type ?? r.status ?? 'processed'}${r.idempotency_status ? ` (${r.idempotency_status})` : ''}`
            );
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Simulation failed'),
    });

    const simChargeMutation = useMutation({
        mutationFn: () =>
            billingApi.simulateEstimateCharge({
                estimate_id: 'manual',
                ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
            }),
        onSuccess: (r) => { invalidate(); toast.success(`Charge: ${r.amount}`); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Charge failed'),
    });

    const simEventMutation = useMutation({
        mutationFn: (eventType: string) => billingApi.simulateEvent({
            event_type: eventType,
            ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        }),
        onSuccess: (r) => { invalidate(); toast.success(`Event: ${r.event_type}`); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Event failed'),
    });

    const simRefundMutation = useMutation({
        mutationFn: () => billingApi.simulateRefund(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        onSuccess: (r) => { invalidate(); toast.success(`Refund: ${r.amount}`); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Refund failed'),
    });

    const timelineEvents = ledger.map((e) => ({
        id: e.id,
        type: e.event_type,
        amount: e.amount,
        detail: e.details,
        timestamp: e.created_at,
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Billing" description="Manage subscriptions and usage charges" icon={CreditCard} />

            {/* Provider status banner */}
            {provider && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm backdrop-blur-sm">
                    <span className={cn(
                        'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                        provider.adapter_ready ? 'bg-success' : 'bg-destructive'
                    )} />
                    <span className="font-medium">Provider: {provider.provider}</span>
                    <span className="text-muted-foreground">• Mode: {provider.live_mode}</span>
                    {provider.blocker_reason && (
                        <span className="flex items-center gap-1 text-warning">
                            <AlertCircle size={12} /> {provider.blocker_reason}
                        </span>
                    )}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Subscription */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Subscription</h2>
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border bg-background/50 p-3">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <div className="mt-1.5">
                                        <StatusBadge status={subscription.status} size="md" />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border bg-background/50 p-3">
                                    <p className="text-xs text-muted-foreground">Annual Amount</p>
                                    <MoneyDisplay value={subscription.annual_subscription_amount} size="lg" className="mt-1" />
                                </div>
                            </div>
                            {subscription.last_event_type && (
                                <div className="rounded-xl border border-border bg-background/50 p-3">
                                    <p className="text-xs text-muted-foreground">Last Event</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <StatusBadge status={subscription.last_event_type} size="sm" />
                                        {subscription.last_event_amount && <MoneyDisplay value={subscription.last_event_amount} size="sm" />}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted">Lifecycle Actions</p>
                                {provider?.provider === 'stripe' ? (
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => simSubMutation.mutate()} className="flex justify-center items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary-hover">
                                            <CreditCard size={14} /> Subscribe via Stripe
                                        </button>
                                        <p className="text-[10px] text-muted-foreground text-center">Managed securely via Stripe Checkout.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => simEventMutation.mutate('payment_method_attached')} className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-medium text-foreground shadow-none hover:bg-surface-active">Attach Card</button>
                                        <button onClick={() => simSubMutation.mutate()} className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-medium text-foreground shadow-none hover:bg-surface-active">Complete Checkout</button>
                                        <button onClick={() => simEventMutation.mutate('invoice_paid')} className="rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-medium text-foreground shadow-none hover:bg-surface-active">Invoice Paid</button>
                                        <button onClick={() => simEventMutation.mutate('invoice_payment_failed')} className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning shadow-none hover:bg-warning/20">Payment Failed</button>
                                        <button onClick={() => simEventMutation.mutate('subscription_canceled')} className="col-span-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive shadow-none hover:bg-destructive/20">Cancel Subscription</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="animate-skeleton h-16 rounded-xl bg-border" />)}</div>
                    )}
                </div>

                {/* Usage */}
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Usage Charges</h2>
                    <div className="space-y-4">
                        {policy && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border bg-background/50 p-3">
                                    <p className="text-xs text-muted-foreground">Per Pricing Run</p>
                                    <MoneyDisplay value={policy.realtime_pricing_amount} size="lg" className="mt-1" />
                                </div>
                                <div className="rounded-xl border border-border bg-background/50 p-3">
                                    <p className="text-xs text-muted-foreground">Currency</p>
                                    <p className="mt-1 text-lg font-semibold uppercase">{policy.currency}</p>
                                </div>
                            </div>
                        )}
                        {provider?.provider === 'stripe' ? (
                            <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => simChargeMutation.mutate()} disabled={simChargeMutation.isPending} className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary shadow-none hover:bg-primary/20 disabled:opacity-50">
                                    <Zap size={14} /> Capture Live Usage Charge
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => simChargeMutation.mutate()} disabled={simChargeMutation.isPending} className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary shadow-none hover:bg-primary/20 disabled:opacity-50">
                                    <Zap size={14} /> Run Charge
                                </button>
                                <button onClick={() => simRefundMutation.mutate()} disabled={simRefundMutation.isPending} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-hover px-3 py-2.5 text-xs font-medium text-foreground shadow-none hover:bg-surface-active disabled:opacity-50">
                                    <RefreshCw size={14} /> Refund
                                </button>
                            </div>
                        )}

                        {/* Idempotency key */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Key size={12} /> Idempotency Key (optional)
                            </label>
                            <input
                                value={idempotencyKey}
                                onChange={(e) => setIdempotencyKey(e.target.value)}
                                placeholder="e.g. test-key-123"
                                className="w-full rounded-xl border border-input-border bg-input px-3 py-2.5 text-sm font-mono placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="text-xs text-muted">Set a key to test idempotency — replaying the same key returns the cached result.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ledger */}
            <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-heading text-base font-semibold">Billing Ledger ({ledger.length})</h2>
                {ledger.length === 0 ? (
                    <EmptyState icon={CreditCard} title="No billing events yet" description="Use the simulation controls above to generate events" />
                ) : (
                    <Timeline events={timelineEvents} maxHeight="500px" />
                )}
            </div>
        </div>
    );
}
