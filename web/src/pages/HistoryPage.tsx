import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Bookmark, BookmarkCheck, Clock, History, TrendingUp } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { api, endpoints } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

type HistoryItem = {
	storyId: string;
	storyTitle: string;
	cover?: string;
	chapterId: string;
	chapterNumber?: number;
	chapterTitle: string;
	lastRead: string;
	progress?: number;
	isTrending?: boolean;
	updatedAt?: string;
	isBookmarked?: boolean;
};

type HistoryResponse = {
	id: number;
	storyId: number;
	chapterId: number;
	lastReadAt: string;
};

type StoryResponse = {
	id: number;
	title: string;
	coverImageId?: string;
	description?: string;
	genres?: string[];
	author: string;
	price: number;
	paid: boolean;
};

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title?: string;
};

export default function HistoryPage() {
	const { isAuthenticated } = useAuth();
	const { showToast } = useToast();
	const { confirm } = useConfirm();
	const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
	const [loadingBookmarks, setLoadingBookmarks] = useState<Set<string>>(new Set());

	// Format time ago
	const formatTimeAgo = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Vừa xong';
		if (diffMins < 60) return `${diffMins} phút trước`;
		if (diffHours < 24) return `${diffHours} giờ trước`;
		if (diffDays < 7) return `${diffDays} ngày trước`;

		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	};

	// Format time for display
	const formatTime = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffDays === 0) {
			const hours = date.getHours();
			const minutes = date.getMinutes();
			return `Hôm nay • ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		} else if (diffDays === 1) {
			const hours = date.getHours();
			const minutes = date.getMinutes();
			return `Hôm qua • ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		} else if (diffDays < 7) {
			return `${diffDays} ngày trước`;
		} else {
			const day = date.getDate();
			const month = date.getMonth() + 1;
			return `${day}/${month}`;
		}
	};

	// Load history from API
	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		const loadHistory = async () => {
			try {
				setLoading(true);
				const response = await api.get<{ history: HistoryResponse[] }>(endpoints.history());
				const histories = response.data.history;

				// Fetch story and chapter details for each history item
				const items = await Promise.all(
					histories.map(async (history) => {
						try {
							// Fetch story details
							const storyResponse = await api.get<StoryResponse>(endpoints.storyDetail(String(history.storyId)));
							const story = storyResponse.data;

							// Fetch chapter details
							const chapterResponse = await api.get<ChapterResponse>(endpoints.chapterById(String(history.chapterId)));
							const chapter = chapterResponse.data;

							// Get cover URL
							const gatewayUrl = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081';
							const coverUrl = story.coverImageId
								? `${gatewayUrl}${story.coverImageId}`
								: `https://picsum.photos/seed/story-${story.id}/300/400`;

							// Calculate progress (simplified - can be improved with total chapters)
							const progress = Math.min(100, Math.max(0, (chapter.chapterNumber / 100) * 100));

							const item: HistoryItem = {
								storyId: String(history.storyId),
								storyTitle: story.title,
								cover: coverUrl,
								chapterId: String(history.chapterId),
								chapterNumber: chapter.chapterNumber,
								chapterTitle: chapter.title || `Chương ${chapter.chapterNumber}`,
								lastRead: formatTime(history.lastReadAt),
								progress: progress,
								updatedAt: formatTimeAgo(history.lastReadAt),
							};

							return item;
						} catch (error) {
							console.error(`Error loading details for story ${history.storyId}:`, error);
							// Return a basic item if fetch fails
							return {
								storyId: String(history.storyId),
								storyTitle: `Truyện ${history.storyId}`,
								chapterId: String(history.chapterId),
								chapterNumber: undefined,
								chapterTitle: `Chương ${history.chapterId}`,
								lastRead: formatTime(history.lastReadAt),
								updatedAt: formatTimeAgo(history.lastReadAt),
							} as HistoryItem;
						}
					})
				);

				setHistoryItems(items);

				// Check bookmark status for all items
				const checks = items.map(async (item) => {
					try {
						const response = await api.get(endpoints.checkBookmark(item.storyId, item.chapterId));
						if (response.data.bookmarked) {
							setBookmarkedItems((prev) => new Set(prev).add(`${item.storyId}-${item.chapterId}`));
						}
					} catch (error) {
						console.error('Error checking bookmark:', error);
					}
				});
				await Promise.all(checks);
			} catch (error: any) {
				console.error('Error loading history:', error);
				if (error.response?.status !== 401) {
					showToast('Không thể tải lịch sử đọc', 'error');
				}
				setHistoryItems([]);
			} finally {
				setLoading(false);
			}
		};

		loadHistory();
	}, [isAuthenticated, showToast]);

	const handleDeleteAllHistory = async () => {
		if (!isAuthenticated) {
			showToast('Vui lòng đăng nhập', 'error');
			return;
		}

		const confirmed = await confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc?', 'warning', 'Xóa lịch sử đọc');
		if (!confirmed) {
			return;
		}

		try {
			await api.delete(endpoints.deleteAllHistory());
			setHistoryItems([]);
			showToast('Đã xóa toàn bộ lịch sử đọc', 'success');
		} catch (error: any) {
			console.error('Error deleting history:', error);
			showToast(error.response?.data?.error || 'Có lỗi xảy ra', 'error');
		}
	};

	const handleBookmarkToggle = async (e: React.MouseEvent, item: HistoryItem) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isAuthenticated) {
			showToast('Vui lòng đăng nhập để sử dụng bookmark', 'error');
			return;
		}

		const itemKey = `${item.storyId}-${item.chapterId}`;
		const isBookmarked = bookmarkedItems.has(itemKey);

		setLoadingBookmarks((prev) => new Set(prev).add(itemKey));

		try {
			if (isBookmarked) {
				// Remove bookmark
				await api.delete(endpoints.removeBookmark(), {
					data: { storyId: Number(item.storyId), chapterId: Number(item.chapterId) },
				});
				setBookmarkedItems((prev) => {
					const newSet = new Set(prev);
					newSet.delete(itemKey);
					return newSet;
				});
				showToast('Đã xóa bookmark', 'success');
			} else {
				// Add bookmark
				await api.post(endpoints.addBookmark(), {
					storyId: Number(item.storyId),
					chapterId: Number(item.chapterId),
				});
				setBookmarkedItems((prev) => new Set(prev).add(itemKey));
				showToast('Đã thêm bookmark', 'success');
			}
		} catch (error: any) {
			console.error('Error toggling bookmark:', error);
			showToast(error.response?.data?.error || 'Có lỗi xảy ra', 'error');
		} finally {
			setLoadingBookmarks((prev) => {
				const newSet = new Set(prev);
				newSet.delete(itemKey);
				return newSet;
			});
		}
	};

	const stats = useMemo(
		() => [
			{
				label: 'Truyện đang đọc',
				value: historyItems.length,
				icon: BookOpen,
				theme: 'from-emerald-500 via-teal-500 to-sky-500',
				subtext: 'Tiếp tục hành trình đang dang dở.',
			},
			{
				label: 'Tổng chương đã đọc',
				value: historyItems.length,
				icon: History,
				theme: 'from-violet-500 via-purple-500 to-indigo-500',
				subtext: 'Ghi nhớ xuyên suốt giữa các thiết bị.',
			},
			{
				label: 'Bookmark',
				value: bookmarkedItems.size,
				icon: Clock,
				theme: 'from-amber-500 via-orange-500 to-red-500',
				subtext: 'Các chương đã đánh dấu.',
			},
		],
		[historyItems.length, bookmarkedItems.size]
	);

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
					<History size={28} />
				</div>
				<h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">Đăng nhập để xem lịch sử</h2>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Chúng tôi sẽ đồng bộ lịch sử đọc truyện trên mọi thiết bị khi bạn đăng nhập.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-b from-brand/40 to-brand/10 blur-3xl" />
				<div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-50 backdrop-blur">
							<History size={16} />
							Lịch sử đọc
						</div>
						<h1 className="mt-4 text-3xl font-semibold md:text-4xl">Tiếp tục hành trình đọc truyện của bạn</h1>
						<p className="mt-3 max-w-2xl text-sm text-zinc-200">
							Chúng tôi lưu lại mọi chương truyện bạn đã đọc để bạn có thể quay lại bất kỳ lúc nào, trên mọi thiết bị.
						</p>
					</div>
					<button
						onClick={handleDeleteAllHistory}
						disabled={loading || historyItems.length === 0}
						className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Xoá lịch sử
					</button>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{stats.map(({ label, value, icon: Icon, theme, subtext }) => (
					<div
						key={label}
						className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className={`absolute inset-0 bg-gradient-to-br ${theme} opacity-10`} />
						<div className="relative flex items-start gap-4">
							<div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-inset ring-zinc-100 dark:bg-zinc-900 dark:text-brand">
								<Icon size={22} />
							</div>
							<div>
								<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
								<p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
								<p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{subtext}</p>
							</div>
						</div>
					</div>
				))}
			</section>

			<section className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Nhật ký đọc gần đây</h2>
						<p className="mt-1 text-sm text-zinc-500">Sắp xếp theo thời gian, cập nhật liên tục.</p>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
					</div>
				) : historyItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="grid h-16 w-16 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
							<History size={28} />
						</div>
						<h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">Chưa có lịch sử đọc</h3>
						<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
							Bắt đầu đọc truyện để xem lịch sử đọc của bạn ở đây.
						</p>
					</div>
				) : (
					<div className="space-y-4">
					{historyItems.map((item) => {
						const itemKey = `${item.storyId}-${item.chapterId}`;
						const isBookmarked = bookmarkedItems.has(itemKey);
						const isLoading = loadingBookmarks.has(itemKey);

						return (
							<Link
								key={itemKey}
								to={`/story/${item.storyId}/chapter/${item.chapterNumber ?? item.chapterId}`}
								className="group relative flex gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
							>
								<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-brand/60 opacity-0 transition group-hover:opacity-100" />
								<div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-inner">
									<img src={item.cover} alt={item.storyTitle} className="h-full w-full object-cover" loading="lazy" />
								</div>
								<div className="flex-1">
									<div className="flex flex-wrap items-start justify-between gap-2">
										<div className="flex-1">
											<h3 className="text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
												{item.storyTitle}
											</h3>
											<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.chapterTitle}</p>
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={(e) => handleBookmarkToggle(e, item)}
												disabled={isLoading}
												className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
													isBookmarked
														? 'bg-brand/10 text-brand hover:bg-brand/15'
														: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
												} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
												title={isBookmarked ? 'Xóa bookmark' : 'Thêm bookmark'}
											>
												{isLoading ? (
													<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
												) : isBookmarked ? (
													<>
														<BookmarkCheck size={14} className="fill-current" />
														<span>Đã bookmark</span>
													</>
												) : (
													<>
														<Bookmark size={14} />
														<span>Bookmark</span>
													</>
												)}
											</button>
											<div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
												<Clock size={14} />
												<span>{item.lastRead}</span>
											</div>
										</div>
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
										<div className="flex items-center gap-1">
											<span className="font-semibold text-brand">{item.progress}%</span>
											<span>đã đọc</span>
										</div>
										{item.updatedAt && <span>{item.updatedAt}</span>}
										{item.isTrending && (
											<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
												<TrendingUp size={14} />
												Đang hot
											</span>
										)}
									</div>
									<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
										<div
											className="h-full rounded-full bg-gradient-to-r from-brand via-brand/80 to-brand/60 transition-[width]"
											style={{ width: `${item.progress}%` }}
										/>
									</div>
								</div>
							</Link>
						);
					})}
					</div>
				)}
			</section>
		</div>
	);
}
