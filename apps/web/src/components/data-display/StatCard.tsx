import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: { value: string; positive?: boolean };
    className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm transition-colors hover:bg-surface-hover',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                {Icon && <Icon size={20} className="shrink-0 text-muted" />}
            </div>
            <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
                <p
                    className={cn(
                        'mt-1 text-xs font-medium',
                        trend.positive ? 'text-success' : 'text-destructive'
                    )}
                >
                    {trend.positive ? '↑' : '↓'} {trend.value}
                </p>
            )}
        </div>
    );
}
