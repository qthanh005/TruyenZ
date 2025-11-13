import { useEffect, useState } from 'react';
import { BookOpen, FileText, Users, Eye, Sparkles, Clock } from 'lucide-react';

type Stats = {
	totalComics: number;
	totalChapters: number;
	totalUsers: number;
	totalViews: number;
	recentComics: number;
	pendingChapters: number;
};

export default function AdminDashboard() {
	const [stats, setStats] = useState<Stats>({
		totalComics: 0,
		totalChapters: 0,
		totalUsers: 0,
		totalViews: 0,
		recentComics: 0,
		pendingChapters: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Mock data - sẽ thay thế bằng API call thực tế
		const timer = setTimeout(() => {
			setStats({
				totalComics: 1250,
				totalChapters: 15234,
				totalUsers: 8450,
				totalViews: 1250000,
				recentComics: 12,
				pendingChapters: 5,
			});
			setLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const statCards = [
		{ label: 'Tổng số truyện', value: stats.totalComics, icon: BookOpen, color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
		{ label: 'Tổng số chương', value: stats.totalChapters, icon: FileText, color: 'bg-green-500', gradient: 'from-green-500 to-green-600' },
		{ label: 'Người dùng', value: stats.totalUsers, icon: Users, color: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
		{ label: 'Lượt xem', value: stats.totalViews.toLocaleString('vi-VN'), icon: Eye, color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
		{ label: 'Truyện mới (7 ngày)', value: stats.recentComics, icon: Sparkles, color: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600' },
		{ label: 'Chương chờ duyệt', value: stats.pendingChapters, icon: Clock, color: 'bg-yellow-500', gradient: 'from-yellow-500 to-yellow-600' },
	];

	return (
		<div className="space-y-6">
			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{statCards.map((card, idx) => {
					const Icon = card.icon;
					return (
						<div
							key={idx}
							className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{card.label}</p>
									{loading ? (
										<div className="mt-2 h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
									) : (
										<p className="mt-2 text-3xl font-bold">{card.value}</p>
									)}
								</div>
								<div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
									<Icon className="h-6 w-6 text-white" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<h3 className="mb-4 text-lg font-semibold">Truyện mới nhất</h3>
					<div className="space-y-3">
						{loading ? (
							<div className="space-y-2">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
								))}
							</div>
						) : (
							[
								{ id: 1, title: 'Đại Chúa Tể', date: '2 giờ trước' },
								{ id: 2, title: 'Thám Tử Conan', date: '5 giờ trước' },
								{ id: 3, title: 'One Piece', date: '1 ngày trước' },
							].map((item) => (
								<div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
									<div>
										<p className="font-medium">{item.title}</p>
										<p className="text-xs text-zinc-500">{item.date}</p>
									</div>
									<button className="rounded-md bg-brand px-3 py-1 text-xs text-white hover:bg-brand/90">
										Xem
									</button>
								</div>
							))
						)}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<h3 className="mb-4 text-lg font-semibold">Hoạt động gần đây</h3>
					<div className="space-y-3">
						{loading ? (
							<div className="space-y-2">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
								))}
							</div>
						) : (
							[
								{ action: 'Thêm chương mới', target: 'Đại Chúa Tể - Chương 125', time: '10 phút trước' },
								{ action: 'Cập nhật truyện', target: 'Thám Tử Conan', time: '1 giờ trước' },
								{ action: 'Người dùng mới', target: 'user@example.com', time: '2 giờ trước' },
							].map((item, idx) => (
								<div key={idx} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
									<div className="mt-0.5 h-2 w-2 rounded-full bg-brand" />
									<div className="flex-1">
										<p className="text-sm">
											<span className="font-medium">{item.action}</span> - {item.target}
										</p>
										<p className="text-xs text-zinc-500">{item.time}</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

