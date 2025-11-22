import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Clock, Shield, Star, User as UserIcon, Wallet, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/providers/AuthProvider';
import { useWalletStore } from '@/shared/stores/walletStore';
import { api, endpoints } from '@/services/apiClient';
import EditProfileModal from '@/components/EditProfileModal';
import UploadAvatarModal from '@/components/UploadAvatarModal';

type BookmarkItem = {
	id: number;
	storyId: number;
	chapterId: number;
	chapterNumber?: number;
	storyTitle?: string;
	chapterTitle?: string;
	cover?: string;
	createdAt?: string;
};

type HistoryItem = {
	id: number;
	storyId: number;
	chapterId: number;
	storyTitle?: string;
	chapterTitle?: string;
	cover?: string;
	lastReadAt?: string;
	progress?: number;
};

type BookmarkResponse = {
	id: number;
	storyId: number;
	chapterId: number;
	createdAt: string;
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
	author?: string;
};

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title?: string;
};

type FollowedStory = {
	id: number;
	title: string;
	coverImageId?: string;
	author?: string;
};

const gradientPalette = [
	'from-violet-500 via-fuchsia-500 to-rose-500',
	'from-emerald-500 via-teal-500 to-sky-500',
	'from-amber-500 via-orange-500 to-rose-500',
	'from-blue-500 via-indigo-500 to-violet-500',
	'from-cyan-500 via-sky-500 to-purple-500',
];

function pickGradient(key: string | undefined) {
	if (!key) return gradientPalette[0];
	const index =
		key
			.split('')
			.map((char) => char.charCodeAt(0))
			.reduce((sum, current) => sum + current, 0) % gradientPalette.length;
	return gradientPalette[index];
}

function uppercaseInitials(name: string) {
	if (!name) return '?';
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type UserProfile = {
	id?: number;
	username?: string;
	email?: string;
	avatarUrl?: string;
	bio?: string;
	role?: string;
};

export default function ProfilePage() {
	const { user, isAuthenticated } = useAuth();
	const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [followedStories, setFollowedStories] = useState<FollowedStory[]>([]);
	const [loadingFollowed, setLoadingFollowed] = useState(false);
	const [loadingBookmarks, setLoadingBookmarks] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showUploadAvatarModal, setShowUploadAvatarModal] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [avatarError, setAvatarError] = useState(false);
	const balance = useWalletStore((state) => state.balance);
	const openTopUp = useWalletStore((state) => state.open);

	// Load user profile
	useEffect(() => {
		if (!isAuthenticated) {
			setUserProfile(null);
			return;
		}

		const loadProfile = async () => {
			try {
				setLoadingProfile(true);
				const response = await api.get(endpoints.me());
				console.log('Profile data received:', response.data);
				console.log('Avatar URL from API:', response.data?.avatarUrl);
				setUserProfile(response.data);
			} catch (error) {
				console.error('Error loading profile:', error);
			} finally {
				setLoadingProfile(false);
			}
		};

		loadProfile();
	}, [isAuthenticated]);

	const handleProfileUpdate = async () => {
		// Reload profile after update
		try {
			const response = await api.get(endpoints.me());
			setUserProfile(response.data);
		} catch (error) {
			console.error('Error reloading profile:', error);
		}
	};

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

	// Load bookmarks
	useEffect(() => {
		if (!isAuthenticated) {
			setBookmarks([]);
			return;
		}

		const loadBookmarks = async () => {
			try {
				setLoadingBookmarks(true);
				const response = await api.get<{ bookmarks: BookmarkResponse[] }>(endpoints.getUserBookmarks());
				const bookmarkData = response.data.bookmarks;

				// Fetch story and chapter details for each bookmark
				const bookmarkItems = await Promise.all(
					bookmarkData.slice(0, 5).map(async (bookmark) => {
						try {
							// Fetch story details
							const storyResponse = await api.get<StoryResponse>(endpoints.storyDetail(String(bookmark.storyId)));
							const story = storyResponse.data;

							// Fetch chapter details
							const chapterResponse = await api.get<ChapterResponse>(endpoints.chapterById(String(bookmark.chapterId)));
							const chapter = chapterResponse.data;

							// Get cover URL
							const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
							const coverUrl = story.coverImageId
								? `${gatewayUrl}${story.coverImageId}`
								: `https://picsum.photos/seed/story-${story.id}/200/260`;

							return {
								id: bookmark.id,
								storyId: bookmark.storyId,
								chapterId: bookmark.chapterId,
								chapterNumber: chapter.chapterNumber,
								storyTitle: story.title,
								chapterTitle: chapter.title || `Chương ${chapter.chapterNumber}`,
								cover: coverUrl,
								createdAt: formatTimeAgo(bookmark.createdAt),
							} as BookmarkItem;
						} catch (error) {
							console.error(`Error loading bookmark details for story ${bookmark.storyId}:`, error);
							return {
								id: bookmark.id,
								storyId: bookmark.storyId,
								chapterId: bookmark.chapterId,
								chapterNumber: undefined,
								storyTitle: `Truyện ${bookmark.storyId}`,
								chapterTitle: `Chương ${bookmark.chapterId}`,
								createdAt: formatTimeAgo(bookmark.createdAt),
							} as BookmarkItem;
						}
					})
				);

				setBookmarks(bookmarkItems);
			} catch (error) {
				console.error('Error loading bookmarks:', error);
				setBookmarks([]);
			} finally {
				setLoadingBookmarks(false);
			}
		};

		loadBookmarks();
	}, [isAuthenticated]);

	// Load history
	useEffect(() => {
		if (!isAuthenticated) {
			setHistory([]);
			return;
		}

		const loadHistory = async () => {
			try {
				setLoadingHistory(true);
				const response = await api.get<{ history: HistoryResponse[] }>(endpoints.history());
				const historyData = response.data.history;

				// Fetch story and chapter details for each history item
				const historyItems = await Promise.all(
					historyData.slice(0, 5).map(async (historyItem) => {
						try {
							// Fetch story details
							const storyResponse = await api.get<StoryResponse>(endpoints.storyDetail(String(historyItem.storyId)));
							const story = storyResponse.data;

							// Fetch chapter details
							const chapterResponse = await api.get<ChapterResponse>(endpoints.chapterById(String(historyItem.chapterId)));
							const chapter = chapterResponse.data;

							// Get cover URL
							const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
							const coverUrl = story.coverImageId
								? `${gatewayUrl}${story.coverImageId}`
								: `https://picsum.photos/seed/story-${story.id}/200/260`;

							// Calculate progress (simplified)
							const progress = Math.min(100, Math.max(0, (chapter.chapterNumber / 100) * 100));

							return {
								id: historyItem.id,
								storyId: historyItem.storyId,
								chapterId: historyItem.chapterId,
								storyTitle: story.title,
								chapterTitle: chapter.title || `Chương ${chapter.chapterNumber}`,
								cover: coverUrl,
								lastReadAt: formatTimeAgo(historyItem.lastReadAt),
								progress: progress,
							} as HistoryItem;
						} catch (error) {
							console.error(`Error loading history details for story ${historyItem.storyId}:`, error);
							return {
								id: historyItem.id,
								storyId: historyItem.storyId,
								chapterId: historyItem.chapterId,
								storyTitle: `Truyện ${historyItem.storyId}`,
								chapterTitle: `Chương ${historyItem.chapterId}`,
								lastReadAt: formatTimeAgo(historyItem.lastReadAt),
							} as HistoryItem;
						}
					})
				);

				setHistory(historyItems);
			} catch (error) {
				console.error('Error loading history:', error);
				setHistory([]);
			} finally {
				setLoadingHistory(false);
			}
		};

		loadHistory();
	}, [isAuthenticated]);

	// Load followed stories
	useEffect(() => {
		if (!isAuthenticated) return;

		const loadFollowedStories = async () => {
			try {
				setLoadingFollowed(true);
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
			} catch (err) {
				console.error('Failed to load followed stories:', err);
				setFollowedStories([]);
			} finally {
				setLoadingFollowed(false);
			}
		};

		loadFollowedStories();
	}, [isAuthenticated]);

	const displayName =
		userProfile?.username ||
		user?.profile?.name ||
		user?.profile?.preferred_username ||
		user?.username ||
		user?.name ||
		'Độc giả Truyenz';
	const displayEmail = userProfile?.email || user?.profile?.email || user?.email || 'Chưa cập nhật email';
	const role = userProfile?.role || user?.profile?.role || user?.role || 'Thành viên';
	const displayBio = userProfile?.bio || '';
	
	// Convert avatar URL to full URL if it's a relative path
	const getAvatarUrl = (avatarUrl?: string): string => {
		if (!avatarUrl) {
			console.log('No avatarUrl provided');
			return '';
		}
		console.log('Original avatarUrl:', avatarUrl);
		if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
			console.log('Avatar URL is already absolute:', avatarUrl);
			return avatarUrl;
		}
		// If it's a relative path, prepend gateway URL
		const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
		const fullUrl = avatarUrl.startsWith('/') ? `${gatewayUrl}${avatarUrl}` : `${gatewayUrl}/${avatarUrl}`;
		console.log('Converted avatar URL:', fullUrl);
		return fullUrl;
	};
	
	const displayAvatar = getAvatarUrl(userProfile?.avatarUrl);
	console.log('Final displayAvatar:', displayAvatar);

	// Reset avatar error when avatar URL changes
	useEffect(() => {
		setAvatarError(false);
	}, [displayAvatar]);

	const heroGradient = useMemo(() => pickGradient(user?.id || displayName), [user?.id, displayName]);
	const initials = useMemo(() => uppercaseInitials(displayName), [displayName]);
	const joinedAt = useMemo(
		() =>
			new Date(Date.now() - 96_000_000).toLocaleDateString('vi-VN', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}),
		[]
	);

	const stats = useMemo(
		() => [
			{
				label: 'Truyện đã theo dõi',
				value: followedStories.length,
				icon: Heart,
				theme: 'bg-rose-500/10 text-rose-500',
				subtext: 'Tất cả truyện đang theo dõi',
			},
			{
				label: 'Truyện đã lưu',
				value: bookmarks.length,
				icon: Bookmark,
				theme: 'bg-emerald-500/10 text-emerald-500',
				subtext: 'Tất cả truyện đã bookmark',
			},
			{
				label: 'Chương đã đọc',
				value: history.length,
				icon: Clock,
				theme: 'bg-sky-500/10 text-sky-500',
				subtext: 'Số chương gần đây đã hoàn thành',
			},
			{
				label: 'Đánh giá',
				value: '4.8/5',
				icon: Star,
				theme: 'bg-amber-500/10 text-amber-500',
				subtext: 'Điểm trung bình đóng góp cộng đồng',
			},
			{
				label: 'Quyền hạn',
				value: role,
				icon: Shield,
				theme: 'bg-violet-500/10 text-violet-500',
				subtext: 'Vai trò hiện tại trên hệ thống',
			},
			{
				label: 'Số dư ví',
				value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(balance),
				icon: Wallet,
				theme: 'bg-rose-500/10 text-rose-500',
				subtext: 'Dùng để mua truyện premium',
			},
		],
		[followedStories.length, bookmarks.length, history.length, role, balance]
	);

	const siteHighlights = [
		{
			title: 'Trải nghiệm đọc mượt mà',
			description:
				'Hệ thống hiển thị nhanh, hỗ trợ đọc mọi lúc với chế độ tối, ghi nhớ lịch sử xuyên suốt giữa các thiết bị.',
		},
		{
			title: 'Cộng đồng sôi động',
			description:
				'Tham gia thảo luận, chia sẻ cảm nhận và góp ý cải thiện chất lượng bản dịch cùng hàng nghìn độc giả khác.',
		},
		{
			title: 'Theo dõi sát sao',
			description: 'Bookmark truyện yêu thích, nhận thông báo ngay khi chương mới được cập nhật.',
		},
	];

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className={`absolute inset-0 bg-gradient-to-r ${heroGradient} opacity-90 blur-3xl`} />
				<div className="relative grid gap-8 p-8 md:grid-cols-[auto,1fr] md:gap-12 md:p-12">
					<div className="flex flex-col items-center gap-4 md:items-start">
						<div className="relative">
							<div className="h-32 w-32 overflow-hidden rounded-full bg-white/90 shadow-lg ring-4 ring-white/50 dark:bg-zinc-900 dark:ring-zinc-800">
								{displayAvatar && !avatarError ? (
									<img
										src={displayAvatar}
										alt={displayName}
										className="h-full w-full object-cover"
										onError={(e) => {
											console.error('Avatar image load error:', displayAvatar);
											console.error('Error event:', e);
											console.error('Trying to load avatar from:', displayAvatar);
											// Try to fetch the URL to see what error we get
											fetch(displayAvatar)
												.then(response => {
													console.error('Avatar fetch response status:', response.status);
													console.error('Avatar fetch response headers:', response.headers);
												})
												.catch(err => {
													console.error('Avatar fetch error:', err);
												});
											setAvatarError(true);
										}}
										onLoad={() => {
											console.log('Avatar image loaded successfully:', displayAvatar);
										}}
									/>
								) : (
									<div className="grid h-full w-full place-items-center text-3xl font-semibold text-zinc-900 dark:text-white">
										{initials}
									</div>
								)}
							</div>
							<div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
								<UserIcon size={20} />
							</div>
						</div>
						<button
							onClick={() => setShowUploadAvatarModal(true)}
							className="rounded-full border border-white/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/10 dark:border-zinc-700 dark:text-zinc-200"
						>
							Cập nhật avatar
						</button>
					</div>

					<div className="flex flex-col justify-center gap-6">
						<div>
							<h1 className="text-3xl font-semibold text-white drop-shadow-sm">{displayName}</h1>
							<div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-100/90">
								<span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
									{role}
								</span>
								<span>{displayEmail}</span>
								<span className="hidden md:inline-block">•</span>
								<span>Tham gia từ {joinedAt}</span>
							</div>
							{displayBio && (
								<p className="mt-4 max-w-2xl text-sm text-zinc-100/80">{displayBio}</p>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button
								onClick={() => setShowEditModal(true)}
								className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
							>
								Chỉnh sửa hồ sơ
							</button>
							<button className="rounded-full border border-white/60 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10 dark:border-zinc-700 dark:text-zinc-200">
								Quản lý bảo mật
							</button>
							<button
								className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500/30"
								onClick={() => openTopUp()}
							>
								<Wallet size={16} />
								Nạp thêm tiền
							</button>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{stats.map(({ icon: Icon, label, value, theme, subtext }) => (
					<div
						key={label}
						className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
					>
						<div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${theme}`}>
							<Icon size={18} />
							<span>{label}</span>
						</div>
						<div className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">{value}</div>
						<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtext}</p>
					</div>
				))}
			</section>

			<section className="grid gap-8 lg:grid-cols-2">
				<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Truyện đang theo dõi</h2>
						{followedStories.length > 0 && (
							<button className="text-sm text-brand hover:underline">Xem tất cả</button>
						)}
					</div>
					<div className="mt-6 grid gap-4">
						{loadingFollowed ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand border-r-transparent"></div>
								<p className="mt-2">Đang tải...</p>
							</div>
						) : followedStories.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<Heart className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
								Bạn chưa theo dõi truyện nào. Hãy khám phá và nhấn nút "Theo dõi" trên trang chi tiết truyện!
							</div>
						) : (
							followedStories.map((story) => {
								const coverUrl = story.coverImageId
									? `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
									: `https://picsum.photos/seed/story-${story.id}/200/260`;
								return (
									<Link
										key={story.id}
										to={`/story/${story.id}`}
										className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:border-brand/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand/60"
									>
										<div className="h-20 w-16 overflow-hidden rounded-xl bg-zinc-200 shadow-inner">
											<img
												src={coverUrl}
												alt={story.title}
												className="h-full w-full object-cover"
												loading="lazy"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
												{story.title}
											</h3>
											{story.author && (
												<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
													Tác giả: {story.author}
												</p>
											)}
										</div>
										<div className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-500">
											<Heart size={14} className="inline fill-current" />
										</div>
									</Link>
								);
							})
						)}
					</div>
				</div>

				<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Bookmark yêu thích</h2>
						{bookmarks.length > 0 && (
							<Link to="/history" className="text-sm text-brand hover:underline">
								Xem tất cả
							</Link>
						)}
					</div>
					<div className="mt-6 grid gap-4">
						{loadingBookmarks ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand border-r-transparent"></div>
								<p className="mt-2">Đang tải...</p>
							</div>
						) : bookmarks.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<Bookmark className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
								Bạn chưa lưu truyện nào. Hãy khám phá trang chủ và tìm cho mình bộ truyện yêu thích!
							</div>
						) : (
							bookmarks.map((item) => (
								<Link
									key={item.id}
									to={`/story/${item.storyId}/chapter/${item.chapterNumber ?? item.chapterId}`}
									className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:border-brand/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand/60"
								>
									<div className="h-20 w-16 overflow-hidden rounded-xl bg-zinc-200 shadow-inner">
										<img
											src={item.cover}
											alt={item.storyTitle}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
											{item.storyTitle}
										</h3>
										<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.chapterTitle}</p>
										<p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Đã lưu {item.createdAt}</p>
									</div>
									<div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
										<Bookmark size={14} className="inline fill-current" />
								</div>
								</Link>
							))
						)}
					</div>
				</div>

				<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Lịch sử gần đây</h2>
						<Link to="/history" className="text-sm text-brand hover:underline">
							Quản lý lịch sử
						</Link>
					</div>
					<div className="mt-6 space-y-4">
						{loadingHistory ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand border-r-transparent"></div>
								<p className="mt-2">Đang tải...</p>
							</div>
						) : history.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								<Clock className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
								Chưa có lịch sử đọc. Bắt đầu chương mới và hệ thống sẽ tự động lưu lại cho bạn.
							</div>
						) : (
							history.map((item) => (
								<Link
									key={item.id}
									to={`/story/${item.storyId}/chapter/${item.chapterId}`}
									className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:border-brand/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand/60"
								>
									<div className="h-16 w-12 overflow-hidden rounded-xl bg-zinc-200 shadow-inner">
										<img
											src={item.cover}
											alt={item.storyTitle}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{item.storyTitle}</h3>
											<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
											{item.chapterTitle} • {item.progress}% đã đọc
											</p>
										<p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Đọc {item.lastReadAt}</p>
										</div>
									<div className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-brand/50 hover:text-brand dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand/60 dark:hover:text-brand">
											Đọc tiếp
									</div>
								</Link>
							))
						)}
					</div>
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-8 shadow-sm dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Vì sao chọn Truyenz?</h2>
				<div className="mt-6 grid gap-6 md:grid-cols-3">
					{siteHighlights.map((item) => (
						<div
							key={item.title}
							className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80"
						>
							<h3 className="text-base font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
							<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* Edit Profile Modal */}
			<EditProfileModal
				isOpen={showEditModal}
				onClose={() => setShowEditModal(false)}
				user={userProfile}
				onUpdate={handleProfileUpdate}
			/>

			{/* Upload Avatar Modal */}
			<UploadAvatarModal
				isOpen={showUploadAvatarModal}
				onClose={() => setShowUploadAvatarModal(false)}
				currentAvatarUrl={displayAvatar}
				onUpdate={handleProfileUpdate}
			/>
		</div>
	);
}

