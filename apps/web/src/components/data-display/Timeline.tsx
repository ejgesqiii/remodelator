import { cn } from '@/lib/cn';
import { StatusBadge } from './StatusBadge';

interface TimelineEvent {
    id: string;
    type: string;
    label?: string;
    detail?: string;
    amount?: string | number;
    timestamp: string;
}

interface TimelineProps {
    events: TimelineEvent[];
    maxHeight?: string;
    emptyMessage?: string;
}

export function Timeline({ events, maxHeight = '400px', emptyMessage = 'No events' }: TimelineProps) {
    if (events.length === 0) {
        return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
        <div className="overflow-y-auto space-y-0.5" style={{ maxHeight }}>
            {events.map((event, idx) => (
                <div
                    key={event.id}
                    className={cn(
                        'group relative flex gap-3 py-2.5 pl-6',
                        idx < events.length - 1 && 'border-l border-border'
                    )}
                >
                    {/* Dot */}
                    <div className="absolute left-0 top-3.5 -translate-x-1/2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-muted-foreground group-hover:bg-primary transition-colors" />

                    <div className="flex flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <StatusBadge status={event.type} size="sm" />
                                {event.label && (
                                    <span className="truncate text-xs text-muted-foreground">{event.label}</span>
                                )}
                            </div>
                            {event.detail && (
                                <p className="mt-0.5 truncate text-xs text-muted">{event.detail}</p>
                            )}
                        </div>
                        <div className="shrink-0 text-right">
                            {event.amount && (
                                <p className="font-mono text-sm font-semibold">{typeof event.amount === 'number' ? `$${event.amount.toFixed(2)}` : event.amount}</p>
                            )}
                            <p className="text-xs text-muted">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
