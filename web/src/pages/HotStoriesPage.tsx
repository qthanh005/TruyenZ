import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Sparkles, Star, TrendingUp } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type StoryResponse = {
	id: number;
	title: string;
	description?: string;
	coverImageId?: string;
	genres?: string[];
	author?: string;
	price: number;
	paid: boolean;
};

type Story = {
	id: string | number;
	title: string;
	description?: string;
	cover?: string;
	genres?: string[];
	rating?: number;
	trend?: number;
	views?: number;
	updatedAt?: string;
};

const FILTERS = [
	{ key: 'all', label: 'Tất cả' },
	{ key: 'action', label: 'Hành động' },
	{ key: 'adventure', label: 'Phiêu lưu' },
	{ key: 'drama', label: 'Kịch tính' },
	{ key: 'mystery', label: 'Trinh thám' },
	{ key: 'family', label: 'Gia đình' },
];

export default function HotStoriesPage() {
	const [activeFilter, setActiveFilter] = useState<string>('all');
	const [stories, setStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);

	// Load hot stories from API
	useEffect(() => {
		const loadHotStories = async () => {
			try {
				setLoading(true);
				const response = await api.get<StoryResponse[]>(endpoints.stories());
				
				// Convert to Story format and determine "hot" stories
				// For now, we'll use the first stories as "hot" (can be improved with actual trending logic)
				const allStories: Story[] = response.data.map((story) => {
					const coverUrl = story.coverImageId
						? `${(import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
						: `https://picsum.photos/seed/story-${story.id}/420/580`;
					
					// Generate mock data for rating, trend, views (can be replaced with real data later)
					const mockRating = 4.5 + Math.random() * 0.5; // 4.5 - 5.0
					const mockTrend = Math.floor(Math.random() * 30) + 5; // 5 - 35
					const mockViews = Math.floor(Math.random() * 2000000) + 100000; // 100k - 2M
					
					return {
						id: story.id,
						title: story.title,
						description: story.description,
						cover: coverUrl,
						genres: story.genres || [],
						rating: parseFloat(mockRating.toFixed(2)),
						trend: mockTrend,
						views: mockViews,
						updatedAt: 'Cập nhật gần đây',
					};
				});

				// Sort by ID (newest first) and take top stories as "hot"
				// In a real app, this would be based on views, ratings, or trending algorithm
				const sortedStories = allStories.sort((a, b) => {
					const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
					const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
					return bId - aId; // Newest first
				});

				// Take top 8 as hot stories
				setStories(sortedStories.slice(0, 8));
			} catch (error) {
				console.error('Error loading hot stories:', error);
				setStories([]);
			} finally {
				setLoading(false);
			}
		};

		loadHotStories();
	}, []);

	const { spotlight, others } = useMemo(() => {
		const filtered =
			activeFilter === 'all'
				? stories
				: stories.filter((story) =>
						story.genres?.some((genre) => genre.toLowerCase().includes(activeFilter))
				  );
		return {
			spotlight: filtered.slice(0, 3),
			others: filtered.slice(3),
		};
	}, [activeFilter, stories]);

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute inset-y-0 right-0 w-64 rounded-full bg-white/20 blur-3xl" />
				<div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div className="space-y-4">
						<div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
							<Flame size={16} />
							Hot Picks
						</div>
						<h1 className="text-3xl font-semibold md:text-4xl">Truyện bùng nổ được cộng đồng săn đón</h1>
						<p className="max-w-2xl text-sm text-white/85">
							Theo dõi những bộ truyện đang giữ nhiệt cao nhất trên nền tảng. Thứ hạng được cập nhật liên tục dựa trên lượt xem, tốc độ tăng trưởng và đánh giá.
						</p>
					</div>
					<div className="space-y-3 rounded-3xl bg-white/15 p-6 text-sm text-white/85 backdrop-blur">
						<div className="flex items-center gap-3">
							<Sparkles size={20} />
							<span className="text-xs uppercase tracking-wide text-white/70">Gợi ý trong ngày</span>
						</div>
						<p>
							Bấm vào từng bộ truyện để xem chi tiết chương mới nhất, thông tin thể loại và tốc độ cập nhật.
						</p>
					</div>
				</div>
				<div className="relative mt-6 flex flex-wrap gap-2 text-xs">
					{FILTERS.map((filter) => (
						<button
							key={filter.key}
							onClick={() => setActiveFilter(filter.key)}
							className={`rounded-full border px-4 py-1.5 transition ${
								activeFilter === filter.key
									? 'border-white bg-white/15 text-white shadow-sm'
									: 'border-white/50 text-white/80 hover:border-white hover:text-white'
							}`}
						>
							{filter.label}
						</button>
					))}
				</div>
			</section>

			{loading ? (
				<div className="grid gap-4 md:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
							<div className="h-64 w-full rounded-t-3xl bg-zinc-200 dark:bg-zinc-800"></div>
							<div className="mt-4 space-y-3">
								<div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800"></div>
							</div>
						</div>
					))}
				</div>
			) : spotlight.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
					<Flame className="mx-auto mb-4 h-16 w-16 text-zinc-400" />
					<h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Chưa có truyện hot</h3>
					<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
						Hiện chưa có truyện nào đang thịnh hành.
					</p>
				</div>
			) : (
				<section className="grid gap-4 md:grid-cols-3">
					{spotlight.map((story, index) => (
					<Link
						key={story.id}
						to={`/story/${story.id}`}
						className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-rose-500/20 opacity-0 transition group-hover:opacity-100" />
						<div className="relative">
							<img
								src={story.cover}
								alt={story.title}
								className="h-64 w-full rounded-t-3xl object-cover transition duration-500 group-hover:scale-105"
								loading="lazy"
							/>
							<div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
								{index === 0 ? '🔥 Nhiệt độ cao nhất' : index === 1 ? '🚀 Đà tăng mạnh' : '⭐ Đề cử nổi bật'}
							</div>
							<div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-zinc-900/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
								<TrendingUp size={14} />
								+{story.trend}% / tuần
							</div>
						</div>
						<div className="relative space-y-3 p-6">
							<div className="flex flex-wrap items-center gap-3 text-xs text-amber-600 dark:text-amber-400">
								<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-semibold">
									<Star size={14} /> {story.rating?.toFixed(2)}
								</span>
								<span>{story.views?.toLocaleString('vi-VN')} lượt xem</span>
								{story.updatedAt && <span>{story.updatedAt}</span>}
							</div>
							<h3 className="text-lg font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
								{story.title}
							</h3>
							<p className="text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">{story.description}</p>
							<div className="flex flex-wrap gap-2 text-xs text-zinc-500">
								{story.genres?.map((genre) => (
									<span key={genre} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
										{genre}
									</span>
								))}
							</div>
						</div>
					</Link>
					))}
				</section>
			)}

			{!loading && others.length > 0 && (
				<section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Danh sách tiếp tục bùng nổ</h2>
						<p className="text-sm text-zinc-500">Theo dõi các bộ truyện đang leo hạng nhanh chóng.</p>
					</div>
					<button className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline">
						Xem thêm <ArrowUpRight size={14} />
					</button>
				</div>

				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					{others.map((story) => (
						<Link
							key={story.id}
							to={`/story/${story.id}`}
							className="group relative flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
						>
							<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-brand/70 opacity-0 transition group-hover:opacity-100" />
							<div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-200 shadow-inner">
								<img src={story.cover} alt={story.title} className="h-full w-full object-cover" loading="lazy" />
							</div>
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								<div className="flex items-start justify-between gap-2">
									<h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
										{story.title}
									</h3>
									{story.rating && (
										<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
											<Star size={12} />
											{story.rating.toFixed(2)}
										</span>
									)}
								</div>
								<p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{story.description}</p>
								<div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
									{story.genres?.slice(0, 2).map((genre) => (
										<span key={genre} className="rounded-full bg-white px-2 py-0.5 shadow-sm dark:bg-zinc-800">
											{genre}
										</span>
									))}
									{story.trend && (
										<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-0.5 font-semibold text-emerald-600">
											<TrendingUp size={12} />
											+{story.trend}%
										</span>
									)}
									{story.updatedAt && <span>{story.updatedAt}</span>}
								</div>
							</div>
						</Link>
					))}
				</div>
			</section>
			)}
		</div>
	);
}
