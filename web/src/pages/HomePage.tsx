import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flame, Layers, Sparkles, Star } from 'lucide-react';

type Story = {
	id: string;
	title: string;
	cover?: string;
	genres?: string[];
	rating?: number;
	description?: string;
	isPremium?: boolean;
	price?: number;
};

const HERO_ITEMS = [
	{
		id: '1',
		title: 'Đại Chúa Tể',
		description: 'Thiếu niên bước vào thế giới linh lực huyền ảo, viết lại truyền kỳ của bản thân.',
		cover: 'https://picsum.photos/seed/hero-1/1200/680',
		genres: ['Huyền Huyễn', 'Hành Động'],
		badge: 'Siêu phẩm tuần này',
	},
	{
		id: '2',
		title: 'One Piece',
		description: 'Băng hải tặc Mũ Rơm tiếp tục chinh phục biển cả và giấc mơ tự do.',
		cover: 'https://picsum.photos/seed/hero-2/1200/680',
		genres: ['Phiêu Lưu', 'Hành Động'],
		badge: 'Đang leo hạng',
	},
	{
		id: '3',
		title: 'Attack on Titan',
		description: 'Cuộc chiến sinh tồn giữa loài người và Titan với những bí mật kinh hoàng.',
		cover: 'https://picsum.photos/seed/hero-3/1200/680',
		genres: ['Kịch Tính', 'Hành Động'],
		badge: 'Xu hướng',
	},
	{
		id: '4',
		title: 'Kimetsu no Yaiba',
		description: 'Tanjiro bước vào luyện tập hơi thở mặt trời để giải cứu em gái.',
		cover: 'https://picsum.photos/seed/hero-4/1200/680',
		genres: ['Siêu Nhiên', 'Hành Động'],
		badge: 'Cập nhật mới',
	},
];

const NEW_STORIES = Array.from({ length: 12 }).map((_, i) => ({
	id: `${i + 5}`,
	title: `Truyện mới #${i + 1}`,
	cover: `https://picsum.photos/seed/new-${i}/420/560`,
	genres: i % 2 === 0 ? ['Hành Động'] : ['Trinh Thám', 'Hài Hước'],
	isPremium: i % 3 === 0,
	price: i % 3 === 0 ? 35000 + i * 1000 : undefined,
}));

const HOT_SIDEBAR = [
	{
		id: '11',
		title: 'Đấu Phá Thương Khung',
		cover: 'https://picsum.photos/seed/hot-side-1/120/168',
		genres: ['Huyền Huyễn'],
		views: 1_234_000,
	},
	{
		id: '12',
		title: 'Võ Luyện Đỉnh Phong',
		cover: 'https://picsum.photos/seed/hot-side-2/120/168',
		genres: ['Tiên Hiệp'],
		views: 987_654,
	},
	{
		id: '13',
		title: 'Legend of the Northern Blade',
		cover: 'https://picsum.photos/seed/hot-side-3/120/168',
		genres: ['Kiếm Hiệp'],
		views: 764_321,
	},
	{
		id: '14',
		title: 'Blue Lock',
		cover: 'https://picsum.photos/seed/hot-side-4/120/168',
		genres: ['Thể Thao'],
		views: 543_210,
	},
];

const CURATED_COLLECTIONS = [
	{
		title: 'Khởi đầu mạnh mẽ',
		description: 'Những bộ truyện mở màn bùng nổ, cuốn hút ngay từ chương đầu tiên.',
		color: 'from-emerald-500/15 via-emerald-500/10 to-emerald-500/5',
		items: ['Solo Leveling', 'One Punch Man', 'Jujutsu Kaisen'],
	},
	{
		title: 'Thế giới kỳ ảo',
		description: 'Du hành qua những vũ trụ đầy ma pháp và sinh vật huyền bí.',
		color: 'from-purple-500/15 via-purple-500/10 to-purple-500/5',
		items: ['Đại Chúa Tể', 'Attack on Titan', 'Demon Slayer'],
	},
	{
		title: 'Tiếng cười ngọt ngào',
		description: 'Góc giải trí nhẹ nhàng với những tình huống hài hước, lãng mạn.',
		color: 'from-amber-500/15 via-amber-500/10 to-amber-500/5',
		items: ['Doraemon', 'Spy x Family', 'Our Beloved Summer'],
	},
];

export default function HomePage() {
	const [slide, setSlide] = useState(0);
	const [autoPlay, setAutoPlay] = useState(true);

	useEffect(() => {
		if (!autoPlay) return;
		const interval = setInterval(() => {
			setSlide((prev) => (prev + 1) % HERO_ITEMS.length);
		}, 5000);
		return () => clearInterval(interval);
	}, [autoPlay]);

	const heroActive = useMemo(() => HERO_ITEMS[slide], [slide]);

	const formatPrice = (price?: number) =>
		new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price ?? 39000);

	return (
		<div className="space-y-12">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 text-white shadow-lg dark:border-zinc-800">
				<div className="relative h-[420px] w-full md:h-[480px]">
					{HERO_ITEMS.map((story, index) => (
						<Link
							key={story.id}
							to={`/story/${story.id}`}
							className={`absolute inset-0 transition duration-[900ms] ease-out ${
								index === slide ? 'opacity-100' : 'pointer-events-none opacity-0'
							}`}
						>
							<img
								src={story.cover}
								alt={story.title}
								className="h-full w-full object-cover"
								loading="lazy"
							/>
							<div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/20" />
							<div className="absolute inset-x-0 bottom-0 p-6 pb-8 sm:p-10">
								<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
									<Flame size={14} />
									{story.badge}
								</div>
								<h2 className="mt-4 text-2xl font-semibold sm:text-3xl md:text-4xl">{story.title}</h2>
								<p className="mt-2 max-w-2xl text-sm text-zinc-200 sm:text-base">{story.description}</p>
								<div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
									{story.genres?.map((genre) => (
										<span key={genre} className="rounded-full bg-white/10 px-3 py-1">
											{genre}
										</span>
									))}
								</div>
							</div>
						</Link>
					))}

					<button
						className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							setAutoPlay(false);
							setSlide((prev) => (prev - 1 + HERO_ITEMS.length) % HERO_ITEMS.length);
						}}
						aria-label="Slide trước"
					>
						<ArrowLeft size={18} />
					</button>
					<button
						className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							setAutoPlay(false);
							setSlide((prev) => (prev + 1) % HERO_ITEMS.length);
						}}
						aria-label="Slide tiếp"
					>
						<ArrowRight size={18} />
					</button>
				</div>
				<div className="relative flex items-center justify-between border-t border-white/10 p-4 sm:p-6">
					<div className="flex items-center gap-3 text-white">
						<h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Hiện đang xem</h3>
						<span className="text-base font-semibold">{heroActive.title}</span>
					</div>
					<div className="flex gap-2">
						{HERO_ITEMS.map((_, index) => (
							<button
								key={index}
								className={`h-1.5 w-12 rounded-full transition ${index === slide ? 'bg-white' : 'bg-white/30'}`}
								onClick={() => {
									setAutoPlay(false);
									setSlide(index);
								}}
								aria-label={`Chuyển đến slide ${index + 1}`}
							/>
						))}
					</div>
				</div>
			</section>

			<section className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2 space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Truyện mới cập nhật</h2>
							<p className="text-sm text-zinc-500">Tiếp tục đọc những bộ vừa ra chương mới.</p>
						</div>
						<button className="text-sm font-medium text-brand hover:underline">Xem tất cả</button>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{NEW_STORIES.map((story, index) => (
							<Link
								key={story.id}
								to={`/story/${story.id}`}
								className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
							>
								<div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-200">
									<img
										src={story.cover}
										alt={story.title}
										className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
										loading="lazy"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
									<div
										className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${
											story.isPremium ? 'bg-amber-500' : 'bg-brand/90'
										}`}
									>
										{story.isPremium ? 'Premium' : index % 2 === 0 ? 'Mới' : 'Cập nhật'}
									</div>
								</div>
								<div className="space-y-2 p-3">
									<h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
										{story.title}
									</h3>
									{story.genres && (
										<p className="text-xs text-zinc-500 dark:text-zinc-400">{story.genres.join(', ')}</p>
									)}
									{story.isPremium && (
										<p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
											Giá: {formatPrice(story.price)}
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				</div>

				<aside className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Top truyện hot</h3>
							<button className="text-xs font-semibold text-brand hover:underline">Bảng xếp hạng</button>
						</div>
						<div className="mt-4 space-y-3">
							{HOT_SIDEBAR.map((story, index) => (
								<Link
									key={story.id}
									to={`/story/${story.id}`}
									className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
								>
									<div className="relative h-20 w-16 overflow-hidden rounded-xl bg-zinc-200">
										<img
											src={story.cover}
											alt={story.title}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
										<div className="absolute left-1 top-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
											#{index + 1}
										</div>
									</div>
									<div className="min-w-0 flex-1">
										<h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{story.title}</h4>
										{story.genres && (
											<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{story.genres.join(', ')}</p>
										)}
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											{story.views?.toLocaleString('vi-VN')} lượt xem
										</p>
									</div>
								</Link>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
						<h3 className="text-base font-semibold text-zinc-900 dark:text-white">Khám phá theo bộ sưu tập</h3>
						<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
							Chọn từng bộ sưu tập để xem các đề xuất được tuyển chọn kỹ lưỡng.
						</p>
						<div className="mt-4 grid gap-3 text-left">
							{CURATED_COLLECTIONS.map((collection) => (
								<div key={collection.title} className={`rounded-2xl border border-transparent bg-gradient-to-r ${collection.color} p-4`}
								>
									<h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{collection.title}</h4>
									<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{collection.description}</p>
									<div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
										{collection.items.map((item) => (
											<span key={item} className="rounded-full bg-white/80 px-2 py-0.5 dark:bg-zinc-800/80">
												{item}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</aside>
			</section>
		</div>
	);
}


