import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flame, Layers, Lock, Sparkles, Star, Users } from 'lucide-react';

import { CheckoutModal } from '@/components/payments/CheckoutModal';
import { usePremiumStore } from '@/shared/stores/premiumStore';
import { getChapters, getStoryById, getComments, MockComment } from '@/shared/mocks';

type Chapter = { id: string; name: string; index?: number };
type Story = {
	id: string;
	title: string;
	author?: string;
	cover?: string;
	description?: string;
	genres?: string[];
	isPremium?: boolean;
	price?: number;
};

const mockStats = {
	views: '1.2M',
	followers: '230K',
	rating: 4.8,
	updatedAt: 'Cập nhật 2 giờ trước',
};

const mockRecommendations = [
	{
		id: '5',
		title: 'Solo Leveling',
		cover: 'https://picsum.photos/seed/reco-1/160/220',
		description: 'Tiến trình nâng cấp không điểm dừng.',
	},
	{
		id: '6',
		title: 'Kimetsu no Yaiba',
		cover: 'https://picsum.photos/seed/reco-2/160/220',
		description: 'Diệt quỷ cứu em gái.',
	},
];

export default function StoryDetailPage() {
	const { storyId } = useParams();
	const [story, setStory] = useState<Story | null>(null);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [commentPage, setCommentPage] = useState(1);
	const [comments, setComments] = useState<MockComment[]>([]);
	const [totalComments, setTotalComments] = useState(0);
	const [newComment, setNewComment] = useState('');
	const openCheckout = usePremiumStore((state) => state.openCheckout);
	const purchases = usePremiumStore((state) => state.purchases);
	const purchaseRecord = storyId ? purchases[storyId] : undefined;

	useEffect(() => {
		if (!storyId) return;
		const timer = setTimeout(() => {
			const s = getStoryById(storyId) || null;
			const c = getChapters(storyId, 30);
			setStory(s);
			setChapters(c);
		}, 300);
		return () => clearTimeout(timer);
	}, [storyId]);

	useEffect(() => {
		if (!storyId) return;
		const { items, total } = getComments(storyId, commentPage, 5);
		setComments(items);
		setTotalComments(total);
	}, [storyId, commentPage]);

	const commentPages = useMemo(() => Math.max(1, Math.ceil(totalComments / 5)), [totalComments]);
	const hasAccess = Boolean(storyId && purchases[storyId as string]);

	const formatPrice = (price?: number) =>
		new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price ?? 39000);

	const handlePurchaseClick = () => {
		if (!story) return;
		openCheckout({
			id: story.id,
			title: story.title,
			price: story.price ?? 39000,
		});
	};

	const canRead = !story?.isPremium || hasAccess;

	const handleAddComment = () => {
		if (!storyId || !newComment.trim()) return;
		const newItem: MockComment = {
			id: `${storyId}-c-new-${Date.now()}`,
			user: 'Bạn',
			content: newComment.trim(),
			createdAt: new Date().toISOString(),
		};
		setComments((prev) => [newItem, ...prev]);
		setNewComment('');
	};

	if (!storyId) return null;

	return (
		<div className="space-y-10">
			{story ? (
				<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 text-white shadow-lg dark:border-zinc-800">
					<div className="absolute inset-0">
						<img
							src={story.cover || 'https://picsum.photos/seed/placeholder/1200/680'}
							alt={story.title}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
						<div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
					</div>
					<div className="relative grid gap-8 p-8 md:grid-cols-[220px,1fr] md:gap-12 md:p-12">
						<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
							<img
								src={story.cover || 'https://picsum.photos/seed/placeholder/320/420'}
								alt={story.title}
								className="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
						<div className="space-y-6">
							<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
								{story.isPremium ? <Sparkles size={14} /> : <Flame size={14} />}
								{story.isPremium ? 'Premium Series' : 'Đang thịnh hành'}
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold sm:text-4xl">{story.title}</h1>
								{story.author && (
									<p className="text-sm text-zinc-200">
										Tác giả: <span className="font-medium text-white">{story.author}</span>
									</p>
								)}
								<div className="flex flex-wrap gap-2 text-xs text-zinc-100">
									{story.genres?.map((genre) => (
										<span key={genre} className="rounded-full bg-white/10 px-3 py-1">
											{genre}
										</span>
									))}
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Lượt xem</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.views}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Theo dõi</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.followers}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-300">
										<Star size={14} />
										Đánh giá
									</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.rating}/5</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Cập nhật</p>
									<p className="mt-1 text-sm font-semibold text-white">{mockStats.updatedAt}</p>
								</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
								<p className="text-sm leading-relaxed text-zinc-100">
									{story.description ||
										'Mô tả truyện chưa được cập nhật. Hiện chúng tôi đang thu thập nội dung chi tiết để mang đến trải nghiệm tốt hơn.'}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-sm">
								{story.isPremium ? (
									hasAccess ? (
										<button className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:opacity-90">
											Đọc từ chương mới nhất
										</button>
									) : (
										<>
											<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
												<Layers size={16} />
												<span>Giá: {formatPrice(story.price)}</span>
											</div>
											<button
												className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-medium text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-90"
												onClick={handlePurchaseClick}
											>
												Mua truyện premium
											</button>
										</>
									)
								) : (
									<button className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-medium text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-90">
										Đọc từ chương mới nhất
									</button>
								)}
								<button className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 font-medium text-white/90 transition hover:bg-white/10">
									Lưu vào danh sách
								</button>
								{hasAccess && story.isPremium && purchaseRecord && (
									<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200">
										<Layers size={14} />
										<span>Đã sở hữu từ {new Date(purchaseRecord.purchasedAt).toLocaleDateString('vi-VN')}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</section>
			) : (
				<div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					Đang tải dữ liệu truyện...
				</div>
			)}

			<section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Danh sách chương</h2>
								<p className="text-sm text-zinc-500">Chọn chương để tiếp tục trải nghiệm.</p>
							</div>
							<button className="text-sm font-medium text-brand hover:underline">Nhảy tới chương...</button>
						</div>
						<div className="relative mt-4">
							<div
								className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
									!canRead ? 'pointer-events-none blur-sm opacity-60' : ''
								}`}
							>
								{chapters.map((chapter) => (
									<Link
										key={chapter.id}
										to={`/story/${storyId}/chapter/${chapter.id}`}
										className="group flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:hover:border-brand/50"
									>
										<div>
											<p className="font-semibold text-zinc-800 transition group-hover:text-brand dark:text-white">
												{chapter.index ? `Chương ${chapter.index}` : 'Chương chưa đánh số'}
											</p>
											<p className="text-xs text-zinc-500 dark:text-zinc-400">{chapter.name}</p>
										</div>
										<div className="text-xs font-semibold text-brand">Đọc</div>
									</Link>
								))}
							</div>
							{!canRead && story?.isPremium && (
								<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand/60 bg-white/85 text-center shadow-inner backdrop-blur-sm dark:bg-zinc-900/90">
									<div className="flex flex-col items-center gap-2 px-6">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
											<Lock className="h-5 w-5" />
										</div>
										<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
											Nội dung premium đã được khóa
										</p>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											Mua truyện để mở khóa toàn bộ chương và nhận cập nhật mới nhanh nhất.
										</p>
										<button
											className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
											onClick={handlePurchaseClick}
										>
											Mua truyện với {formatPrice(story.price)}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Bộ sưu tập tương tự</h3>
						<p className="mt-1 text-sm text-zinc-500">Gợi ý dựa trên thể loại và mức độ thịnh hành.</p>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							{mockRecommendations.map((item) => (
								<Link
									key={item.id}
									to={`/story/${item.id}`}
									className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
								>
									<div className="aspect-[3/4] w-full overflow-hidden">
										<img
											src={item.cover}
											alt={item.title}
											className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
											loading="lazy"
										/>
									</div>
									<div className="space-y-1 p-3">
										<p className="text-sm font-semibold text-zinc-800 transition group-hover:text-brand dark:text-white">
											{item.title}
										</p>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>

				<aside className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Bình luận</h3>
							<span className="text-xs text-zinc-500">{totalComments} bình luận</span>
						</div>
						<div className="mt-4 space-y-3 text-sm">
							<textarea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Chia sẻ cảm nhận của bạn..."
								className="min-h-[100px] w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-zinc-800 dark:bg-zinc-900"
							/>
							<div className="flex justify-end">
								<button
									className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
									onClick={handleAddComment}
								>
									<Users size={14} />
									Gửi bình luận
								</button>
							</div>
						</div>
						<div className="mt-6 space-y-4">
							{comments.map((comment) => (
								<div key={comment.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
									<div className="flex items-center justify-between">
										<p className="text-sm font-semibold text-zinc-800 dark:text-white">{comment.user}</p>
										<p className="text-xs text-zinc-500">
											{new Date(comment.createdAt).toLocaleString('vi-VN')}
										</p>
									</div>
									<p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{comment.content}</p>
								</div>
							))}
						</div>
						<div className="mt-4 flex items-center justify-center gap-2">
							<button
								className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-800"
								onClick={() => setCommentPage((prev) => Math.max(1, prev - 1))}
								disabled={commentPage === 1}
							>
								Trước
							</button>
							{Array.from({ length: commentPages }).map((_, index) => (
								<button
									key={index}
									className={`rounded-md px-3 py-1.5 text-sm ${commentPage === index + 1 ? 'bg-brand text-white' : 'border border-zinc-200 dark:border-zinc-800'}`}
									onClick={() => setCommentPage(index + 1)}
								>
									{index + 1}
								</button>
							))}
							<button
								className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-800"
								onClick={() => setCommentPage((prev) => Math.min(commentPages, prev + 1))}
								disabled={commentPage >= commentPages}
							>
								Sau
							</button>
						</div>
					</div>

					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Thông tin thêm</h3>
						<div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Lịch phát hành:</span> Thứ Tư &
								Thứ Bảy hàng tuần
							</p>
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Tình trạng:</span> Đang tiến hành
							</p>
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Định dạng:</span> Manga màu, bản
								dịch tiếng Việt
							</p>
						</div>
					</div>
				</aside>
			</section>

			<CheckoutModal />
		</div>
	);
}

