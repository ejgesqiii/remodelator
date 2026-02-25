import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard,
    ClipboardList,
    Package,
    FileStack,
    CreditCard,
    Settings,
    ShieldCheck,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/estimates', label: 'Estimates', icon: ClipboardList },
    { to: '/catalog', label: 'Catalog', icon: Package },
    { to: '/templates', label: 'Templates', icon: FileStack },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const collapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggle = useUiStore((s) => s.toggleSidebar);
    const role = useAuthStore((s) => s.role);
    const location = useLocation();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r border-border bg-surface/80 backdrop-blur-xl',
                'flex flex-col transition-all duration-200 ease-in-out',
                collapsed ? 'w-[72px]' : 'w-[260px]'
            )}
        >
            {/* Logo */}
            <div className={cn('flex items-center border-b border-border px-4', collapsed ? 'h-16 justify-center' : 'h-16 gap-3')}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
                    R
                </div>
                {!collapsed && (
                    <span className="font-heading font-semibold text-lg tracking-tight">Remodelator</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map(({ to, label, icon: Icon }) => {
                        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                        return (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                        isActive
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                    )}
                                >
                                    <Icon
                                        size={20}
                                        className={cn(
                                            'shrink-0 transition-colors',
                                            isActive ? 'text-primary' : 'text-muted group-hover:text-foreground'
                                        )}
                                    />
                                    {!collapsed && <span>{label}</span>}
                                </NavLink>
                            </li>
                        );
                    })}

                    {/* Admin — only show for admin role */}
                    {role === 'admin' && (
                        <li>
                            <NavLink
                                to="/admin"
                                className={cn(
                                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                    location.pathname.startsWith('/admin')
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                )}
                            >
                                <ShieldCheck
                                    size={20}
                                    className={cn(
                                        'shrink-0 transition-colors',
                                        location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted group-hover:text-foreground'
                                    )}
                                />
                                {!collapsed && <span>Admin</span>}
                            </NavLink>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-border px-3 py-3">
                <button
                    onClick={toggle}
                    className={cn(
                        'flex w-full items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground'
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>
        </aside>
    );
}
