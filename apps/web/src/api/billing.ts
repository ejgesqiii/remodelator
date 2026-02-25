import { get, post } from './client';
import type {
    BillingPolicy, BillingProviderStatus, BillingSubscriptionState,
    BillingEvent, BillingMutationResult, SimulateEventRequest,
} from './types';

export function getBillingPolicy(): Promise<BillingPolicy> {
    return get<BillingPolicy>('/billing/policy');
}

export function getBillingProviderStatus(): Promise<BillingProviderStatus> {
    return get<BillingProviderStatus>('/billing/provider-status');
}

export function getSubscriptionState(): Promise<BillingSubscriptionState> {
    return get<BillingSubscriptionState>('/billing/subscription-state');
}

export function getBillingLedger(): Promise<BillingEvent[]> {
    return get<BillingEvent[]>('/billing/ledger');
}

export function simulateSubscription(data?: { amount?: number; idempotency_key?: string }): Promise<BillingMutationResult> {
    return post<BillingMutationResult>('/billing/simulate-subscription', data || {});
}

export function simulateEstimateCharge(data?: { amount?: number; details?: string; idempotency_key?: string }): Promise<BillingMutationResult> {
    return post<BillingMutationResult>('/billing/simulate-estimate-charge', data || {});
}

export function simulateEvent(data: SimulateEventRequest): Promise<BillingMutationResult> {
    return post<BillingMutationResult>('/billing/simulate-event', data);
}

export function simulateRefund(data?: { amount?: number; details?: string; idempotency_key?: string }): Promise<BillingMutationResult> {
    return post<BillingMutationResult>('/billing/simulate-refund', data || {});
}
