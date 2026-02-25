import { Component, type PropsWithChildren, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<PropsWithChildren<{ fallback?: React.ReactNode }>, ErrorBoundaryState> {
    constructor(props: PropsWithChildren<{ fallback?: React.ReactNode }>) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive-muted/30 p-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                        <AlertTriangle size={24} className="text-destructive" />
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-destructive">Something went wrong</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="mt-4 flex items-center gap-2 rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-active"
                    >
                        <RotateCcw size={16} /> Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
