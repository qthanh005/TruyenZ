import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Grid3x3, Layers, Stars, Tag, X, BookOpen, Sparkles } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';
import { usePremiumStore } from '@/shared/stores/premiumStore';

type Category = {
	id: string;
	name: string;
	count: number;
	description: string;
	color: string;
	popularFor: string[];
};

type Story = {
	id: number;
	title: string;
	coverImageId?: string;
	author?: string;
	description?: string;
	genres?: string[];
	price: number;
	paid: boolean;
};

const CATEGORIES: Category[] = [
	{
		id: 'action',
		name: 'Hành Động',
		count: 1234,
		description: 'Những trận chiến mãn nhãn, anh hùng chiến đấu đến cùng.',
		color: 'from-red-500 to-rose-500',
		popularFor: ['Đại Chúa Tể', 'Kimetsu no Yaiba'],
	},
	{
		id: 'romance',
		name: 'Tình Cảm',
		count: 856,
		description: 'Những câu chuyện tình cảm đầy cảm xúc và lãng mạn.',
		color: 'from-pink-500 to-fuchsia-500',
		popularFor: ['Our Beloved Summer', 'Yours Truly'],
	},
	{
		id: 'fantasy',
		name: 'Huyền Huyễn',
		count: 2341,
		description: 'Thế giới ma pháp, thần khí và những truyền thuyết kỳ bí.',
		color: 'from-purple-500 to-indigo-500',
		popularFor: ['Đấu Phá Thương Khung', 'Hắc Ám Tây Du'],
	},
	{
		id: 'mystery',
		name: 'Trinh Thám',
		count: 567,
		description: 'Các vụ án hóc búa và chân tướng bất ngờ.',
		color: 'from-sky-500 to-blue-500',
		popularFor: ['Conan', 'Death Note'],
	},
	{
		id: 'comedy',
		name: 'Hài Hước',
		count: 789,
		description: 'Tiếng cười sảng khoái và những tình huống vui nhộn.',
		color: 'from-amber-500 to-orange-500',
		popularFor: ['Doraemon', 'Spy x Family'],
	},
	{
		id: 'drama',
		name: 'Kịch Tính',
		count: 654,
		description: 'Căng thẳng đỉnh điểm, cảm xúc mãnh liệt.',
		color: 'from-orange-500 to-red-500',
		popularFor: ['Attack on Titan', 'Tokyo Revengers'],
	},
	{
		id: 'adventure',
		name: 'Phiêu Lưu',
		count: 432,
		description: 'Hành trình khám phá vùng đất mới và những bí ẩn.',
		color: 'from-emerald-500 to-teal-500',
		popularFor: ['One Piece', 'Hunter x Hunter'],
	},
	{
		id: 'horror',
		name: 'Kinh Dị',
		count: 321,
		description: 'Rùng rợn, ám ảnh, những câu chuyện ma quái.',
		color: 'from-gray-700 to-gray-900',
		popularFor: ['Junji Ito Collection'],
	},
	{
		id: 'sci-fi',
		name: 'Khoa Học Viễn Tưởng',
		count: 543,
		description: 'Công nghệ tương lai, vũ trụ và giả tưởng khoa học.',
		color: 'from-cyan-500 to-sky-500',
		popularFor: ['Steins;Gate', 'Psycho-Pass'],
	},
	{
		id: 'slice-of-life',
		name: 'Đời Thường',
		count: 678,
		description: 'Những câu chuyện mộc mạc, gần gũi đời sống hằng ngày.',
		color: 'from-teal-500 to-emerald-500',
		popularFor: ['Barakamon', 'March Comes in Like a Lion'],
	},
	{
		id: 'supernatural',
		name: 'Siêu Nhiên',
		count: 890,
		description: 'Thế giới song song, linh hồn và phép thuật.',
		color: 'from-indigo-500 to-violet-500',
		popularFor: ['Bleach', 'Jujutsu Kaisen'],
	},
	{
		id: 'sports',
		name: 'Thể Thao',
		count: 234,
		description: 'Tinh thần đồng đội và đam mê cháy bỏng.',
		color: 'from-lime-500 to-green-500',
		popularFor: ['Haikyuu!!', 'Kuroko\'s Basketball'],
	},
];

const TAGS = [
	{ key: 'top', label: 'Thịnh hành' },
	{ key: 'new', label: 'Mới cập nhật' },
	{ key: 'classic', label: 'Kinh điển' },
	{ key: 'short', label: 'Ngắn tập' },
	{ key: 'long', label: 'Dài kỳ' },
];

const GRADIENT_COLORS = [
	'from-red-500 to-rose-500',
	'from-pink-500 to-fuchsia-500',
	'from-purple-500 to-indigo-500',
	'from-sky-500 to-blue-500',
	'from-amber-500 to-orange-500',
	'from-orange-500 to-red-500',
	'from-emerald-500 to-teal-500',
	'from-gray-700 to-gray-900',
	'from-cyan-500 to-sky-500',
	'from-teal-500 to-emerald-500',
	'from-indigo-500 to-violet-500',
	'from-lime-500 to-green-500',
	'from-violet-500 to-purple-500',
	'from-rose-500 to-pink-500',
	'from-blue-500 to-cyan-500',
];

function getGradientForGenre(genre: string, index: number): string {
	return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

export default function CategoriesPage() {
	const [activeTag, setActiveTag] = useState<string>('top');
	const [genres, setGenres] = useState<string[]>([]);
	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [stories, setStories] = useState<Story[]>([]);
	const [loadingGenres, setLoadingGenres] = useState(true);
	const [loadingStories, setLoadingStories] = useState(false);
	const [genreCounts, setGenreCounts] = useState<Map<string, number>>(new Map());
	const purchases = usePremiumStore((state) => state.purchases);
	const hasAccess = usePremiumStore((state) => state.hasAccess);
	const storiesSectionRef = useRef<HTMLDivElement>(null);

	// Load all genres
	useEffect(() => {
		const loadGenres = async () => {
			try {
				setLoadingGenres(true);
				const response = await api.get<string[]>(endpoints.getAllGenres());
				setGenres(response.data);
				
				// Load all stories to count genres
				const storiesResponse = await api.get<Story[]>(endpoints.stories());
				const allStories = storiesResponse.data;
				
				// Count stories per genre
				const counts = new Map<string, number>();
				allStories.forEach((story) => {
					if (story.genres) {
						story.genres.forEach((genre) => {
							const trimmed = genre.trim();
							if (trimmed) {
								counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
							}
						});
					}
				});
				setGenreCounts(counts);
			} catch (err) {
				console.error('Failed to load genres:', err);
			} finally {
				setLoadingGenres(false);
			}
		};

		loadGenres();
	}, []);

	// Load stories when genre is selected
	useEffect(() => {
		if (!selectedGenre) {
			setStories([]);
			return;
		}

		const loadStories = async () => {
			try {
				setLoadingStories(true);
				const response = await api.get<Story[]>(endpoints.getStoriesByGenre(selectedGenre, 0, 50));
				setStories(response.data);
			} catch (err) {
				console.error('Failed to load stories by genre:', err);
				setStories([]);
			} finally {
				setLoadingStories(false);
			}
		};

		loadStories();
	}, [selectedGenre]);

	const highlighted = useMemo(() => {
		if (genres.length === 0) return [];
		return genres.slice(0, 3).map((genre, index) => ({
			id: genre.toLowerCase().replace(/\s+/g, '-'),
			name: genre,
			count: genreCounts.get(genre) || 0,
			description: getGenreDescription(genre),
			color: getGradientForGenre(genre, index),
			popularFor: [],
		}));
	}, [genres, genreCounts]);

	const remaining = useMemo(() => {
		if (genres.length <= 3) return [];
		return genres.slice(3).map((genre, index) => ({
			id: genre.toLowerCase().replace(/\s+/g, '-'),
			name: genre,
			count: genreCounts.get(genre) || 0,
			description: getGenreDescription(genre),
			color: getGradientForGenre(genre, index + 3),
			popularFor: [],
		}));
	}, [genres, genreCounts]);

	function getGenreDescription(genre: string): string {
		const descriptions: Record<string, string> = {
			'Hành Động': 'Những trận chiến mãn nhãn, anh hùng chiến đấu đến cùng.',
			'Tình Cảm': 'Những câu chuyện tình cảm đầy cảm xúc và lãng mạn.',
			'Huyền Huyễn': 'Thế giới ma pháp, thần khí và những truyền thuyết kỳ bí.',
			'Trinh Thám': 'Các vụ án hóc búa và chân tướng bất ngờ.',
			'Hài Hước': 'Tiếng cười sảng khoái và những tình huống vui nhộn.',
			'Kịch Tính': 'Căng thẳng đỉnh điểm, cảm xúc mãnh liệt.',
			'Phiêu Lưu': 'Hành trình khám phá vùng đất mới và những bí ẩn.',
			'Kinh Dị': 'Rùng rợn, ám ảnh, những câu chuyện ma quái.',
			'Khoa Học Viễn Tưởng': 'Công nghệ tương lai, vũ trụ và giả tưởng khoa học.',
			'Đời Thường': 'Những câu chuyện mộc mạc, gần gũi đời sống hằng ngày.',
			'Siêu Nhiên': 'Thế giới song song, linh hồn và phép thuật.',
			'Thể Thao': 'Tinh thần đồng đội và đam mê cháy bỏng.',
		};
		return descriptions[genre] || `Khám phá những câu chuyện thuộc thể loại ${genre}.`;
	}

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-brand to-brand/80 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
				<div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
							<Grid3x3 size={16} />
							Thể loại
						</div>
						<h1 className="mt-4 text-3xl font-semibold md:text-4xl">Khám phá kho truyện theo gu của bạn</h1>
						<p className="mt-3 max-w-2xl text-sm text-white/85">
							Lọc truyện theo từng thể loại, từ phiêu lưu kỳ ảo đến đời thường nhẹ nhàng. Thư viện được cập nhật liên tục mỗi ngày để bạn luôn có lựa chọn mới.
						</p>
					</div>
					<div className="rounded-3xl bg-white/10 p-6 text-sm text-white/80 backdrop-blur">
						<span className="text-xs uppercase tracking-wide text-white/60">Gợi ý</span>
						<p className="mt-2">
							Đánh dấu thể loại yêu thích để nhận thông báo khi có truyện mới ra mắt. Bạn có thể theo dõi nhiều thể loại cùng lúc.
						</p>
					</div>
				</div>
				<div className="relative mt-6 flex flex-wrap gap-2 text-xs">
					{TAGS.map((tag) => (
						<button
							key={tag.key}
							onClick={() => setActiveTag(tag.key)}
							className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 transition ${
								activeTag === tag.key
									? 'border-white bg-white/15 text-white shadow-sm'
									: 'border-white/50 text-white/80 hover:border-white hover:text-white'
							}`}
						>
							<Tag size={14} />
							{tag.label}
						</button>
					))}
				</div>
			</section>

			{loadingGenres ? (
				<div className="grid gap-4 md:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
							<div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800"></div>
							<div className="mt-4 h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
							<div className="mt-2 h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800"></div>
						</div>
					))}
				</div>
			) : (
				<section className="grid gap-4 md:grid-cols-3">
					{highlighted.map((category) => (
						<button
							key={category.id}
							onClick={() => {
								setSelectedGenre(category.name);
								// Scroll to stories section after a short delay to allow state update
								setTimeout(() => {
									storiesSectionRef.current?.scrollIntoView({ 
										behavior: 'smooth', 
										block: 'start' 
									});
								}, 50);
							}}
							className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white text-left shadow-md transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`} />
							<div className="relative space-y-3 p-6">
								<div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white">
									<Layers size={14} />
									Top lựa chọn
								</div>
								<h2 className="text-lg font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
									{category.name}
								</h2>
								<p className="text-sm text-zinc-500 dark:text-zinc-400">{category.description}</p>
								<div className="mt-3 text-xs font-medium text-zinc-500">
									{category.count.toLocaleString('vi-VN')} truyện
								</div>
							</div>
						</button>
					))}
				</section>
			)}

			<section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Khám phá tất cả thể loại</h2>
						<p className="text-sm text-zinc-500">Chọn thể loại phù hợp với mood hiện tại của bạn.</p>
					</div>
					{selectedGenre && (
						<button
							onClick={() => setSelectedGenre(null)}
							className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-brand/40 hover:text-brand dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand/50 dark:hover:text-brand"
						>
							<X size={14} />
							Đóng
						</button>
					)}
				</div>
				{loadingGenres ? (
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(9)].map((_, i) => (
							<div key={i} className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
								<div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="mt-3 h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								<div className="mt-2 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800"></div>
							</div>
						))}
					</div>
				) : (
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{remaining.map((category) => (
							<button
								key={category.id}
								onClick={() => {
									setSelectedGenre(category.name);
									// Scroll to stories section after a short delay to allow state update
									setTimeout(() => {
										storiesSectionRef.current?.scrollIntoView({ 
											behavior: 'smooth', 
											block: 'start' 
										});
									}, 50);
								}}
								className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-lg ${
									selectedGenre === category.name
										? 'border-brand bg-brand/5 shadow-md dark:border-brand dark:bg-brand/10'
										: 'border-zinc-200 bg-zinc-50/80 hover:border-brand/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60'
								}`}
							>
								<div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 transition group-hover:opacity-15`} />
								<div className="relative space-y-2">
									<div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
										<Grid3x3 size={12} />
										Thể loại
									</div>
									<h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
										{category.name}
									</h3>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">{category.description}</p>
									<div className="pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
										{category.count.toLocaleString('vi-VN')} truyện
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</section>

			{/* Stories by Selected Genre */}
			{selectedGenre && (
				<section ref={storiesSectionRef} className="space-y-6 scroll-mt-8">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
								Truyện thể loại: <span className="text-brand">{selectedGenre}</span>
							</h2>
							<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
								{loadingStories ? 'Đang tải...' : `${stories.length} truyện`}
							</p>
						</div>
						<button
							onClick={() => setSelectedGenre(null)}
							className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-brand/40 hover:text-brand dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand/50 dark:hover:text-brand"
						>
							<X size={16} />
							Đóng
						</button>
					</div>

					{loadingStories ? (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{[...Array(8)].map((_, i) => (
								<div key={i} className="animate-pulse space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
									<div className="aspect-[3/4] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
									<div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
									<div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								</div>
							))}
						</div>
					) : stories.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
							<BookOpen className="mx-auto mb-4 h-16 w-16 text-zinc-400" />
							<h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Chưa có truyện nào</h3>
							<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
								Thể loại <span className="font-medium">{selectedGenre}</span> hiện chưa có truyện nào.
							</p>
						</div>
					) : (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{stories.map((story, index) => {
								const coverUrl = story.coverImageId
									? `${(import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
									: `https://picsum.photos/seed/story-${story.id}/300/400`;
								const isPremium = story.price > 0;
								const storyIdStr = String(story.id);
								return (
									<Link
										key={story.id}
										to={`/story/${story.id}`}
										className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand/20 dark:border-zinc-800 dark:bg-zinc-950"
										style={{ animationDelay: `${index * 50}ms` }}
									>
										{isPremium && (
											<div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
												<Sparkles size={12} />
												<span>Premium</span>
											</div>
										)}
										<div className="aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
											<img
												src={coverUrl}
												alt={story.title}
												className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
												loading="lazy"
											/>
										</div>
										<div className="p-4">
											<h3 className="line-clamp-2 min-h-[3rem] font-bold text-zinc-900 transition-colors group-hover:text-brand dark:text-white dark:group-hover:text-brand">
												{story.title}
											</h3>
											{story.author && (
												<p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
													Tác giả: {story.author}
												</p>
											)}
											{story.genres && story.genres.length > 0 && (
												<div className="mt-3 flex flex-wrap gap-1.5">
													{story.genres.slice(0, 2).map((genre) => (
														<span
															key={genre}
															className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
														>
															{genre}
														</span>
													))}
												</div>
											)}
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</section>
			)}
		</div>
	);
}
