import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { SearchBar } from '@/components/SearchBar';
import { Moon, Sun, LogIn, LogOut, User as UserIcon, BookOpen } from 'lucide-react';

export function Navbar() {
	const { current, theme, setTheme } = useTheme();
	const { isAuthenticated, user, login, logout } = useAuth();
	const navigate = useNavigate();

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
						<button
							className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90"
							onClick={() => login(window.location.pathname + window.location.search)}
						>
							<LogIn className="h-4 w-4" />
							<span>Đăng nhập</span>
						</button>
					)}
				</div>
			</div>
		</header>
	);
}


