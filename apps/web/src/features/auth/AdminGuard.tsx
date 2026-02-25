import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const role = useAuthStore((s) => s.role);
    const location = useLocation();

    if (role !== 'admin') {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
