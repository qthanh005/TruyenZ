import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Plus,
	Edit,
	Trash2,
	X,
	Sparkles,
	Tag,
	BookOpen,
	Search,
	Filter,
	CirclePlus,
	ArrowUpRight,
	Wand2,
	CheckCircle2,
	PencilLine,
} from 'lucide-react';

type StoryResponse = {
	id: number;
	title: string;
	description?: string;
	coverImageId?: string;
	genres?: string[];
	author?: string;
	price: number;
	paid: boolean;
};

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
};

type Comic = {
	id: number;
	title: string;
	slug: string;
	author: string;
	status: string;
	views: number;
	follows: number;
	cover_image?: string;
	last_crawled_at?: string;
	chapters?: ChapterResponse[];
	chaptersLoading?: boolean;
};

export default function AdminComics() {
	const { user } = useAuth();
	const toast = useToast();
	const confirm = useConfirm();
	const [comics, setComics] = useState<Comic[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [expandedComics, setExpandedComics] = useState<Set<number>>(new Set());
	const [editingChapter, setEditingChapter] = useState<{ comicId: number; chapterId: number; chapterNumber: number } | null>(null);
	const [editingChapterData, setEditingChapterData] = useState<ChapterResponse | null>(null);
	const [loadingChapterData, setLoadingChapterData] = useState(false);
	const [editingStory, setEditingStory] = useState<StoryResponse | null>(null);
	const [editFormData, setEditFormData] = useState<{
		title: string;
		description: string;
		genres: string[];
		author: string;
		price: number;
		paid: boolean;
	} | null>(null);
	const [availableGenres, setAvailableGenres] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const pageSize = 10;

	// Get user ID from user object
	const getUserId = (): number | null => {
		if (!user) return null;
		if (user instanceof Object && 'id' in user) {
			const id = (user as any).id;
			return typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id, 10) : null;
		}
		// Try to get from profile
		const profile = (user as any)?.profile;
		if (profile?.sub) {
			const parsed = parseInt(profile.sub, 10);
			return isNaN(parsed) ? null : parsed;
		}
		return null;
	};

	useEffect(() => {
		const loadComics = async () => {
			try {
				setLoading(true);
				const response = await api.get<StoryResponse[]>(endpoints.stories());
				
				const comicsData: Comic[] = response.data.map((story) => {
					const coverUrl = story.coverImageId
						? `${(import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
						: undefined;
					
					return {
						id: story.id,
						title: story.title,
						slug: story.title.toLowerCase().replace(/\s+/g, '-'),
						author: story.author || 'Chưa có',
						status: 'Ongoing', // Default status
						views: 0, // Not available from API yet
						follows: 0, // Not available from API yet
						cover_image: coverUrl,
						chapters: undefined,
						chaptersLoading: false,
					};
				});
				
				setComics(comicsData);
			} catch (error) {
				console.error('Error loading comics:', error);
				setComics([]);
			} finally {
				setLoading(false);
			}
		};

		loadComics();
	}, []);

	// Load available genres
	useEffect(() => {
		const loadGenres = async () => {
			try {
				const response = await api.get<string[]>(endpoints.getAllGenres());
				setAvailableGenres(response.data);
			} catch (error) {
				console.error('Error loading genres:', error);
			}
		};
		loadGenres();
	}, []);

	const loadChaptersForComic = async (comicId: number) => {
		const comic = comics.find((c) => c.id === comicId);
		if (!comic || comic.chapters !== undefined) return; // Already loaded

		setComics((prev) =>
			prev.map((c) => (c.id === comicId ? { ...c, chaptersLoading: true } : c))
		);

		try {
			const response = await api.get<ChapterResponse[]>(endpoints.chapters(String(comicId)));
			setComics((prev) =>
				prev.map((c) =>
					c.id === comicId
						? { ...c, chapters: response.data, chaptersLoading: false }
						: c
				)
			);
		} catch (error) {
			console.error(`Error loading chapters for comic ${comicId}:`, error);
			setComics((prev) =>
				prev.map((c) => (c.id === comicId ? { ...c, chapters: [], chaptersLoading: false } : c))
			);
		}
	};

	const toggleExpand = (comicId: number) => {
		const newExpanded = new Set(expandedComics);
		if (newExpanded.has(comicId)) {
			newExpanded.delete(comicId);
		} else {
			newExpanded.add(comicId);
			loadChaptersForComic(comicId);
		}
		setExpandedComics(newExpanded);
	};

	const handleDeleteChapter = async (comicId: number, chapterId: number) => {
		const confirmed = await confirm.confirm(
			'Bạn có chắc chắn muốn xóa chương này?',
			'danger',
			'Xác nhận xóa chương'
		);
		if (!confirmed) return;

		const userId = getUserId();
		if (!userId) {
			toast.error('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			await api.delete(endpoints.deleteChapter(comicId, chapterId), {
				headers: {
					'X-User-Id': userId.toString(),
				},
			});
			// Reload chapters
			setComics((prev) =>
				prev.map((c) =>
					c.id === comicId ? { ...c, chapters: undefined } : c
				)
			);
			loadChaptersForComic(comicId);
			toast.success('Xóa chương thành công!');
		} catch (error) {
			console.error('Error deleting chapter:', error);
			toast.error('Không thể xóa chương. Vui lòng thử lại.');
		}
	};

	const handleEditStory = async (comicId: number) => {
		try {
			const response = await api.get<StoryResponse>(endpoints.storyDetail(String(comicId)));
			const story = response.data;
			setEditingStory(story);
			setEditFormData({
				title: story.title || '',
				description: story.description || '',
				genres: story.genres || [],
				author: story.author || '',
				price: story.price || 0,
				paid: story.paid || false,
			});
		} catch (error) {
			console.error('Error loading story details:', error);
			toast.error('Không thể tải thông tin truyện. Vui lòng thử lại.');
		}
	};

	const handleSaveStory = async () => {
		if (!editingStory || !editFormData) return;

		const userId = getUserId();
		if (!userId) {
			toast.error('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			setSaving(true);
			const updateRequest = {
				title: editFormData.title || undefined,
				description: editFormData.description || undefined,
				genres: editFormData.genres.length > 0 ? editFormData.genres : undefined,
				coverImageId: editingStory.coverImageId || undefined,
				paid: editFormData.paid,
				price: editFormData.price,
			};

			await api.put(endpoints.updateStory(editingStory.id), updateRequest, {
				headers: {
					'X-User-Id': userId.toString(),
				},
			});

			// Reload comics to reflect changes
			const response = await api.get<StoryResponse[]>(endpoints.stories());
			const comicsData: Comic[] = response.data.map((story) => {
				const coverUrl = story.coverImageId
					? `${(import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081'}${story.coverImageId}`
					: undefined;
				
				return {
					id: story.id,
					title: story.title,
					slug: story.title.toLowerCase().replace(/\s+/g, '-'),
					author: story.author || 'Chưa có',
					status: 'Ongoing',
					views: 0,
					follows: 0,
					cover_image: coverUrl,
					chapters: comics.find((c) => c.id === story.id)?.chapters,
					chaptersLoading: false,
				};
			});
			setComics(comicsData);

			// Close modal
			setEditingStory(null);
			setEditFormData(null);
			toast.success('Cập nhật truyện thành công!');
		} catch (error: any) {
			console.error('Error updating story:', error);
			const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật truyện. Vui lòng thử lại.';
			toast.error(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const handleEditChapter = async (comicId: number, chapterId: number, chapterNumber: number) => {
		try {
			setLoadingChapterData(true);
			const response = await api.get<ChapterResponse>(endpoints.chapterById(String(chapterId)));
			console.log('[AdminComics] Loaded chapter detail:', response.data);
			const chapter = response.data;

			if (chapter) {
				setEditingChapter({
					comicId,
					chapterId,
					chapterNumber: chapter.chapterNumber || chapterNumber,
				});
				setEditingChapterData({
					...chapter,
					imageIds: chapter.imageIds || [],
				});
			} else {
				toast.error('Không tìm thấy thông tin chương');
			}
		} catch (error) {
			console.error('Error loading chapter details:', error);
			toast.error('Không thể tải thông tin chương. Vui lòng thử lại.');
		} finally {
			setLoadingChapterData(false);
		}
	};

	useEffect(() => {
		if (editingChapterData) {
			console.log('[AdminComics] Current chapter images:', editingChapterData.imageIds);
		}
	}, [editingChapterData]);

	const handleDeleteChapterImage = async (imageIndex: number, imageUrl: string) => {
		if (!editingChapter || !editingChapterData) return;

		const confirmed = await confirm.confirm(
			'Bạn có chắc chắn muốn xóa ảnh này?',
			'danger',
			'Xác nhận xóa ảnh'
		);
		if (!confirmed) return;

		try {
			// Determine filename (e.g. 005.jpg) from URL and delete by filename to match backend expectation
			const parts = imageUrl.split('/');
			const filename = parts[parts.length - 1];

			await api.delete(
				endpoints.deleteChapterImages(
					editingChapter.comicId,
					editingChapter.chapterNumber,
					undefined,
					filename
				)
			);

			// Reload chapter details to get updated image list (API reindexes filenames)
			const updatedChapterResponse = await api.get<ChapterResponse>(endpoints.chapterById(String(editingChapter.chapterId)));
			console.log('[AdminComics] Chapter detail after delete:', updatedChapterResponse.data);
			const updatedChapter = updatedChapterResponse.data;

			setEditingChapterData({
				...updatedChapter,
				imageIds: updatedChapter.imageIds || [],
			});

			// Reload chapters for the comic to get updated data
			const comic = comics.find((c) => c.id === editingChapter.comicId);
			if (comic) {
				// Clear chapters to force reload
				setComics((prev) =>
					prev.map((c) =>
						c.id === editingChapter.comicId ? { ...c, chapters: undefined } : c
					)
				);
				loadChaptersForComic(editingChapter.comicId);
			}

			toast.success('Xóa ảnh thành công!');
		} catch (error: any) {
			console.error('Error deleting chapter image:', error);
			const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa ảnh. Vui lòng thử lại.';
			toast.error(errorMessage);
		}
	};

	const handleDeleteStory = async (comicId: number, comicTitle: string) => {
		const confirmed = await confirm.confirm(
			`Bạn có chắc chắn muốn xóa truyện "${comicTitle}"?\n\nHành động này sẽ xóa tất cả các chương và không thể hoàn tác!`,
			'danger',
			'Xác nhận xóa truyện',
			'Xóa',
			'Hủy'
		);
		if (!confirmed) return;

		const userId = getUserId();
		if (!userId) {
			toast.error('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			await api.delete(endpoints.deleteStory(comicId), {
				headers: {
					'X-User-Id': userId.toString(),
				},
			});

			// Remove from local state
			setComics((prev) => prev.filter((c) => c.id !== comicId));
			
			// Remove from expanded set if it was expanded
			setExpandedComics((prev) => {
				const newSet = new Set(prev);
				newSet.delete(comicId);
				return newSet;
			});

			toast.success('Xóa truyện thành công!');
		} catch (error: any) {
			console.error('Error deleting story:', error);
			const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Không thể xóa truyện. Vui lòng thử lại.';
			toast.error(errorMessage);
		}
	};

	const filteredComics = comics.filter(
		(comic) => comic.title.toLowerCase().includes(searchQuery.toLowerCase()) || comic.slug.includes(searchQuery.toLowerCase())
	);

	const paginatedComics = filteredComics.slice((page - 1) * pageSize, page * pageSize);

	const statsSummary = useMemo(() => {
		const totalStories = comics.length;
		const visibleStories = filteredComics.length;
		const storiesWithLoadedChapters = comics.filter((comic) => comic.chapters && comic.chapters.length > 0).length;
		const loadedChapters = comics.reduce((sum, comic) => sum + (comic.chapters?.length || 0), 0);
		return {
			totalStories,
			visibleStories,
			storiesWithLoadedChapters,
			loadedChapters,
		};
	}, [comics, filteredComics]);

	const quickStats = [
		{ label: 'Tổng truyện', value: statsSummary.totalStories, helper: 'Trong toàn hệ thống' },
		{ label: 'Đang hiển thị', value: statsSummary.visibleStories, helper: 'Theo bộ lọc hiện tại' },
		{ label: 'Đã tải chương', value: statsSummary.storiesWithLoadedChapters, helper: 'Truyện đã đồng bộ chương' },
		{ label: 'Chương đã xem', value: statsSummary.loadedChapters, helper: 'Sẵn sàng quản lý' },
	];

	const heroActions = [
		{ label: 'Nhập từ crawler', description: 'Đồng bộ nguồn mới', icon: ArrowUpRight },
		{ label: 'Tạo truyện thủ công', description: 'Bắt đầu từ bản trống', icon: CirclePlus },
		{ label: 'Gợi ý mô tả', description: 'AI hỗ trợ nội dung', icon: Wand2 },
	];

	return (
		<div className="space-y-6">
			<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 p-6 text-white shadow-lg">
				<div className="absolute inset-0 opacity-40">
					<div className="absolute -left-16 top-0 h-60 w-60 rounded-full bg-brand blur-3xl" />
					<div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-purple-500 blur-3xl" />
				</div>
				<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-[0.35em] text-white/60">Content Console</p>
						<h2 className="text-3xl font-semibold">Quản lý truyện & chương</h2>
						<p className="max-w-2xl text-sm text-white/70">
							Bảng điều khiển giúp bạn theo dõi tiến độ xuất bản, xem trạng thái truyện và thao tác chương nhanh chóng.
						</p>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{quickStats.map((stat) => (
								<div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
									<p className="mt-2 text-3xl font-semibold">{stat.value}</p>
									<p className="text-xs text-white/70">{stat.helper}</p>
								</div>
							))}
						</div>
					</div>
					<div className="grid w-full max-w-md gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						{heroActions.map((action) => {
							const Icon = action.icon;
							return (
								<button key={action.label} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-white/80 transition hover:bg-white/10">
									<div>
										<p className="text-sm font-semibold text-white">{action.label}</p>
										<p className="text-xs text-white/70">{action.description}</p>
									</div>
									<Icon className="h-5 w-5" />
								</button>
							);
						})}
					</div>
				</div>
			</section>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
					<Search className="h-4 w-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Tìm kiếm theo tên, slug hoặc tác giả..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
					/>
					<button className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
						<Filter className="h-4 w-4" />
						Bộ lọc
					</button>
				</div>
				<button className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90">
					<Sparkles className="h-4 w-4" />
					Thêm truyện mới
				</button>
			</div>

			{loading ? (
				<div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 text-center text-zinc-500 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
					Đang tải danh sách truyện...
				</div>
			) : paginatedComics.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
					Không tìm thấy truyện nào phù hợp. Hãy thử từ khóa khác hoặc thêm truyện mới.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
					{paginatedComics.map((comic) => {
						const isExpanded = expandedComics.has(comic.id);
						const chapterCount = comic.chapters?.length || 0;
						return (
							<div key={comic.id} className="rounded-3xl border border-zinc-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
								<div className="flex flex-col gap-4 sm:flex-row">
									<div className="mx-auto h-32 w-24 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 shadow-inner dark:border-zinc-800 dark:bg-zinc-800 sm:mx-0">
										{comic.cover_image ? (
											<img src={comic.cover_image} alt={comic.title} className="h-full w-full object-cover" />
										) : (
											<div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">No Image</div>
										)}
									</div>
									<div className="flex-1 space-y-4">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div>
												<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
													<Tag className="h-3 w-3" />
													{comic.slug}
												</div>
												<h3 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-white">{comic.title}</h3>
												<p className="text-sm text-zinc-500">Tác giả: {comic.author}</p>
											</div>
											<div className="flex gap-2">
												<button
													onClick={() => handleEditStory(comic.id)}
													className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
												>
													<PencilLine className="h-3.5 w-3.5" />
													Sửa
												</button>
												<button
													onClick={() => handleDeleteStory(comic.id, comic.title)}
													className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
												>
													<Trash2 className="h-3.5 w-3.5" />
													Xóa
												</button>
											</div>
										</div>
										<div className="flex flex-wrap gap-3 text-xs">
											<span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
												<BookOpen className="h-3.5 w-3.5" />
												{chapterCount} chương đã tải
											</span>
											<span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
												Trạng thái: {comic.status === 'Ongoing' ? 'Đang ra' : 'Hoàn thành'}
											</span>
											<span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
												{comic.views.toLocaleString('vi-VN')} lượt xem
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-3">
											<button
												onClick={() => toggleExpand(comic.id)}
												className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
											>
												{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
												{isExpanded ? 'Thu gọn chương' : `Xem chương (${chapterCount})`}
											</button>
											<button className="inline-flex items-center gap-1 rounded-xl border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/10">
												<Plus className="h-3.5 w-3.5" />
												Thêm chương
											</button>
										</div>
									</div>
								</div>

								{isExpanded && (
									<div className="mt-5 space-y-4 rounded-2xl border border-zinc-100 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900">
										<div className="flex items-center justify-between">
											<h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
												<FileText className="h-4 w-4" />
												Danh sách chương
											</h4>
											<button className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
												<Plus className="h-3.5 w-3.5" />
												Thêm chương
											</button>
										</div>
										{comic.chaptersLoading ? (
											<div className="py-4 text-center text-sm text-zinc-500">Đang tải chương...</div>
										) : comic.chapters && comic.chapters.length > 0 ? (
											<div className="space-y-3">
												{comic.chapters.map((chapter) => (
													<div key={chapter.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
														<div>
															<p className="font-medium text-zinc-900 dark:text-white">
																Chương {chapter.chapterNumber}{chapter.title ? ` · ${chapter.title}` : ''}
															</p>
															<p className="text-xs text-zinc-500">{chapter.imageIds?.length || 0} ảnh lưu trữ</p>
														</div>
														<div className="flex gap-2">
															<button
																onClick={() => handleEditChapter(comic.id, chapter.id, chapter.chapterNumber)}
																className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
															>
																Sửa
															</button>
															<button
																onClick={() => handleDeleteChapter(comic.id, chapter.id)}
																className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
															>
																Xóa
															</button>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
												<FileText className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
												<p className="text-sm text-zinc-500">Chưa có chương nào. Bắt đầu với chương đầu tiên ngay bây giờ.</p>
												<button className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand/90">
													Thêm chương đầu tiên
												</button>
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{!loading && filteredComics.length > 0 && (
				<div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/80 p-4 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
					<div>
						Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredComics.length)} / {filteredComics.length} truyện
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
						>
							Trước
						</button>
						<button
							onClick={() => setPage((p) => Math.min(Math.ceil(filteredComics.length / pageSize), p + 1))}
							disabled={page >= Math.ceil(filteredComics.length / pageSize)}
							className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
						>
							Sau
						</button>
					</div>
				</div>
			)}

			{/* Edit Story Modal */}
			{editingStory && editFormData && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
							<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Sửa thông tin truyện</h2>
							<button
								onClick={() => {
									setEditingStory(null);
									setEditFormData(null);
								}}
								className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
							<div className="space-y-4">
								<div>
									<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										Tên truyện *
									</label>
									<input
										type="text"
										value={editFormData.title}
										onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
										className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
										required
									/>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										Tác giả
									</label>
									<input
										type="text"
										value={editFormData.author}
										disabled
										className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
									/>
									<p className="mt-1 text-xs text-zinc-500">Tác giả không thể thay đổi từ đây</p>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										Mô tả
									</label>
									<textarea
										value={editFormData.description}
										onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
										rows={4}
										className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
									/>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
										Thể loại
									</label>
									<div className="flex flex-wrap gap-2">
										{availableGenres.map((genre) => (
											<label key={genre} className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={editFormData.genres.includes(genre)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditFormData({
																...editFormData,
																genres: [...editFormData.genres, genre],
															});
														} else {
															setEditFormData({
																...editFormData,
																genres: editFormData.genres.filter((g) => g !== genre),
															});
														}
													}}
													className="rounded border-zinc-300 text-brand focus:ring-brand"
												/>
												<span className="text-sm text-zinc-700 dark:text-zinc-300">{genre}</span>
											</label>
										))}
									</div>
									{editFormData.genres.length === 0 && (
										<p className="mt-2 text-xs text-zinc-500">Chưa chọn thể loại nào</p>
									)}
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Giá (VND)
										</label>
										<input
											type="number"
											value={editFormData.price}
											onChange={(e) => setEditFormData({ ...editFormData, price: parseInt(e.target.value) || 0 })}
											min="0"
											className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
										/>
									</div>
									<div>
										<label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Loại truyện
										</label>
										<select
											value={editFormData.paid ? 'paid' : 'free'}
											onChange={(e) => setEditFormData({ ...editFormData, paid: e.target.value === 'paid' })}
											className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
										>
											<option value="free">Miễn phí</option>
											<option value="paid">Trả phí</option>
										</select>
									</div>
								</div>
							</div>
						</div>
						<div className="flex items-center justify-end gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
							<button
								onClick={() => {
									setEditingStory(null);
									setEditFormData(null);
								}}
								className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
								disabled={saving}
							>
								Hủy
							</button>
							<button
								onClick={handleSaveStory}
								disabled={saving || !editFormData.title.trim()}
								className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
							>
								{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Chapter Modal */}
			{editingChapter && editingChapterData && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-4xl max-h-[90vh] rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
							<div>
								<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
									Sửa chương {editingChapterData.chapterNumber}
								</h2>
								<p className="text-sm text-zinc-500 mt-1">{editingChapterData.title}</p>
							</div>
							<button
								onClick={() => {
									setEditingChapter(null);
									setEditingChapterData(null);
								}}
								className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Content - Image List */}
						<div className="flex-1 overflow-y-auto p-6">
							{loadingChapterData ? (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
										<p className="mt-4 text-sm text-zinc-500">Đang tải ảnh...</p>
									</div>
								</div>
							) : editingChapterData.imageIds && editingChapterData.imageIds.length > 0 ? (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Danh sách ảnh ({editingChapterData.imageIds.length} ảnh)
										</p>
									</div>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
										{editingChapterData.imageIds.map((imageUrl, index) => {
											const gatewayUrl = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081';
											const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${gatewayUrl}${imageUrl}`;
											
											return (
												<div key={index} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
												<img
													src={fullImageUrl}
													alt={`Ảnh ${index + 1}`}
													className="h-full w-full object-cover"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.onerror = null;
														target.src =
															'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="%23252525"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="18">Không tải được ảnh</text></svg>';
													}}
												/>
												<div className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-2 py-1 text-[10px] text-white">
													{imageUrl}
												</div>
													<div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
														<div className="flex gap-2">
															<button
																onClick={() => handleDeleteChapterImage(index, imageUrl)}
																className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
															>
																<Trash2 className="h-4 w-4 inline mr-1" />
																Xóa
															</button>
														</div>
													</div>
													<div className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
														{index + 1}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<FileText className="h-12 w-12 text-zinc-400 mb-4" />
									<p className="text-sm text-zinc-500">Chương này chưa có ảnh nào</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
							<button
								onClick={() => {
									setEditingChapter(null);
									setEditingChapterData(null);
								}}
								className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
							>
								Đóng
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

