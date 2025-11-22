import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Flame, Layers, Sparkles, Star, XCircle } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';
import { useWalletStore } from '@/shared/stores/walletStore';
import { usePremiumStore } from '@/shared/stores/premiumStore';

type Story = {
	id: string | number;
	title: string;
	cover?: string;
	genres?: string[];
	rating?: number;
	description?: string;
	isPremium?: boolean;
	price?: number;
};

type StoryResponse = {
	id: number;
	title: string;
	description?: string;
	genres?: string[];
	coverImageId?: string;
	paid: boolean;
	price: number;
	author: string;
};

// Helper function to convert story-service response to HomePage format
const mapStoryResponse = (story: StoryResponse, index?: number): Story & { badge?: string } => {
	const coverUrl = story.coverImageId 
		? `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
		: `https://picsum.photos/seed/story-${story.id}/420/560`;
	
	// Premium is determined by price > 0
	const isPremium = story.price > 0;
	
	return {
		id: story.id,
		title: story.title,
		cover: coverUrl,
		genres: story.genres || [],
		description: story.description,
		isPremium: isPremium,
		price: isPremium ? story.price : undefined,
		badge: index === 0 ? 'Siêu phẩm tuần này' : index === 1 ? 'Đang leo hạng' : index === 2 ? 'Xu hướng' : 'Cập nhật mới',
	};
};

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
	const [stories, setStories] = useState<Story[]>([]);
	const [heroStories, setHeroStories] = useState<(Story & { badge?: string })[]>([]);
	const [newStories, setNewStories] = useState<Story[]>([]);
	const [hotStories, setHotStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const { syncBalance } = useWalletStore();
	const purchases = usePremiumStore((state) => state.purchases);
	const hasAccess = usePremiumStore((state) => state.hasAccess);
	const paymentStatus = searchParams.get('paymentStatus');
	const txnRef = searchParams.get('txnRef');

	// Load stories from story-service
	useEffect(() => {
		const loadStories = async () => {
			try {
				setLoading(true);
				const response = await api.get<StoryResponse[]>(endpoints.stories());
				const allStories = response.data.map(mapStoryResponse);
				
				setStories(allStories);
				
				// Hero stories: lấy 4 truyện đầu tiên
				setHeroStories(allStories.slice(0, 4).map((story, idx) => ({
					...story,
					badge: idx === 0 ? 'Siêu phẩm tuần này' : 
					       idx === 1 ? 'Đang leo hạng' : 
					       idx === 2 ? 'Xu hướng' : 'Cập nhật mới',
				})));
				
				// New stories: lấy 12 truyện tiếp theo
				setNewStories(allStories.slice(4, 16));
				
				// Hot stories: Load ratings và sắp xếp theo rating để lấy top hot stories
				const loadHotStories = async () => {
					try {
						// Load ratings cho tất cả stories
						const storiesWithRatings = await Promise.all(
							allStories.map(async (story) => {
								try {
									const ratingResponse = await api.get<{ averageStars: number | null }>(
										endpoints.getRating(String(story.id))
									);
									const rating = ratingResponse.data.averageStars || 0;
									return { ...story, rating };
								} catch (err) {
									console.error(`Failed to load rating for story ${story.id}:`, err);
									return { ...story, rating: 0 };
								}
							})
						);

						// Sắp xếp theo rating (cao nhất trước), nếu rating bằng nhau thì sắp xếp theo ID (mới nhất trước)
						const sortedByRating = storiesWithRatings.sort((a, b) => {
							if (b.rating !== a.rating) {
								return b.rating - a.rating;
							}
							const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
							const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
							return bId - aId;
						});

						// Lấy top 4-8 stories (bỏ qua những stories đã dùng cho hero)
						const heroIds = new Set(allStories.slice(0, 4).map(s => String(s.id)));
						const hotStoriesFiltered = sortedByRating
							.filter(story => !heroIds.has(String(story.id)))
							.slice(0, 4);
						
						setHotStories(hotStoriesFiltered);
					} catch (err) {
						console.error('Error loading hot stories:', err);
						// Fallback: lấy 4 truyện tiếp theo (bỏ qua hero stories)
						setHotStories(allStories.slice(4, 8));
					}
				};

				loadHotStories();
			} catch (error) {
				console.error('Error loading stories:', error);
				// Fallback to empty arrays on error
				setStories([]);
				setHeroStories([]);
				setNewStories([]);
				setHotStories([]);
			} finally {
				setLoading(false);
			}
		};

		loadStories();
	}, []);

	useEffect(() => {
		if (!autoPlay || heroStories.length === 0) return;
		const interval = setInterval(() => {
			setSlide((prev) => (prev + 1) % heroStories.length);
		}, 5000);
		return () => clearInterval(interval);
	}, [autoPlay, heroStories.length]);

	// Handle payment status from VNPay callback
	useEffect(() => {
		if (paymentStatus === 'success') {
			// Sync balance when payment succeeds
			syncBalance();
			// Remove query params after 5 seconds
			setTimeout(() => {
				setSearchParams({}, { replace: true });
			}, 5000);
		} else if (paymentStatus === 'failed') {
			// Remove query params after 5 seconds
			setTimeout(() => {
				setSearchParams({}, { replace: true });
			}, 5000);
		}
	}, [paymentStatus, syncBalance, setSearchParams]);

	const heroActive = useMemo(() => heroStories[slide], [slide, heroStories]);

	const formatPrice = (price?: number) =>
		new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price ?? 39000);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
					<p className="mt-4 text-sm text-zinc-500">Đang tải truyện...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-12">
			{/* Payment Status Notification */}
			{paymentStatus && (
				<div className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-lg border px-4 py-3 shadow-lg transition-all ${
					paymentStatus === 'success'
						? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
						: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
				}`}>
					<div className="flex items-center gap-2">
						{paymentStatus === 'success' ? (
							<>
								<CheckCircle className="h-5 w-5" />
								<span className="font-semibold">Nạp tiền thành công!</span>
							</>
						) : (
							<>
								<XCircle className="h-5 w-5" />
								<span className="font-semibold">Nạp tiền thất bại</span>
							</>
						)}
					</div>
					{txnRef && (
						<p className="mt-1 text-xs opacity-75">Mã giao dịch: {txnRef}</p>
					)}
				</div>
			)}

			{heroStories.length > 0 && (
				<section className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-zinc-950 text-white shadow-xl dark:border-zinc-800/50">
					<div className="relative aspect-[16/9] w-full max-h-[360px] md:max-h-[400px]">
						{heroStories.map((story, index) => (
						<Link
							key={story.id}
							to={`/story/${story.id}`}
							className={`absolute inset-0 transition duration-[900ms] ease-out ${
								index === slide ? 'opacity-100 z-10' : 'pointer-events-none opacity-0 z-0'
							}`}
						>
							{/* Image Container with proper aspect ratio */}
							<div className="absolute inset-0 overflow-hidden">
								<img
									src={story.cover}
									alt={story.title}
									className="h-full w-full object-cover object-center"
									style={{ 
										objectFit: 'cover',
										objectPosition: 'center',
										imageRendering: 'high-quality'
									}}
									loading={index === slide ? 'eager' : 'lazy'}
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = `https://picsum.photos/seed/story-${story.id}/1200/675`;
									}}
								/>
							</div>
							{/* Gradient Overlay */}
							<div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-black/25" />
							
							{/* Content */}
							<div className="absolute inset-x-0 bottom-0 p-4 pb-6 sm:p-6 sm:pb-8">
								<div className="flex items-center gap-2 flex-wrap mb-2">
									<div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-300/30 shadow-lg">
										<Flame size={12} />
										{story.badge}
									</div>
									{story.isPremium && (
										<div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md border ${
											hasAccess(String(story.id))
												? 'bg-emerald-500/80 border-emerald-300/30'
												: 'bg-amber-500/80 border-amber-300/30'
										}`}>
											<Sparkles size={12} />
											{hasAccess(String(story.id)) ? 'Đã mua' : 'Premium'}
										</div>
									)}
								</div>
								<h2 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2">
									{story.title}
								</h2>
								{story.description && (
									<p className="mt-1.5 max-w-xl text-xs text-zinc-200 sm:text-sm line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
										{story.description}
									</p>
								)}
								{story.genres && story.genres.length > 0 && (
									<div className="mt-2.5 flex flex-wrap gap-1.5">
										{story.genres.slice(0, 3).map((genre) => (
											<span key={genre} className="rounded-full bg-white/10 backdrop-blur-sm px-2 py-0.5 text-[10px] text-zinc-200 border border-white/20">
												{genre}
											</span>
										))}
										{story.genres.length > 3 && (
											<span className="rounded-full bg-white/10 backdrop-blur-sm px-2 py-0.5 text-[10px] text-zinc-300 border border-white/20">
												+{story.genres.length - 3}
											</span>
										)}
									</div>
								)}
							</div>
						</Link>
						))}

						<button
							className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-md p-2 text-white shadow-lg transition-all hover:bg-black/60 hover:scale-110 border border-white/20"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								setAutoPlay(false);
								setSlide((prev) => (prev - 1 + heroStories.length) % heroStories.length);
							}}
							aria-label="Slide trước"
						>
							<ArrowLeft size={16} />
						</button>
						<button
							className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-md p-2 text-white shadow-lg transition-all hover:bg-black/60 hover:scale-110 border border-white/20"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								setAutoPlay(false);
								setSlide((prev) => (prev + 1) % heroStories.length);
							}}
							aria-label="Slide tiếp"
						>
							<ArrowRight size={16} />
						</button>
					</div>
					<div className="relative flex items-center justify-between border-t border-white/10 bg-black/20 backdrop-blur-sm p-3 sm:p-4">
						<div className="flex items-center gap-2 sm:gap-3 text-white min-w-0 flex-1">
							<h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-white/60 flex-shrink-0">Đang xem</h3>
							<span className="text-sm sm:text-base font-semibold truncate">{heroActive?.title || ''}</span>
						</div>
						<div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
							{heroStories.map((_, index) => (
								<button
									key={index}
									className={`h-1.5 w-8 sm:w-10 rounded-full transition-all duration-300 ${
										index === slide 
											? 'bg-white shadow-lg shadow-white/50' 
											: 'bg-white/30 hover:bg-white/50'
									}`}
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
			)}

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
						{newStories.length > 0 ? (
							newStories.map((story, index) => (
							<Link
								key={story.id}
								to={`/story/${story.id}`}
								className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-950 ${
									story.isPremium 
										? hasAccess(String(story.id))
											? 'border-emerald-400 border-2 shadow-emerald-200/20 hover:border-emerald-500 dark:border-emerald-500 dark:shadow-emerald-500/20'
											: 'border-amber-400 border-2 shadow-amber-200/20 hover:border-amber-500 dark:border-amber-500 dark:shadow-amber-500/20'
										: 'border-zinc-200 hover:border-brand/40 dark:border-zinc-800'
								}`}
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
											story.isPremium 
												? hasAccess(String(story.id))
													? 'bg-emerald-500'
													: 'bg-amber-500'
												: 'bg-brand/90'
										}`}
									>
										{story.isPremium 
											? hasAccess(String(story.id)) 
												? 'Đã mua' 
												: 'Premium'
											: index % 2 === 0 ? 'Mới' : 'Cập nhật'}
									</div>
								</div>
								<div className="space-y-2 p-3">
									<h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
										{story.title}
									</h3>
									{story.genres && (
										<p className="text-xs text-zinc-500 dark:text-zinc-400">{story.genres.join(', ')}</p>
									)}
									{story.isPremium && !hasAccess(String(story.id)) && (
										<p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
											Giá: {formatPrice(story.price)}
										</p>
									)}
									{story.isPremium && hasAccess(String(story.id)) && (
										<p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
											✓ Đã sở hữu
										</p>
									)}
								</div>
							</Link>
							))
						) : (
							<div className="col-span-full py-12 text-center text-zinc-500">
								Chưa có truyện mới
							</div>
						)}
					</div>
				</div>

				<aside className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Top truyện hot</h3>
							<button className="text-xs font-semibold text-brand hover:underline">Bảng xếp hạng</button>
						</div>
						<div className="mt-4 space-y-3">
							{hotStories.length > 0 ? (
								hotStories.map((story, index) => (
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
										{story.genres && story.genres.length > 0 && (
											<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{story.genres.join(', ')}</p>
										)}
									</div>
								</Link>
								))
							) : (
								<div className="py-8 text-center text-sm text-zinc-500">
									Chưa có truyện hot
								</div>
							)}
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


