import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Sparkles, Star, TrendingUp } from 'lucide-react';

type Story = {
	id: string;
	title: string;
	description?: string;
	cover?: string;
	genres?: string[];
	rating?: number;
	trend?: number;
	views?: number;
	updatedAt?: string;
};

const HOT_STORIES: Story[] = [
	{
		id: '1',
		title: 'Đại Chúa Tể',
		description: 'Thiếu niên bước vào thế giới linh lực huyền ảo, viết lại truyền kỳ của bản thân.',
		cover: 'https://picsum.photos/seed/hot-1/420/580',
		genres: ['Huyền Huyễn', 'Hành Động'],
		rating: 4.92,
		trend: 35,
		views: 1_823_000,
		updatedAt: 'Cập nhật 10 phút trước',
	},
	{
		id: '2',
		title: 'One Piece',
		description: 'Băng hải tặc Mũ Rơm tiếp tục hành trình chinh phục biển cả và giấc mơ tự do.',
		cover: 'https://picsum.photos/seed/hot-2/420/580',
		genres: ['Phiêu Lưu', 'Hành Động'],
		rating: 4.9,
		trend: 18,
		views: 2_501_230,
		updatedAt: 'Cập nhật 35 phút trước',
	},
	{
		id: '3',
		title: 'Attack on Titan',
		description: 'Cuộc chiến sinh tồn giữa loài người và Titan với những bí mật kinh hoàng.',
		cover: 'https://picsum.photos/seed/hot-3/420/580',
		genres: ['Hành Động', 'Kịch Tính'],
		rating: 4.94,
		trend: 24,
		views: 965_320,
		updatedAt: 'Cập nhật 1 giờ trước',
	},
	{
		id: '4',
		title: 'Kimetsu no Yaiba',
		description: 'Hành trình diệt quỷ cứu em gái với hơi thở mặt trời truyền thừa.',
		cover: 'https://picsum.photos/seed/hot-4/420/580',
		genres: ['Siêu Nhiên', 'Hành Động'],
		rating: 4.87,
		trend: 11,
		views: 743_210,
		updatedAt: 'Cập nhật hôm nay',
	},
	{
		id: '5',
		title: 'Solo Leveling',
		description: 'Từ thợ săn yếu nhất hoá thành tồn tại vượt qua mọi giới hạn.',
		cover: 'https://picsum.photos/seed/hot-5/420/580',
		genres: ['Hành Động'],
		rating: 4.8,
		trend: 15,
		views: 1_101_900,
		updatedAt: 'Cập nhật 3 giờ trước',
	},
	{
		id: '6',
		title: 'Thám Tử Lừng Danh Conan',
		description: 'Những vụ án hóc búa, từng bước vạch trần tổ chức áo đen.',
		cover: 'https://picsum.photos/seed/hot-6/420/580',
		genres: ['Trinh Thám'],
		rating: 4.7,
		trend: 6,
		views: 902_450,
		updatedAt: 'Cập nhật hôm qua',
	},
	{
		id: '7',
		title: 'Jujutsu Kaisen',
		description: 'Chú thuật sư đối đầu lời nguyền mạnh nhất đại diện cho hỗn loạn.',
		cover: 'https://picsum.photos/seed/hot-7/420/580',
		genres: ['Siêu Nhiên'],
		rating: 4.6,
		trend: 8,
		views: 563_220,
		updatedAt: 'Cập nhật 2 ngày trước',
	},
	{
		id: '8',
		title: 'Spy x Family',
		description: 'Gia đình mật vụ giả tưởng với những bí mật ngọt ngào.',
		cover: 'https://picsum.photos/seed/hot-8/420/580',
		genres: ['Gia Đình', 'Hài Hước'],
		rating: 4.81,
		trend: 9,
		views: 468_930,
		updatedAt: 'Cập nhật 5 giờ trước',
	},
];

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

	const { spotlight, others } = useMemo(() => {
		const filtered =
			activeFilter === 'all'
				? HOT_STORIES
				: HOT_STORIES.filter((story) =>
						story.genres?.some((genre) => genre.toLowerCase().includes(activeFilter))
				  );
		return {
			spotlight: filtered.slice(0, 3),
			others: filtered.slice(3),
		};
	}, [activeFilter]);

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
		</div>
	);
}
