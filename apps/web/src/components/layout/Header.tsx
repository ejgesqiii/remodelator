import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/features/auth/useAuth';
import { LogOut, User } from 'lucide-react';

export function Header() {
    const email = useAuthStore((s) => s.email);
    const { logout } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/60 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
                <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {/* Page title injected via PageHeader */}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {email && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5">
                            <User size={16} className="text-muted" />
                            <span className="text-sm font-medium text-muted-foreground">{email}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
