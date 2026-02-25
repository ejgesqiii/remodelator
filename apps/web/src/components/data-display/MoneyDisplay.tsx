import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/formatters';

interface MoneyDisplayProps {
    value: string | number | undefined | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
};

export function MoneyDisplay({ value, size = 'md', className }: MoneyDisplayProps) {
    return (
        <span className={cn('font-mono font-semibold', sizeClasses[size], className)}>
            {formatMoney(value)}
        </span>
    );
}
