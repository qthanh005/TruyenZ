import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LayoutDashboard, BookOpen, FileText, Users, Tags, Bot, Shield, ArrowLeft, Home } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminComics from '@/components/admin/AdminComics';
import AdminChapters from '@/components/admin/AdminChapters';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminGenres from '@/components/admin/AdminGenres';
import AdminCrawler from '@/components/admin/AdminCrawler';

type AdminTab = 'dashboard' | 'comics' | 'chapters' | 'users' | 'genres' | 'crawler';

export default function AdminPage() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

	const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
		{ id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
		{ id: 'comics', label: 'Quản lý truyện', icon: BookOpen },
		{ id: 'chapters', label: 'Quản lý chương', icon: FileText },
		{ id: 'users', label: 'Quản lý người dùng', icon: Users },
		{ id: 'genres', label: 'Thể loại', icon: Tags },
		{ id: 'crawler', label: 'Crawler', icon: Bot },
	];

	const renderContent = () => {
		switch (activeTab) {
			case 'dashboard':
				return <AdminDashboard />;
			case 'comics':
				return <AdminComics />;
			case 'chapters':
				return <AdminChapters />;
			case 'users':
				return <AdminUsers />;
			case 'genres':
				return <AdminGenres />;
			case 'crawler':
				return <AdminCrawler />;
			default:
				return <AdminDashboard />;
		}
	};

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="flex h-screen overflow-hidden">
				{/* Sidebar */}
				<aside className="relative flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
							<Shield className="h-5 w-5" />
						</div>
						<h1 className="text-xl font-bold text-brand">Admin Panel</h1>
					</div>
					<div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
						<Link
							to="/"
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Quay về trang chủ</span>
						</Link>
					</div>
					<nav className="flex-1 overflow-y-auto p-4">
						<div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
							Menu
						</div>
						<div className="space-y-1">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
											activeTab === tab.id
												? 'bg-brand text-white shadow-sm'
												: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
										}`}
									>
										<Icon className={`h-5 w-5 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-zinc-500'}`} />
										<span>{tab.label}</span>
									</button>
								);
							})}
						</div>
					</nav>
					<div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/10 text-brand font-semibold ring-2 ring-brand/20">
								{user?.profile?.name?.[0]?.toUpperCase() || user?.profile?.email?.[0]?.toUpperCase() || 'A'}
							</div>
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-medium">
									{user?.profile?.name || user?.profile?.email || 'Admin'}
								</div>
								<div className="truncate text-xs text-zinc-500">Quản trị viên</div>
							</div>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto">
					<div className="p-6">
						<div className="mb-6 flex items-start justify-between">
							<div>
								<h2 className="text-2xl font-semibold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
								<p className="mt-1 text-sm text-zinc-500">Quản lý và điều hành hệ thống TruyệnZ</p>
							</div>
							<Link
								to="/"
								className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
							>
								<Home className="h-4 w-4" />
								<span className="hidden sm:inline">Về trang chủ</span>
							</Link>
						</div>
						{renderContent()}
					</div>
				</main>
			</div>
		</div>
	);
}

