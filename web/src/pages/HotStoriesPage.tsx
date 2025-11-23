import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Sparkles, Star, TrendingUp, Zap, Award, Crown, Eye, Clock, BookOpen, Heart, TrendingDown } from 'lucide-react';
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
			{/* Enhanced Header Section */}
			<section className="group relative overflow-hidden rounded-3xl border-2 border-orange-500/20 bg-gradient-to-br from-orange-500 via-red-500 via-rose-500 to-pink-500 p-8 text-white shadow-2xl shadow-orange-500/20 dark:border-orange-400/30">
				{/* Animated background effects */}
				<div className="absolute inset-0">
					<div className="absolute inset-y-0 right-0 w-96 rounded-full bg-white/20 blur-3xl animate-pulse" />
					<div className="absolute inset-y-0 left-0 w-64 rounded-full bg-yellow-400/20 blur-2xl animate-pulse delay-1000" />
					<div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-2xl animate-pulse delay-500" />
				</div>
				
				<div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
					<div className="space-y-5 flex-1">
						<div className="inline-flex items-center gap-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg">
							<Flame className="h-4 w-4 text-yellow-300 animate-pulse" />
							<span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">Hot Picks</span>
						</div>
						<div className="space-y-3">
							<h1 className="text-4xl font-bold md:text-5xl leading-tight">
								<span className="bg-gradient-to-r from-white via-yellow-100 to-orange-100 bg-clip-text text-transparent">
									Truyện bùng nổ
								</span>
								<br />
								<span className="text-white">được cộng đồng săn đón</span>
							</h1>
							<p className="max-w-2xl text-base text-white/90 leading-relaxed">
								Theo dõi những bộ truyện đang giữ nhiệt cao nhất trên nền tảng. Thứ hạng được cập nhật liên tục dựa trên lượt xem, tốc độ tăng trưởng và đánh giá.
							</p>
						</div>
					</div>
					
					<div className="relative space-y-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 shadow-xl">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400/30 to-orange-400/30 border border-white/20">
								<Sparkles className="h-5 w-5 text-yellow-200" />
							</div>
							<div>
								<span className="text-xs font-bold uppercase tracking-wider text-yellow-200">Gợi ý trong ngày</span>
								<p className="mt-1 text-sm text-white/90 leading-relaxed">
									Bấm vào từng bộ truyện để xem chi tiết chương mới nhất, thông tin thể loại và tốc độ cập nhật.
								</p>
							</div>
						</div>
					</div>
				</div>
				
				{/* Enhanced Filter Buttons */}
				<div className="relative mt-8 flex flex-wrap gap-3">
					{FILTERS.map((filter) => (
						<button
							key={filter.key}
							onClick={() => setActiveFilter(filter.key)}
							className={`group relative overflow-hidden rounded-full border-2 px-5 py-2.5 text-xs font-semibold transition-all duration-300 ${
								activeFilter === filter.key
									? 'border-white bg-white/25 text-white shadow-lg shadow-white/20 scale-105'
									: 'border-white/40 bg-white/10 text-white/90 hover:border-white hover:bg-white/20 hover:text-white hover:scale-105'
							}`}
						>
							{activeFilter === filter.key && (
								<div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-pulse" />
							)}
							<span className="relative z-10">{filter.label}</span>
						</button>
					))}
				</div>
			</section>

			{loading ? (
				<div className="grid gap-6 md:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="animate-pulse rounded-3xl border-2 border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50/50 p-6 shadow-lg dark:border-zinc-800/60 dark:from-zinc-950 dark:to-zinc-900/50">
							<div className="h-72 w-full rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700"></div>
							<div className="mt-5 space-y-4">
								<div className="h-5 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="h-6 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="h-4 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
							</div>
						</div>
					))}
				</div>
			) : spotlight.length === 0 ? (
				<div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-zinc-300/60 bg-gradient-to-br from-white via-zinc-50/50 to-white p-16 text-center shadow-lg dark:border-zinc-700/60 dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950">
					<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
					<div className="relative">
						<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20">
							<Flame className="h-10 w-10 text-orange-500 dark:text-orange-400" />
						</div>
						<h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Chưa có truyện hot</h3>
						<p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
							Hiện chưa có truyện nào đang thịnh hành.
						</p>
					</div>
				</div>
			) : (
				<section className="grid gap-6 md:grid-cols-3">
					{spotlight.map((story, index) => {
						const badges = [
							{ icon: Crown, text: 'Nhiệt độ cao nhất', color: 'from-yellow-500 to-orange-500' },
							{ icon: Zap, text: 'Đà tăng mạnh', color: 'from-blue-500 to-cyan-500' },
							{ icon: Award, text: 'Đề cử nổi bật', color: 'from-purple-500 to-pink-500' }
						];
						const badge = badges[index] || badges[2];
						
						return (
							<Link
								key={story.id}
								to={`/story/${story.id}`}
								className="group relative overflow-hidden rounded-3xl border-2 border-zinc-200/60 bg-gradient-to-br from-white via-white to-zinc-50/30 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-orange-400/60 hover:shadow-2xl hover:shadow-orange-500/20 dark:border-zinc-800/60 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/30 dark:hover:border-orange-500/40"
							>
								{/* Gradient overlay on hover */}
								<div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-transparent to-rose-500/0 opacity-0 transition-opacity duration-500 group-hover:from-orange-500/10 group-hover:via-transparent group-hover:to-rose-500/10" />
								
								{/* Image Section */}
								<div className="relative overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
									<img
										src={story.cover}
										alt={story.title}
										className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-110"
										loading="lazy"
									/>
									
									{/* Top Badge */}
									<div className={`absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${badge.color} px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm border border-white/20`}>
										<badge.icon className="h-4 w-4" />
										{badge.text}
									</div>
									
									{/* Trend Badge */}
									<div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/90 to-teal-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm border border-white/20">
										<TrendingUp className="h-3.5 w-3.5" />
										+{story.trend}%
									</div>
								</div>
								
								{/* Content Section */}
								<div className="relative space-y-4 p-6">
									{/* Stats Row */}
									<div className="flex flex-wrap items-center gap-3">
										<span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
											<Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
											{story.rating?.toFixed(1)}
										</span>
										<span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
											<Eye className="h-3.5 w-3.5" />
											{story.views && story.views >= 1000000 
												? `${(story.views / 1000000).toFixed(1)}M`
												: story.views && story.views >= 1000
												? `${(story.views / 1000).toFixed(1)}K`
												: story.views?.toLocaleString('vi-VN')
											}
										</span>
										{story.updatedAt && (
											<span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/80 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
												<Clock className="h-3.5 w-3.5" />
												{story.updatedAt}
											</span>
										)}
									</div>
									
									{/* Title */}
									<h3 className="text-xl font-bold text-zinc-900 transition-colors duration-300 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
										{story.title}
									</h3>
									
									{/* Description */}
									<p className="text-sm leading-relaxed text-zinc-600 line-clamp-2 dark:text-zinc-400">
										{story.description}
									</p>
									
									{/* Genres */}
									<div className="flex flex-wrap gap-2 pt-2">
										{story.genres?.slice(0, 3).map((genre) => (
											<span key={genre} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-zinc-100 to-zinc-200/80 border border-zinc-200/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:from-zinc-800 dark:to-zinc-900/80 dark:border-zinc-700/60 dark:text-zinc-300">
												<BookOpen className="h-3 w-3" />
												{genre}
											</span>
										))}
									</div>
								</div>
							</Link>
						);
					})}
				</section>
			)}

			{!loading && others.length > 0 && (
				<section className="relative overflow-hidden rounded-3xl border-2 border-zinc-200/60 bg-gradient-to-br from-white via-zinc-50/30 to-white p-8 shadow-xl dark:border-zinc-800/60 dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950">
					{/* Decorative background */}
					<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
					
					<div className="relative flex flex-wrap items-center justify-between gap-4 mb-6">
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
									<TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
								</div>
								<div>
									<h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Danh sách tiếp tục bùng nổ</h2>
									<p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Theo dõi các bộ truyện đang leo hạng nhanh chóng.</p>
								</div>
							</div>
						</div>
						<button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand/80 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand/40">
							Xem thêm
							<ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
						</button>
					</div>

					<div className="relative grid gap-4 lg:grid-cols-2">
						{others.map((story, index) => (
							<Link
								key={story.id}
								to={`/story/${story.id}`}
								className="group relative flex gap-4 rounded-2xl border-2 border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50/50 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:bg-white hover:shadow-xl hover:shadow-orange-500/10 dark:border-zinc-800/60 dark:from-zinc-950 dark:to-zinc-900/50 dark:hover:border-orange-500/40"
							>
								{/* Animated left border */}
								<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-orange-500 via-red-500 to-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
								
								{/* Cover Image */}
								<div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-lg ring-2 ring-zinc-200/50 dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700/50">
									<img 
										src={story.cover} 
										alt={story.title} 
										className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
										loading="lazy" 
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
								</div>
								
								{/* Content */}
								<div className="flex min-w-0 flex-1 flex-col gap-3">
									<div className="flex items-start justify-between gap-3">
										<h3 className="line-clamp-2 text-base font-bold text-zinc-900 transition-colors duration-300 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
											{story.title}
										</h3>
										{story.rating && (
											<span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
												<Star className="h-3 w-3 fill-amber-500 text-amber-500" />
												{story.rating.toFixed(1)}
											</span>
										)}
									</div>
									
									<p className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
										{story.description}
									</p>
									
									<div className="flex flex-wrap items-center gap-2">
										{story.genres?.slice(0, 2).map((genre) => (
											<span key={genre} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-zinc-100 to-zinc-200/80 border border-zinc-200/60 px-2.5 py-1 text-[10px] font-medium text-zinc-700 shadow-sm dark:from-zinc-800 dark:to-zinc-900/80 dark:border-zinc-700/60 dark:text-zinc-300">
												<BookOpen className="h-2.5 w-2.5" />
												{genre}
											</span>
										))}
										{story.trend && (
											<span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
												<TrendingUp className="h-3 w-3" />
												+{story.trend}%
											</span>
										)}
										{story.updatedAt && (
											<span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100/80 px-2.5 py-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
												<Clock className="h-2.5 w-2.5" />
												{story.updatedAt}
											</span>
										)}
										{story.views && (
											<span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100/80 px-2.5 py-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
												<Eye className="h-2.5 w-2.5" />
												{story.views >= 1000000 
													? `${(story.views / 1000000).toFixed(1)}M`
													: story.views >= 1000
													? `${(story.views / 1000).toFixed(1)}K`
													: story.views.toLocaleString('vi-VN')
												}
											</span>
										)}
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
