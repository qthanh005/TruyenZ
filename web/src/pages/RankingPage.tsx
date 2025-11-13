import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Medal, Sparkles, Trophy, Zap } from 'lucide-react';

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
};

const baseStories: RankedStory[] = [
	{
		id: '1',
		title: 'Đại Chúa Tể',
		cover: 'https://picsum.photos/300/400?random=21',
		genres: ['Huyền Huyễn', 'Hành Động'],
		rating: 4.9,
		views: 1_234_567,
		rank: 1,
		trend: 3,
		updateNote: 'Cập nhật 2 giờ trước',
	},
	{
		id: '2',
		title: 'Thám Tử Lừng Danh Conan',
		cover: 'https://picsum.photos/300/400?random=22',
		genres: ['Trinh Thám'],
		rating: 4.7,
		views: 987_654,
		rank: 2,
		trend: 1,
		updateNote: 'Cập nhật hôm qua',
	},
	{
		id: '3',
		title: 'One Piece',
		cover: 'https://picsum.photos/300/400?random=23',
		genres: ['Phiêu Lưu', 'Hành Động'],
		rating: 4.9,
		views: 2_345_678,
		rank: 3,
		trend: 5,
		updateNote: 'Cập nhật 30 phút trước',
	},
	{
		id: '4',
		title: 'Naruto',
		cover: 'https://picsum.photos/300/400?random=24',
		genres: ['Hành Động'],
		rating: 4.6,
		views: 876_543,
		rank: 4,
		trend: -1,
		updateNote: 'Cập nhật 3 ngày trước',
	},
	{
		id: '5',
		title: 'Attack on Titan',
		cover: 'https://picsum.photos/300/400?random=25',
		genres: ['Hành Động', 'Kịch Tính'],
		rating: 4.92,
		views: 765_432,
		rank: 5,
		trend: 2,
		updateNote: 'Cập nhật 12 giờ trước',
	},
	{
		id: '6',
		title: 'Solo Leveling',
		cover: 'https://picsum.photos/300/400?random=26',
		genres: ['Hành Động'],
		rating: 4.8,
		views: 654_321,
		rank: 6,
		trend: 0,
		updateNote: 'Cập nhật tuần trước',
	},
	{
		id: '7',
		title: 'Doraemon',
		cover: 'https://picsum.photos/300/400?random=27',
		genres: ['Hài Hước'],
		rating: 4.5,
		views: 543_210,
		rank: 7,
		trend: 1,
		updateNote: 'Cập nhật 5 ngày trước',
	},
	{
		id: '8',
		title: 'Kimetsu no Yaiba',
		cover: 'https://picsum.photos/300/400?random=28',
		genres: ['Hành Động'],
		rating: 4.75,
		views: 432_109,
		rank: 8,
		trend: 4,
		updateNote: 'Cập nhật 3 giờ trước',
	},
	{
		id: '9',
		title: 'Jujutsu Kaisen',
		cover: 'https://picsum.photos/300/400?random=29',
		genres: ['Siêu Nhiên'],
		rating: 4.63,
		views: 321_098,
		rank: 9,
		trend: -2,
		updateNote: 'Cập nhật 1 ngày trước',
	},
	{
		id: '10',
		title: 'Spy x Family',
		cover: 'https://picsum.photos/300/400?random=30',
		genres: ['Gia Đình', 'Hài Hước'],
		rating: 4.81,
		views: 210_987,
		rank: 10,
		trend: 2,
		updateNote: 'Cập nhật 2 ngày trước',
	},
];

const filters = [
	{ key: 'weekly', label: 'Tuần này', icon: Flame },
	{ key: 'monthly', label: 'Tháng này', icon: Sparkles },
	{ key: 'all', label: 'Bảng tổng', icon: Trophy },
];

export default function RankingPage() {
	const [activeFilter, setActiveFilter] = useState<string>('weekly');

	const { topThree, remaining } = useMemo(() => {
		const sorted = [...baseStories].sort((a, b) => a.rank - b.rank);
		return {
			topThree: sorted.slice(0, 3),
			remaining: sorted.slice(3),
		};
	}, []);

	const stats = useMemo(
		() => [
			{
				title: 'Bảng xếp hạng cập nhật',
				value: '10 truyện',
				icon: Trophy,
				description: 'Dựa trên lượt xem và đánh giá thực tế trong 24h qua.',
			},
			{
				title: 'Xu hướng bùng nổ',
				value: '+38%',
				icon: Flame,
				description: 'Tăng trưởng lượt xem trung bình của top 3 so với tuần trước.',
			},
			{
				title: 'Điểm đánh giá trung bình',
				value: '4.78/5',
				icon: Sparkles,
				description: 'Được cộng đồng bình chọn và cập nhật mỗi ngày.',
			},
		],
		[]
	);

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
				{topThree.map((story) => (
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
				))}
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Danh sách nổi bật</h2>
				<div className="grid gap-4 lg:grid-cols-2">
					{remaining.map((story) => (
						<Link
							key={story.id}
							to={`/story/${story.id}`}
							className="group flex gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${rankBadgeClass(story.rank)}`}>
								#{story.rank}
							</div>
							<div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-inner">
								<img src={story.cover} alt={story.title} className="h-full w-full object-cover" loading="lazy" />
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
									<span>{story.views.toLocaleString('vi-VN')} lượt xem</span>
									{story.updateNote && <span>{story.updateNote}</span>}
								</div>
							</div>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
