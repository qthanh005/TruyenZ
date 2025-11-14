import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
	current: 'light' | 'dark';
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const storageKey = 'tz_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || 'dark');
	const [current, setCurrent] = useState<'light' | 'dark'>(() => 'dark');

	useEffect(() => {
		const root = window.document.documentElement;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = (t: Theme) => {
			const isDark = t === 'dark' || (t === 'system' && media.matches);
			root.classList.toggle('dark', isDark);
			setCurrent(isDark ? 'dark' : 'light');
		};
		apply(theme);
		const onChange = () => theme === 'system' && apply('system');
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	}, [theme]);

	const value = useMemo<ThemeContextValue>(() => ({ current, theme, setTheme: (t) => {
		localStorage.setItem(storageKey, t);
		setTheme(t);
	}}), [current, theme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}


