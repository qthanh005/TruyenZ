import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { api, endpoints } from '@/services/apiClient';

type FollowedStory = {
	id: number;
	title: string;
	coverImageId?: string;
	author?: string;
	description?: string;
	genres?: string[];
};

export default function FollowPage() {
	const { isAuthenticated } = useAuth();
	const [followedStories, setFollowedStories] = useState<FollowedStory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		const loadFollowedStories = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await api.get<{ storyIds: number[] }>(endpoints.getFollowedStories());
				const storyIds = response.data.storyIds;

				if (storyIds.length === 0) {
					setFollowedStories([]);
					return;
				}

				// Load story details for each storyId
				const storyPromises = storyIds.map(async (storyId) => {
					try {
						const storyResponse = await api.get(endpoints.storyDetail(String(storyId)));
						return storyResponse.data;
					} catch (err) {
						console.error(`Failed to load story ${storyId}:`, err);
						return null;
					}
				});

				const stories = await Promise.all(storyPromises);
				const validStories = stories.filter((story): story is FollowedStory => story !== null);
				setFollowedStories(validStories);
			} catch (err: any) {
				console.error('Failed to load followed stories:', err);
				setError(err.response?.data?.error || 'Không thể tải danh sách truyện đã theo dõi');
			} finally {
				setLoading(false);
			}
		};

		loadFollowedStories();
	}, [isAuthenticated]);

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-rose-500/20">
						<Heart className="h-12 w-12 text-rose-500" />
					</div>
					<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Vui lòng đăng nhập</h2>
					<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
						Bạn cần đăng nhập để xem danh sách truyện đã theo dõi
					</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="space-y-8">
				{/* Hero Skeleton */}
				<div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-rose-500/10 p-12 dark:border-zinc-800">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-64 rounded-lg bg-white/20"></div>
						<div className="h-4 w-96 rounded-lg bg-white/10"></div>
					</div>
				</div>
				{/* Cards Skeleton */}
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{[...Array(8)].map((_, i) => (
						<div key={i} className="animate-pulse space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
							<div className="aspect-[3/4] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
							<div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
							<div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
				<p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Hero Section */}
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-rose-500/10 p-8 shadow-lg dark:border-zinc-800 md:p-12">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_50%)]"></div>
				<div className="relative z-10">
					<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
						<div className="space-y-3">
							<div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
								<Sparkles size={14} />
								<span>Bộ sưu tập của bạn</span>
							</div>
							<h1 className="text-4xl font-bold text-zinc-900 dark:text-white md:text-5xl">
								Truyện đang theo dõi
							</h1>
							<p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
								Danh sách tất cả truyện bạn đã theo dõi. Nhận thông báo khi có chương mới và không bao giờ bỏ lỡ cập nhật!
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<div className="rounded-2xl border border-white/20 bg-white/40 px-6 py-4 backdrop-blur-sm dark:bg-zinc-900/40">
								<div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
									<Heart size={20} className="fill-current" />
									<span className="text-xs font-medium uppercase tracking-wide">Tổng số</span>
								</div>
								<p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{followedStories.length}</p>
								<p className="text-xs text-zinc-500 dark:text-zinc-400">truyện đang theo dõi</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{followedStories.length === 0 ? (
				<div className="relative overflow-hidden rounded-3xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-16 text-center dark:border-zinc-700 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.05),transparent_70%)]"></div>
					<div className="relative z-10">
						<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-rose-500/20">
							<Heart className="h-12 w-12 text-rose-500" />
						</div>
						<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Chưa có truyện nào</h2>
						<p className="mx-auto mt-3 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
							Bạn chưa theo dõi truyện nào. Hãy khám phá và nhấn nút "Theo dõi" trên trang chi tiết truyện để nhận thông báo khi có chương mới!
						</p>
						<Link
							to="/"
							className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand/80 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/40"
						>
							<BookOpen size={18} />
							Khám phá truyện ngay
						</Link>
					</div>
				</div>
			) : (
				<>
					{/* Stats Cards */}
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-rose-500/5 to-pink-500/5 p-6 dark:border-zinc-800">
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-rose-500/10 p-3">
									<Heart className="h-6 w-6 text-rose-500" />
								</div>
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										Đang theo dõi
									</p>
									<p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{followedStories.length}</p>
								</div>
							</div>
						</div>
						<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-6 dark:border-zinc-800">
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-emerald-500/10 p-3">
									<TrendingUp className="h-6 w-6 text-emerald-500" />
								</div>
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										Đang cập nhật
									</p>
									<p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
										{Math.floor(followedStories.length * 0.6)}
									</p>
								</div>
							</div>
						</div>
						<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 dark:border-zinc-800">
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-amber-500/10 p-3">
									<Star className="h-6 w-6 text-amber-500" />
								</div>
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										Yêu thích
									</p>
									<p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
										{Math.floor(followedStories.length * 0.8)}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Stories Grid */}
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{followedStories.map((story, index) => {
							const coverUrl = story.coverImageId
								? `${(import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
								: `https://picsum.photos/seed/story-${story.id}/300/400`;
							return (
								<Link
									key={story.id}
									to={`/story/${story.id}`}
									className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/20 dark:border-zinc-800 dark:bg-zinc-950"
									style={{ animationDelay: `${index * 50}ms` }}
								>
									{/* Follow Badge */}
									<div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
										<Heart size={12} className="fill-current" />
										<span>Theo dõi</span>
									</div>

									{/* Image Container */}
									<div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
										<img
											src={coverUrl}
											alt={story.title}
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
											loading="lazy"
										/>
										{/* Hover Overlay */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
									</div>

									{/* Content */}
									<div className="relative p-5">
										<h3 className="line-clamp-2 min-h-[3rem] font-bold text-zinc-900 transition-colors group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
											{story.title}
										</h3>
										{story.author && (
											<p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
												<span className="truncate">Tác giả: {story.author}</span>
											</p>
										)}
										{story.genres && story.genres.length > 0 && (
											<div className="mt-3 flex flex-wrap gap-1.5">
												{story.genres.slice(0, 2).map((genre) => (
													<span
														key={genre}
														className="rounded-full bg-gradient-to-r from-zinc-100 to-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 transition-colors group-hover:from-rose-100 group-hover:to-pink-100 group-hover:text-rose-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-300 dark:group-hover:from-rose-900/30 dark:group-hover:to-pink-900/30 dark:group-hover:text-rose-300"
													>
														{genre}
													</span>
												))}
											</div>
										)}
										{/* Read Button on Hover */}
										<div className="mt-4 opacity-0 transition-opacity group-hover:opacity-100">
											<div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md">
												<BookOpen size={14} />
												<span>Đọc ngay</span>
											</div>
										</div>
									</div>

									{/* Shine Effect */}
									<div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-full group-hover:opacity-100"></div>
								</Link>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}

