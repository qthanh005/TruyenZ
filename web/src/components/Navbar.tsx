import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { SearchBar } from '@/components/SearchBar';
import { Moon, Sun, LogIn, LogOut, User as UserIcon, BookOpen } from 'lucide-react';

export function Navbar() {
	const { current, theme, setTheme } = useTheme();
    const { isAuthenticated, user, login, logout } = useAuth();
	const navigate = useNavigate();
    const [openLoginMenu, setOpenLoginMenu] = useState(false);
    const loginBtnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const closeMenu = useCallback(() => setOpenLoginMenu(false), []);
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const t = e.target as Node;
            if (menuRef.current && menuRef.current.contains(t)) return;
            if (loginBtnRef.current && loginBtnRef.current.contains(t)) return;
            setOpenLoginMenu(false);
        }
        if (openLoginMenu) {
            document.addEventListener('mousedown', onDocClick);
        }
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [openLoginMenu]);

	return (
		<header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
				<Link to="/" className="flex items-center gap-2 font-semibold">
					<BookOpen className="h-5 w-5 text-brand" />
					<span>TruyệnZ</span>
				</Link>
				<div className="flex-1" />
				<div className="hidden md:block w-full max-w-lg">
					<SearchBar onSelect={(storyId) => navigate(`/story/${storyId}`)} />
				</div>
                <div className="flex items-center gap-2">
					<button
						className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
						onClick={() => setTheme(theme === 'dark' || (theme === 'system' && current === 'dark') ? 'light' : 'dark')}
						aria-label="Toggle theme"
					>
						{current === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</button>
					{isAuthenticated ? (
						<>
							<button
								className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
								onClick={() => navigate('/me')}
							>
								<UserIcon className="h-4 w-4" />
								<span>{user?.profile?.name || user?.profile?.preferred_username || 'Tôi'}</span>
							</button>
							<button
								className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90"
								onClick={() => logout()}
							>
								<LogOut className="h-4 w-4" />
								<span>Đăng xuất</span>
							</button>
						</>
                    ) : (
                        <div className="relative">
                            <button
                                ref={loginBtnRef}
                                className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90"
                                onClick={() => setOpenLoginMenu((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={openLoginMenu}
                            >
                                <LogIn className="h-4 w-4" />
                                <span>Đăng nhập</span>
                            </button>
                            {openLoginMenu && (
                                <div
                                    ref={menuRef}
                                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                                    role="menu"
                                >
                                    <button
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        onClick={() => {
                                            closeMenu();
                                            login(window.location.pathname + window.location.search, 'oauth2');
                                        }}
                                        role="menuitem"
                                    >
                                        <span className="inline-flex h-5 w-5 items-center justify-center">
                                            {/* Google/Gmail logo */}
                                            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                                                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.837 32.657 29.326 36 24 36 16.82 36 11 30.18 11 23S16.82 10 24 10c3.183 0 6.087 1.205 8.296 3.172l5.657-5.657C34.676 3.042 29.566 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22c12.15 0 22-9.85 22-22 0-1.341-.138-2.651-.389-3.917z"/>
                                                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.312 15.232 18.793 12 24 12c3.183 0 6.087 1.205 8.296 3.172l5.657-5.657C34.676 3.042 29.566 1 24 1 16.319 1 9.656 5.075 6.306 11.309z"/>
                                                <path fill="#4CAF50" d="M24 45c5.243 0 10.024-1.98 13.64-5.22l-6.29-5.32C29.155 36.691 26.715 37.5 24 37.5 18.708 37.5 14.246 34.19 12.903 29.5l-6.536 5.036C9.647 41.924 16.276 45 24 45z"/>
                                                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.313 3.657-5.151 6.5-9.303 6.5-5.292 0-9.754-3.31-11.097-8l-6.536 5.036C11.196 38.925 17.825 42 25.5 42c12.15 0 22-9.85 22-22 0-1.341-.138-2.651-.389-3.917z"/>
                                            </svg>
                                        </span>
                                        <span>Đăng nhập với Google</span>
                                    </button>
                                    <button
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        onClick={() => {
                                            closeMenu();
                                            login(window.location.pathname + window.location.search, 'facebook');
                                        }}
                                        role="menuitem"
                                    >
                                        <span className="inline-flex h-5 w-5 items-center justify-center">
                                            {/* Facebook logo */}
                                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]" aria-hidden="true">
                                                <path d="M22.675 0h-21.35C.595 0 0 .594 0 1.326v21.348C0 23.406.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.765v2.316h3.588l-.467 3.622h-3.121V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .594 23.406 0 22.675 0z"/>
                                            </svg>
                                        </span>
                                        <span>Đăng nhập với Facebook</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
				</div>
			</div>
		</header>
	);
}


