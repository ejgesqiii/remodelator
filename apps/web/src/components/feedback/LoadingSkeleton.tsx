import { cn } from '@/lib/cn';

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
}

function SkeletonLine({ className }: { className?: string }) {
    return (
        <div
            className={cn('animate-skeleton rounded-lg bg-border', className)}
        />
    );
}

export function LoadingSkeleton({ className, count = 3 }: LoadingSkeletonProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonLine
                    key={i}
                    className={cn(
                        'h-5',
                        i === 0 ? 'w-3/4' : i === count - 1 ? 'w-1/2' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

/** Skeleton that mimics a stat card */
export function SkeletonCard() {
    return (
        <div className="animate-skeleton rounded-2xl border border-border bg-surface/80 p-5">
            <div className="mb-3 h-4 w-1/2 rounded bg-border" />
            <div className="h-8 w-2/3 rounded bg-border" />
        </div>
    );
}

/** Skeleton rows for tables/lists */
export function SkeletonRows({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-skeleton flex items-center gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3">
                    <div className="h-4 w-1/4 rounded bg-border" />
                    <div className="h-4 w-1/3 rounded bg-border" />
                    <div className="ml-auto h-4 w-16 rounded bg-border" />
                </div>
            ))}
        </div>
    );
}
