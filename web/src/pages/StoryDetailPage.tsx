import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flame, Layers, Lock, Sparkles, Star, Users, Trash2 } from 'lucide-react';

import { CheckoutModal } from '@/components/payments/CheckoutModal';
import { usePremiumStore } from '@/shared/stores/premiumStore';
import { api, endpoints } from '@/services/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import type { CommentResponse, CommentRequest, CommentWithUser } from '@/types/comment';
import type { UserInfo } from '@/types/user';

type Chapter = { id: string | number; name: string; index?: number; chapterNumber?: number };
type Story = {
	id: string | number;
	title: string;
	author?: string;
	cover?: string;
	description?: string;
	genres?: string[];
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

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [commentPage, setCommentPage] = useState(1);
	const [comments, setComments] = useState<CommentWithUser[]>([]);
	const [totalComments, setTotalComments] = useState(0);
	const [newComment, setNewComment] = useState('');
	const [commentLoading, setCommentLoading] = useState(false);
	const [commentError, setCommentError] = useState<string | null>(null);
	const [submittingComment, setSubmittingComment] = useState(false);
	const [userInfoCache, setUserInfoCache] = useState<Map<number, UserInfo>>(new Map());
	const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
	const openCheckout = usePremiumStore((state) => state.openCheckout);
	const purchases = usePremiumStore((state) => state.purchases);
	const purchaseRecord = storyId ? purchases[storyId as string] : undefined;
	const { user, isAuthenticated } = useAuth();

	// Load story details from API
	useEffect(() => {
		if (!storyId) return;

		const loadStory = async () => {
			try {
				setLoading(true);
				setError(null);

				// Load story details
				const storyResponse = await api.get<StoryResponse>(endpoints.storyDetail(storyId));
				const storyData = storyResponse.data;

				// Map story response to Story type
				const coverUrl = storyData.coverImageId
					? `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${storyData.coverImageId}`
					: `https://picsum.photos/seed/story-${storyData.id}/1200/680`;

				const mappedStory: Story = {
					id: storyData.id,
					title: storyData.title,
					author: storyData.author,
					cover: coverUrl,
					description: storyData.description,
					genres: storyData.genres || [],
					isPremium: storyData.paid,
					price: storyData.price > 0 ? storyData.price : undefined,
				};

				setStory(mappedStory);

				// Load chapters
				const chaptersResponse = await api.get<ChapterResponse[]>(endpoints.chapters(storyId));
				const chaptersData = chaptersResponse.data;

				// Map chapters response to Chapter type
				const mappedChapters: Chapter[] = chaptersData.map((ch) => ({
					id: ch.id,
					name: ch.title,
					index: ch.chapterNumber,
					chapterNumber: ch.chapterNumber,
				}));

				// Sort by chapter number
				mappedChapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

				setChapters(mappedChapters);
			} catch (err) {
				console.error('Error loading story:', err);
				setError('Không thể tải thông tin truyện. Vui lòng thử lại sau.');
			} finally {
				setLoading(false);
			}
		};

		loadStory();
	}, [storyId]);

	// Load comments from API
	useEffect(() => {
		if (!storyId) return;

		const loadComments = async () => {
			try {
				setCommentLoading(true);
				setCommentError(null);

				// Get root comments by story ID (comments without chapterId or parentId)
				const response = await api.get<CommentResponse[]>(endpoints.getRootCommentsByStory(storyId));
				
				// Handle ResponseEntity wrapper if present
				const commentsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];

				// Filter out deleted/blocked comments
				const activeComments = commentsData.filter((comment: CommentResponse) => {
					// Note: The API might return isDeleted field, but CommentResponse doesn't include it
					// We'll assume all returned comments are active
					return true;
				});

				// Simple pagination (client-side for now)
				const pageSize = 5;
				const start = (commentPage - 1) * pageSize;
				const end = start + pageSize;
				const paginatedComments = activeComments.slice(start, end);

				// Load user info for each comment
				const currentCache = userInfoCache;
				const commentsWithUser: CommentWithUser[] = await Promise.all(
					paginatedComments.map(async (comment: CommentResponse) => {
						// Check cache first
						if (currentCache.has(comment.userId)) {
							const cachedUser = currentCache.get(comment.userId)!;
							return {
								...comment,
								user: {
									username: cachedUser.username,
									avatarUrl: cachedUser.avatarUrl,
								},
							};
						}

						// Load user info
						try {
							const userResponse = await api.get<UserInfo>(endpoints.getUserById(comment.userId));
							const userData = userResponse.data;
							
							// Update cache
							setUserInfoCache((prev) => {
								const newCache = new Map(prev);
								newCache.set(comment.userId, userData);
								return newCache;
							});
							
							return {
								...comment,
								user: {
									username: userData.username,
									avatarUrl: userData.avatarUrl,
								},
							};
						} catch (err) {
							console.error(`Failed to load user info for userId ${comment.userId}:`, err);
							return {
								...comment,
								user: {
									username: `User ${comment.userId}`,
									avatarUrl: null,
								},
							};
						}
					})
				);

				setComments(commentsWithUser);
				setTotalComments(activeComments.length);
			} catch (err: any) {
				console.error('Error loading comments:', err);
				console.error('Error details:', {
					message: err.message,
					code: err.code,
					response: err.response,
					request: err.config?.url,
				});
				
				let errorMessage = 'Không thể tải bình luận. Vui lòng thử lại sau.';
				
				if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
					errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n- API Gateway có đang chạy không (port 8081)\n- Comment Service có đang chạy không (port 8883)\n- Kiểm tra Console để xem chi tiết lỗi';
				} else if (err.response) {
					errorMessage = err.response.data?.message 
						|| err.response.data?.error 
						|| `Lỗi ${err.response.status}: ${err.response.statusText}`;
				} else if (err.message) {
					errorMessage = err.message;
				}
				
				setCommentError(errorMessage);
				setComments([]);
				setTotalComments(0);
			} finally {
				setCommentLoading(false);
			}
		};

		loadComments();
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

	// Get current user ID
	const getCurrentUserId = (): number | null => {
		if (!user || !isAuthenticated) return null;
		
		if ('id' in user) {
			// Email user
			const userId = parseInt(user.id, 10);
			return isNaN(userId) ? null : userId;
		} else if (user.profile?.sub) {
			// OAuth user
			const userId = parseInt(user.profile.sub, 10);
			return isNaN(userId) ? null : userId;
		}
		return null;
	};

	// Check if comment can be deleted (within 5 minutes and is user's comment)
	const canDeleteComment = (comment: CommentWithUser): boolean => {
		const currentUserId = getCurrentUserId();
		if (!currentUserId || comment.userId !== currentUserId) return false;
		
		const commentDate = new Date(comment.createdAt);
		const now = new Date();
		const diffMinutes = (now.getTime() - commentDate.getTime()) / (1000 * 60);
		
		return diffMinutes <= 5;
	};

	// Handle delete comment
	const handleDeleteComment = async (commentId: number) => {
		if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
			return;
		}

		const currentUserId = getCurrentUserId();
		if (!currentUserId) {
			alert('Bạn cần đăng nhập để xóa bình luận');
			return;
		}

		try {
			setDeletingCommentId(commentId);
			await api.put(endpoints.deleteComment(commentId.toString()), {
				userId: currentUserId
			});
			
			// Remove comment from list
			setComments((prev) => prev.filter((c) => c.id !== commentId));
			setTotalComments((prev) => Math.max(0, prev - 1));
		} catch (err: any) {
			console.error('Error deleting comment:', err);
			// Backend trả về error trong response.data.error
			const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Không thể xóa bình luận. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setDeletingCommentId(null);
		}
	};

	const handleAddComment = async () => {
		if (!storyId || !newComment.trim() || !isAuthenticated || !user) {
			if (!isAuthenticated) {
				alert('Vui lòng đăng nhập để bình luận');
			}
			return;
		}

		// Get userId from user object
		let userId: number;
		if ('id' in user) {
			// Email user
			userId = parseInt(user.id, 10);
		} else if (user.profile?.sub) {
			// OAuth user
			userId = parseInt(user.profile.sub, 10);
		} else {
			console.error('Cannot get userId from user object');
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		if (isNaN(userId)) {
			console.error('Invalid userId:', user);
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			setSubmittingComment(true);

			const commentRequest: CommentRequest = {
				storyId: parseInt(storyId, 10),
				chapterId: null, // Root comment for story
				userId: userId,
				parentId: null, // Root comment
				content: newComment.trim(),
			};

			const response = await api.post<CommentResponse>(endpoints.createComment(), commentRequest);
			const newCommentData = response.data;

			// Load user info for new comment
			try {
				const userResponse = await api.get<UserInfo>(endpoints.getUserById(newCommentData.userId));
				const userData = userResponse.data;
				
				// Update cache
				setUserInfoCache((prev) => new Map(prev).set(newCommentData.userId, userData));
				
				// Add new comment to the list with user info
				const commentWithUser: CommentWithUser = {
					...newCommentData,
					user: {
						username: userData.username,
						avatarUrl: userData.avatarUrl,
					},
				};
				setComments((prev) => [commentWithUser, ...prev]);
			} catch (err) {
				console.error('Failed to load user info for new comment:', err);
				// Add comment without user info
				const commentWithUser: CommentWithUser = {
					...newCommentData,
					user: {
						username: `User ${newCommentData.userId}`,
						avatarUrl: null,
					},
				};
				setComments((prev) => [commentWithUser, ...prev]);
			}
			setTotalComments((prev) => prev + 1);
			setNewComment('');
		} catch (err: any) {
			console.error('Error creating comment:', err);
			const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setSubmittingComment(false);
		}
	};

	if (!storyId) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
					<p className="mt-4 text-sm text-zinc-500">Đang tải thông tin truyện...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
				<p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
				>
					Thử lại
				</button>
			</div>
		);
	}

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
								{chapters.length > 0 ? (
									chapters.map((chapter) => (
										<Link
											key={chapter.id}
											to={`/story/${storyId}/chapter/${chapter.chapterNumber || chapter.id}`}
											className="group flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:hover:border-brand/50"
										>
											<div>
												<p className="font-semibold text-zinc-800 transition group-hover:text-brand dark:text-white">
													{chapter.chapterNumber ? `Chương ${chapter.chapterNumber}` : chapter.index ? `Chương ${chapter.index}` : 'Chương chưa đánh số'}
												</p>
												<p className="text-xs text-zinc-500 dark:text-zinc-400">{chapter.name}</p>
											</div>
											<div className="text-xs font-semibold text-brand">Đọc</div>
										</Link>
									))
								) : (
									<div className="col-span-full py-8 text-center text-sm text-zinc-500">
										Chưa có chương nào
									</div>
								)}
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
									className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
									onClick={handleAddComment}
									disabled={submittingComment || !isAuthenticated}
								>
									{submittingComment ? (
										<>
											<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
											Đang gửi...
										</>
									) : (
										<>
											<Users size={14} />
											Gửi bình luận
										</>
									)}
								</button>
							</div>
						</div>
						{commentError && (
							<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
								{commentError}
							</div>
						)}
						<div className="mt-6 space-y-4">
							{commentLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-center">
										<div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
										<p className="mt-2 text-xs text-zinc-500">Đang tải bình luận...</p>
									</div>
								</div>
							) : comments.length === 0 ? (
								<div className="py-8 text-center text-sm text-zinc-500">
									Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
								</div>
							) : (
								comments.map((comment) => {
									const canDelete = canDeleteComment(comment);
									const isDeleting = deletingCommentId === comment.id;
									
									return (
										<div key={comment.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-3 flex-1">
													{comment.user?.avatarUrl ? (
														<img
															src={comment.user.avatarUrl}
															alt={comment.user.username}
															className="h-10 w-10 rounded-full object-cover"
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-sm">
															{comment.user?.username?.charAt(0).toUpperCase() || 'U'}
														</div>
													)}
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<p className="text-sm font-semibold text-zinc-800 dark:text-white">
																{comment.user?.username || `User ${comment.userId}`}
															</p>
															{canDelete && (
																<button
																	onClick={() => handleDeleteComment(comment.id)}
																	disabled={isDeleting}
																	className="ml-auto text-xs text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
																	title="Xóa bình luận (chỉ trong 5 phút đầu)"
																>
																	{isDeleting ? (
																		<div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
																	) : (
																		<Trash2 size={14} />
																	)}
																	<span>Xóa</span>
																</button>
															)}
														</div>
														<p className="text-xs text-zinc-500">
															{new Date(comment.createdAt).toLocaleString('vi-VN')}
														</p>
													</div>
												</div>
											</div>
											<p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
												{comment.content}
											</p>
										</div>
									);
								})
							)}
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

