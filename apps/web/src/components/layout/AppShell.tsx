import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

export function AppShell() {
    const collapsed = useUiStore((s) => s.sidebarCollapsed);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background">
            {/* Skip to content — accessibility */}
            <a href="#main-content" className="skip-to-content">
                Skip to content
            </a>

            <Sidebar />
            <div
                className={cn(
                    'flex min-h-screen flex-col transition-all duration-200',
                    collapsed ? 'ml-[72px]' : 'ml-[260px]'
                )}
            >
                <Header />
                <main id="main-content" className="flex-1 p-6" role="main">
                    <div key={location.pathname} className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
