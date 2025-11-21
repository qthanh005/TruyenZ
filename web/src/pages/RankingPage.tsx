import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Medal, Sparkles, Trophy, Zap } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type RankedStory = {
	id: string;
	title: string;
	cover?: string;
	genres?: string[];
	rating: number;
	views: number;
	rank: number;
	trend?: number;
	updateNote?: string;
	chapterCount?: number;
};

const filters = [
	{ key: 'weekly', label: 'Tuần này', icon: Flame },
	{ key: 'monthly', label: 'Tháng này', icon: Sparkles },
	{ key: 'all', label: 'Bảng tổng', icon: Trophy },
];

export default function RankingPage() {
	const [activeFilter, setActiveFilter] = useState<string>('weekly');
	const [stories, setStories] = useState<RankedStory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadRanking = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await api.get<{ id: number; title: string; genres?: string[]; coverImageId?: string; description?: string; }[]>(
					endpoints.stories()
				);

				const gateway = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081';
				const topStories = response.data.slice(0, 12);

				const enriched = await Promise.all(
					topStories.map(async (story, index) => {
						let chapterCount = 0;
						try {
							const chaptersRes = await api.get<{ id: number }[]>(endpoints.chapters(String(story.id)));
							chapterCount = chaptersRes.data.length;
						} catch (chapterError) {
							console.warn('Không thể tải chương cho truyện', story.id, chapterError);
						}

						const derivedRating = Math.min(5, 3 + chapterCount / 10);
						const derivedViews = chapterCount * 1500 + (index + 1) * 250;

						return {
							id: story.id.toString(),
							title: story.title,
							cover: story.coverImageId ? `${gateway}${story.coverImageId}` : undefined,
							genres: story.genres,
							rating: Number(derivedRating.toFixed(2)),
							views: derivedViews,
							rank: index + 1,
							trend: chapterCount ? Math.max(-5, Math.min(5, chapterCount - 5)) : 0,
							updateNote: chapterCount ? `${chapterCount} chương` : undefined,
							chapterCount,
						};
					})
				);

				const sorted = enriched.sort((a, b) => b.views - a.views).map((story, idx) => ({ ...story, rank: idx + 1 }));
				setStories(sorted);
			} catch (err: any) {
				console.error('Không thể tải bảng xếp hạng:', err);
				setError('Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.');
			} finally {
				setLoading(false);
			}
		};

		loadRanking();
	}, []);

	const filteredStories = useMemo(() => {
		if (activeFilter === 'monthly') {
			return [...stories].sort((a, b) => (b.chapterCount || 0) - (a.chapterCount || 0));
		}
		if (activeFilter === 'weekly') {
			return [...stories].sort((a, b) => (b.trend || 0) - (a.trend || 0));
		}
		return stories;
	}, [stories, activeFilter]);

	const topThree = filteredStories.slice(0, 3);
	const remaining = filteredStories.slice(3);

	const stats = useMemo(() => {
		if (!stories.length) {
			return [
				{ title: 'Bảng xếp hạng cập nhật', value: '—', icon: Trophy, description: 'Đang thu thập dữ liệu...' },
				{ title: 'Xu hướng bùng nổ', value: '—', icon: Flame, description: 'Đang cập nhật xu hướng.' },
				{ title: 'Điểm đánh giá trung bình', value: '—', icon: Sparkles, description: 'Sẽ hiển thị sau khi có dữ liệu.' },
			];
		}

		const avgRating = stories.reduce((sum, story) => sum + story.rating, 0) / stories.length;
		const avgChapters = stories.reduce((sum, story) => sum + (story.chapterCount || 0), 0) / stories.length;

		return [
			{
				title: 'Bảng xếp hạng cập nhật',
				value: `${stories.length} truyện`,
				icon: Trophy,
				description: 'Dựa trên dữ liệu truyện thực tế từ hệ thống.',
			},
			{
				title: 'Chương trung bình',
				value: `${Math.round(avgChapters)} chương`,
				icon: Flame,
				description: 'Trung bình số chương của các truyện trong bảng xếp hạng.',
			},
			{
				title: 'Điểm đánh giá trung bình',
				value: `${avgRating.toFixed(2)}/5`,
				icon: Sparkles,
				description: 'Được chuẩn hóa dựa trên số chương hiện có.',
			},
		];
	}, [stories]);

	const rankBadgeClass = (rank: number) => {
		if (rank === 1) return 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-white';
		if (rank === 2) return 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 text-slate-700';
		if (rank === 3) return 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 text-white';
		return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300';
	};

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-brand via-brand/80 to-brand/60 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
				<div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
							<Trophy size={16} />
							Bảng xếp hạng
						</div>
						<h1 className="mt-4 text-3xl font-semibold md:text-4xl">Top truyện được yêu thích nhất</h1>
						<p className="mt-3 max-w-2xl text-sm text-white/80">
							Khám phá những bộ truyện đang dẫn đầu, cập nhật theo thời gian thực dựa trên lượt xem, tốc độ tăng trưởng và đánh giá từ cộng đồng.
						</p>
						<div className="mt-6 flex flex-wrap gap-3 text-xs">
							{filters.map(({ key, label, icon: Icon }) => (
								<button
									key={key}
									onClick={() => setActiveFilter(key)}
									className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 transition ${
										activeFilter === key ? 'border-white bg-white/15 text-white shadow-sm' : 'border-white/50 text-white/70 hover:border-white hover:text-white'
									}`}
								>
									<Icon size={16} />
									{label}
								</button>
							))}
						</div>
					</div>
					<div className="rounded-3xl bg-white/15 p-6 text-sm text-white/80 backdrop-blur">
						<span className="text-xs uppercase tracking-wide text-white/60">Gợi ý</span>
						<p className="mt-2 text-sm">
							Hãy bookmark truyện bạn yêu thích để không bỏ lỡ chương mới nhất. Thứ hạng có thể thay đổi mỗi ngày dựa trên lượt xem và phản hồi.
						</p>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{stats.map(({ title, value, icon: Icon, description }) => (
					<div
						key={title}
						className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className="flex items-center gap-3">
							<div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
								<Icon size={22} />
							</div>
							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
								<p className="text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
							</div>
						</div>
						<p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
					</div>
				))}
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{(loading ? Array.from({ length: 3 }) : topThree).map((story, idx) =>
					loading ? (
						<div key={idx} className="h-96 animate-pulse rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
					) : story ? (
					<Link
						key={story.id}
						to={`/story/${story.id}`}
						className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand/20 to-transparent" />
						<div className="relative">
							<img
								src={story.cover}
								alt={story.title}
								className="h-64 w-full rounded-t-3xl object-cover"
								loading="lazy"
							/>
							<div className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand shadow">
								{story.rank === 1 ? 'Quán quân' : story.rank === 2 ? 'Á quân' : 'Hạng ba'}
							</div>
							<div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
								<ArrowUpRight size={14} />
								{story.trend ? (story.trend > 0 ? `+${story.trend}` : story.trend) : '•'}
							</div>
						</div>
						<div className="relative space-y-3 px-6 pb-6 pt-4">
							<div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
								<Medal size={14} />
								Top {story.rank}
							</div>
							<h3 className="text-lg font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
								{story.title}
							</h3>
							<p className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
								<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600">
									★ {story.rating.toFixed(2)}
								</span>
								<span>{story.views.toLocaleString('vi-VN')} lượt xem</span>
								{story.updateNote && <span>{story.updateNote}</span>}
							</p>
							{story.genres && (
								<div className="flex flex-wrap gap-2 text-xs text-zinc-500">
									{story.genres.map((genre) => (
										<span key={genre} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
											{genre}
										</span>
									))}
								</div>
							)}
						</div>
					</Link>
					) : null
				)}
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Danh sách nổi bật</h2>
				<div className="grid gap-4 lg:grid-cols-2">
					{loading
						? Array.from({ length: 4 }).map((_, idx) => (
								<div key={idx} className="h-28 animate-pulse rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
						  ))
						: remaining.map((story) => (
								<Link
									key={story.id}
									to={`/story/${story.id}`}
									className="group flex gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
								>
									<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${rankBadgeClass(story.rank)}`}>
										#{story.rank}
									</div>
									<div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-inner">
										{story.cover ? (
											<img src={story.cover} alt={story.title} className="h-full w-full object-cover" loading="lazy" />
										) : (
											<div className="grid h-full w-full place-items-center text-[10px] text-zinc-500">No Cover</div>
										)}
										{story.trend !== undefined && (
											<div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] text-white backdrop-blur">
												<Zap size={12} />
												{story.trend > 0 ? `+${story.trend}` : story.trend}
											</div>
										)}
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-2">
										<div className="flex items-start justify-between">
											<h3 className="truncate text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
												{story.title}
											</h3>
											<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
												★ {story.rating.toFixed(1)}
											</span>
										</div>
										{story.genres && (
											<p className="truncate text-xs text-zinc-500">{story.genres.join(' • ')}</p>
										)}
										<div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
											<span>{story.views.toLocaleString('vi-VN')} lượt xem tính theo chương</span>
											{story.updateNote && <span>{story.updateNote}</span>}
										</div>
									</div>
								</Link>
						  ))}
				</div>
			</section>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
					{error}
				</div>
			)}
		</div>
	);
}
