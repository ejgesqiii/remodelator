export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'remodelator-theme';

function isTheme(value: string | null): value is AppTheme {
    return value === 'light' || value === 'dark';
}

export function getStoredTheme(): AppTheme {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : 'light';
}

export function applyTheme(theme: AppTheme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: AppTheme): void {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        window.dispatchEvent(new CustomEvent<AppTheme>('remodelator-theme-change', { detail: theme }));
    }
    applyTheme(theme);
}

export function initializeTheme(): void {
    applyTheme(getStoredTheme());
}
