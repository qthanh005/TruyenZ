import { useEffect, useMemo, useState } from 'react';
import {
	ArrowUpRight,
	BookOpen,
	CheckCircle2,
	FileText,
	ImageOff,
	Sparkles,
	ShieldCheck,
	TrendingUp,
	Users,
	Tags,
} from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type StoryResponse = {
	id: number;
	title: string;
	description?: string;
	genres?: string[];
	coverImageId?: string;
	paid?: boolean;
	price?: number;
	author?: string;
};

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
};

type Stats = {
	totalComics: number;
	totalChapters: number;
	totalUsers: number;
	totalGenres: number;
	paidStories: number;
	freeStories: number;
	chaptersWithoutImages: number;
	storiesWithChapters: number;
};

type StoryOverview = {
	id: number;
	title: string;
	chapterCount: number;
	latestChapterNumber: number;
};

type ActivityItem = {
	id: number;
	title: string;
	meta: string;
	status: 'complete' | 'missing-images';
};

export default function AdminDashboard() {
	const [stats, setStats] = useState<Stats>({
		totalComics: 0,
		totalChapters: 0,
		totalUsers: 0,
		totalGenres: 0,
		paidStories: 0,
		freeStories: 0,
		chaptersWithoutImages: 0,
		storiesWithChapters: 0,
	});
	const [loading, setLoading] = useState(true);
	const [recentStories, setRecentStories] = useState<StoryOverview[]>([]);
	const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				setLoading(true);
				
				const [storiesRes, usersRes, genresRes] = await Promise.allSettled([
					api.get<StoryResponse[]>(endpoints.stories()),
					api.get<any[]>(endpoints.getAllUsers()),
					api.get<string[]>(endpoints.getAllGenres()),
				]);

				const stories = storiesRes.status === 'fulfilled' && Array.isArray(storiesRes.value.data) ? storiesRes.value.data : [];
				const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
				const genres = genresRes.status === 'fulfilled' && Array.isArray(genresRes.value.data) ? genresRes.value.data : [];

				const chapterResults = await Promise.allSettled(
					stories.map((story) => api.get<ChapterResponse[]>(endpoints.chapters(String(story.id))))
				);

				const chaptersByStory = chapterResults.map((result) =>
					result.status === 'fulfilled' && Array.isArray(result.value.data) ? result.value.data : []
				);

				const totalChapters = chaptersByStory.reduce((sum, chapters) => sum + chapters.length, 0);
				const chaptersWithoutImages = chaptersByStory.reduce(
					(sum, chapters) => sum + chapters.filter((chapter) => !chapter.imageIds || chapter.imageIds.length === 0).length,
					0
				);

				const storyMeta: StoryOverview[] = stories.map((story, idx) => {
					const chapters = chaptersByStory[idx];
					const latestChapterNumber = chapters.length ? Math.max(...chapters.map((chapter) => chapter.chapterNumber)) : 0;
					return {
					id: story.id,
					title: story.title,
						chapterCount: chapters.length,
						latestChapterNumber,
					};
				});

				storyMeta.sort((a, b) => b.latestChapterNumber - a.latestChapterNumber);
				setRecentStories(storyMeta.slice(0, 3));

				const latestChapters: ActivityItem[] = chaptersByStory
					.flatMap((chapters, idx) =>
						chapters.map((chapter) => ({
							id: chapter.id,
							title: chapter.title || `Chương ${chapter.chapterNumber}`,
							meta: `${stories[idx]?.title || 'Truyện'} • Chương ${chapter.chapterNumber}`,
							status: chapter.imageIds && chapter.imageIds.length > 0 ? 'complete' : 'missing-images',
						}))
					)
					.sort((a, b) => (b.id || 0) - (a.id || 0))
					.slice(0, 5);
				setActivityFeed(latestChapters);

				setStats({
					totalComics: stories.length,
					totalChapters,
					totalUsers: users.length,
					totalGenres: genres.length,
					paidStories: stories.filter((story) => story.paid).length,
					freeStories: stories.filter((story) => !story.paid).length,
					chaptersWithoutImages,
					storiesWithChapters: chaptersByStory.filter((chapters) => chapters.length > 0).length,
				});
			} catch (error) {
				console.error('Error loading dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadDashboardData();
	}, []);

	const derivedMetrics = useMemo(
		() => ({
			avgChaptersPerStory: stats.totalComics ? (stats.totalChapters / stats.totalComics).toFixed(1) : '0',
			completedChaptersRatio: stats.totalChapters
				? Math.round(((stats.totalChapters - stats.chaptersWithoutImages) / stats.totalChapters) * 100)
				: 0,
			activeStoriesRatio: stats.totalComics ? Math.round((stats.storiesWithChapters / stats.totalComics) * 100) : 0,
		}),
		[stats]
	);

	const statCards = [
		{
			label: 'Tổng số truyện',
			value: stats.totalComics,
			icon: BookOpen,
			gradient: 'from-sky-400 via-sky-500 to-blue-500',
			helper: `${stats.storiesWithChapters} truyện đang có chương`,
		},
		{
			label: 'Chương đã xuất bản',
			value: stats.totalChapters,
			icon: FileText,
			gradient: 'from-emerald-400 via-emerald-500 to-green-500',
			helper: `${stats.chaptersWithoutImages} chương thiếu ảnh`,
		},
		{
			label: 'Người dùng',
			value: stats.totalUsers,
			icon: Users,
			gradient: 'from-purple-400 via-purple-500 to-fuchsia-500',
			helper: 'Lấy từ user-service',
		},
		{
			label: 'Thể loại hệ thống',
			value: stats.totalGenres,
			icon: Tags,
			gradient: 'from-amber-400 via-orange-500 to-orange-600',
			helper: 'Tổng số thể loại có sẵn',
		},
		{
			label: 'Truyện trả phí',
			value: stats.paidStories,
			icon: Sparkles,
			gradient: 'from-pink-400 via-pink-500 to-rose-500',
			helper: `${stats.freeStories} truyện miễn phí`,
		},
		{
			label: 'Chương thiếu ảnh',
			value: stats.chaptersWithoutImages,
			icon: ImageOff,
			gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
			helper: 'Cần bổ sung nội dung',
		},
	];

	const actionShortcuts = [
		{ label: 'Tạo truyện mới', icon: Sparkles },
		{ label: 'Thêm chương', icon: FileText },
		{ label: 'Gửi thông báo', icon: ShieldCheck },
		{ label: 'Theo dõi crawler', icon: TrendingUp },
	];

	const healthBadges = [
		{
			title: 'Tỉ lệ chương đầy đủ',
			description: 'Đã có hình ảnh',
			value: `${derivedMetrics.completedChaptersRatio}%`,
		},
		{
			title: 'Truyện có nội dung',
			description: 'Đang hoạt động',
			value: `${derivedMetrics.activeStoriesRatio}%`,
		},
		{
			title: 'Nội dung phong phú',
			description: 'Trung bình chương/truyện',
			value: derivedMetrics.avgChaptersPerStory || 0,
		},
	];

	return (
		<div className="space-y-8">
			<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-8 text-white shadow-lg">
				<div className="absolute inset-0 opacity-30">
					<div className="absolute left-1/3 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand blur-3xl" />
					<div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-pink-500 blur-3xl" />
				</div>
				<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-white/70">TruyenZ Command Center</p>
						<h2 className="mt-3 text-3xl font-semibold">Tổng quan hoạt động</h2>
						<p className="mt-2 max-w-xl text-white/70">
							Cập nhật mới nhất về nội dung, người dùng và tiến độ phát hành. Trang quản trị được nâng cấp để giúp bạn điều hành dễ dàng hơn.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							{healthBadges.map((badge) => (
								<div key={badge.title} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-white/60">{badge.title}</p>
									<div className="mt-1 flex items-baseline gap-2">
										<span className="text-2xl font-semibold">{badge.value}</span>
										<span className="text-xs text-white/60">{badge.description}</span>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="grid w-full max-w-xl grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						{actionShortcuts.map((action) => {
							const Icon = action.icon;
							return (
								<button
									key={action.label}
									className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-white/90 transition hover:bg-white/10"
								>
									<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
										<Icon className="h-5 w-5" />
									</span>
									<span className="text-sm font-medium">{action.label}</span>
									<ArrowUpRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
								</button>
							);
						})}
					</div>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{statCards.map((card) => {
					const Icon = card.icon;
					return (
						<div
							key={card.label}
							className="group rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/70"
						>
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm font-medium text-zinc-500">{card.label}</p>
									{loading ? (
										<div className="mt-3 h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
									) : (
										<p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">{card.value}</p>
									)}
									<p className="mt-2 text-xs text-zinc-500">{card.helper}</p>
								</div>
								<div className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-3 text-white shadow-lg`}>
									<Icon className="h-6 w-6" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="space-y-6 xl:col-span-2">
					<div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-zinc-500">Nhịp độ phát hành</p>
								<h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Bảng điều phối nội dung</h3>
							</div>
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
								<TrendingUp className="h-4 w-4" />
								{stats.totalChapters} chương hiện có
							</span>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
								{[
									{ label: 'Tỉ lệ hoàn chỉnh', value: `${derivedMetrics.completedChaptersRatio}%`, highlight: 'Chương có đủ ảnh' },
									{ label: 'Chương/truyện', value: derivedMetrics.avgChaptersPerStory || '-', highlight: 'Trung bình toàn hệ' },
									{ label: 'Truyện có chương', value: `${stats.storiesWithChapters}/${stats.totalComics}`, highlight: 'Đang hoạt động' },
								].map((metric) => (
								<div key={metric.label} className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{metric.label}</p>
									<p className="mt-2 text-2xl font-semibold">{metric.value}</p>
									<p className="text-xs text-zinc-500">{metric.highlight}</p>
								</div>
							))}
						</div>
						<div className="mt-6 space-y-4">
							{[
								{ label: 'Chương đầy đủ nội dung', value: derivedMetrics.completedChaptersRatio },
								{ label: 'Truyện đang hoạt động', value: derivedMetrics.activeStoriesRatio },
							].map((progress) => (
								<div key={progress.label}>
									<div className="flex items-center justify-between text-sm">
										<p className="text-zinc-600 dark:text-zinc-400">{progress.label}</p>
										<span className="font-medium">{progress.value}%</span>
									</div>
									<div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
										<div
											className="h-full rounded-full bg-gradient-to-r from-brand via-purple-500 to-pink-500"
											style={{ width: `${progress.value}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-semibold">Truyện mới nhất</h3>
							<button className="text-sm text-brand hover:underline">Xem tất cả</button>
						</div>
					<div className="space-y-3">
						{loading ? (
							<div className="space-y-2">
								{[1, 2, 3].map((i) => (
										<div key={i} className="h-12 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
								))}
							</div>
							) : recentStories.length ? (
							recentStories.map((item) => (
									<div key={item.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
									<div>
										<p className="font-medium">{item.title}</p>
											<p className="text-xs text-zinc-500">
												{item.chapterCount} chương • Chương mới nhất #{item.latestChapterNumber}
											</p>
									</div>
										<button className="flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-xs font-medium text-brand transition hover:bg-brand/10">
											Chi tiết
											<ArrowUpRight className="h-4 w-4" />
									</button>
								</div>
							))
							) : (
								<p className="text-sm text-zinc-500">Chưa có dữ liệu truyện gần đây.</p>
						)}
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
								<ShieldCheck className="h-6 w-6" />
							</div>
							<div>
								<p className="text-sm font-medium text-zinc-500">Trạng thái hệ thống</p>
								<h3 className="text-xl font-semibold text-zinc-900 dark:text-white">An tâm vận hành</h3>
							</div>
						</div>
						<ul className="mt-4 space-y-4">
							{[
								{ label: 'Crawler', status: 'Hoạt động ổn định', badge: 'Đồng bộ mỗi 30 phút' },
								{ label: 'Thanh toán', status: 'Stripe kết nối', badge: 'Không có lỗi gần đây' },
								{ label: 'Thông báo', status: 'Realtime push', badge: 'Độ trễ dưới 1s' },
							].map((item) => (
								<li key={item.label} className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
									<div className="flex items-start justify-between">
										<div>
											<p className="text-sm font-medium">{item.label}</p>
											<p className="text-xs text-zinc-500">{item.status}</p>
										</div>
										<span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{item.badge}</span>
									</div>
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
					<h3 className="mb-4 text-lg font-semibold">Hoạt động gần đây</h3>
						<div className="space-y-4">
						{loading ? (
							<div className="space-y-2">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
								))}
							</div>
						) : activityFeed.length ? (
							activityFeed.map((activity) => (
								<div key={`${activity.meta}-${activity.id}`} className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
											activity.status === 'complete'
												? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
												: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200'
										}`}
									>
										{activity.status === 'complete' ? <CheckCircle2 className="h-5 w-5" /> : <ImageOff className="h-5 w-5" />}
									</div>
									<div>
										<p className="font-medium">{activity.title}</p>
										<p className="text-xs text-zinc-500">{activity.meta}</p>
									</div>
								</div>
							))
						) : (
							<p className="text-sm text-zinc-500">Chưa có hoạt động nào.</p>
						)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

