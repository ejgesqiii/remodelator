import { cn } from '@/lib/cn';
import { formatStatus } from '@/lib/formatters';

const variants: Record<string, string> = {
    draft: 'bg-muted/20 text-muted-foreground',
    in_progress: 'bg-primary/15 text-primary',
    active: 'bg-primary/15 text-primary',
    completed: 'bg-success/15 text-success',
    locked: 'bg-warning/15 text-warning',
    canceled: 'bg-destructive/15 text-destructive',
    past_due: 'bg-destructive/15 text-destructive',
    // Billing events
    checkout_completed: 'bg-success/15 text-success',
    invoice_paid: 'bg-success/15 text-success',
    payment_failed: 'bg-destructive/15 text-destructive',
    subscription_canceled: 'bg-warning/15 text-warning',
    card_attached: 'bg-primary/15 text-primary',
    usage_charge: 'bg-accent/15 text-accent',
    refund: 'bg-warning/15 text-warning',
};

interface StatusBadgeProps {
    status: string;
    className?: string;
    size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'sm' }: StatusBadgeProps) {
    const variant = variants[status] || variants.draft;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-semibold',
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
                variant,
                className
            )}
        >
            {formatStatus(status)}
        </span>
    );
}
