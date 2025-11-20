import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, endpoints } from '@/services/apiClient';
import { ChevronLeft, ChevronRight, ArrowLeft, List, X } from 'lucide-react';

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
};

type Chapter = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
	prevChapterNumber?: number | null;
	nextChapterNumber?: number | null;
};

export default function ChapterReaderPage() {
	const { storyId, chapterId } = useParams();
	const navigate = useNavigate();
	const [chapter, setChapter] = useState<Chapter | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [allChapters, setAllChapters] = useState<ChapterResponse[]>([]);
	const [chaptersLoaded, setChaptersLoaded] = useState(false);
	const [showChapterList, setShowChapterList] = useState(false);
	const chapterListRef = useRef<HTMLDivElement>(null);

	// Load all chapters to get navigation info
	useEffect(() => {
		if (!storyId) return;

		const loadChapters = async () => {
			try {
				const response = await api.get<ChapterResponse[]>(endpoints.chapters(storyId));
				setAllChapters(response.data);
			} catch (err) {
				console.error('Error loading chapters list:', err);
			} finally {
				setChaptersLoaded(true);
			}
		};

		loadChapters();
	}, [storyId]);

	// Load chapter details
	useEffect(() => {
		if (!storyId || !chapterId) return;

		const loadChapter = async () => {
			try {
				setLoading(true);
				setError(null);

				// First, try to find chapter by chapterNumber (if chapterId is a number)
				let targetChapterId: number | null = null;
				const chapterNum = parseInt(chapterId, 10);

				if (!isNaN(chapterNum) && allChapters.length > 0) {
					// chapterId is a chapter number, find the actual chapter ID
					const foundChapter = allChapters.find((ch) => ch.chapterNumber === chapterNum);
					if (foundChapter) {
						targetChapterId = foundChapter.id;
					} else {
						setError(`Không tìm thấy chương ${chapterNum}`);
						setLoading(false);
						return;
					}
				} else {
					// chapterId is already a database ID
					targetChapterId = parseInt(chapterId, 10);
					if (isNaN(targetChapterId)) {
						setError('ID chương không hợp lệ');
						setLoading(false);
						return;
					}
				}

				// Load chapter details
				const response = await api.get<ChapterResponse>(endpoints.chapterById(targetChapterId.toString()));
				const chapterData = response.data;

				// Find prev/next chapter numbers
				const currentIndex = allChapters.findIndex((ch) => ch.id === chapterData.id);
				const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
				const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

				const mappedChapter: Chapter = {
					id: chapterData.id,
					storyId: chapterData.storyId,
					chapterNumber: chapterData.chapterNumber,
					title: chapterData.title,
					imageIds: chapterData.imageIds || [],
					prevChapterNumber: prevChapter?.chapterNumber || null,
					nextChapterNumber: nextChapter?.chapterNumber || null,
				};

				setChapter(mappedChapter);
			} catch (err: any) {
				console.error('Error loading chapter:', err);
				const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chương. Vui lòng thử lại sau.';
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		// Load chapter - if chapterId is a number, wait for chapters list; otherwise load directly
		const chapterNum = parseInt(chapterId, 10);
		if (!isNaN(chapterNum)) {
			// chapterId is a chapter number, need chapters list to find the ID
			if (chaptersLoaded) {
				loadChapter();
			}
		} else {
			// chapterId is already a database ID, can load directly
			loadChapter();
		}
	}, [storyId, chapterId, allChapters, chaptersLoaded]);

	// Build image URLs from imageIds
	const imageUrls = useMemo(() => {
		if (!chapter?.imageIds || chapter.imageIds.length === 0) return [];

		const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
		return chapter.imageIds.map((imagePath) => {
			// imagePath is already like "/public/images/..."
			return imagePath.startsWith('/') ? `${gatewayUrl}${imagePath}` : `${gatewayUrl}/${imagePath}`;
		});
	}, [chapter?.imageIds]);

	// Close chapter list when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (chapterListRef.current && !chapterListRef.current.contains(event.target as Node)) {
				setShowChapterList(false);
			}
		};

		if (showChapterList) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showChapterList]);

	// Navigate to chapter
	const handleChapterSelect = (selectedChapterNumber: number) => {
		navigate(`/story/${storyId}/chapter/${selectedChapterNumber}`);
		setShowChapterList(false);
		// Scroll to top when changing chapter
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
					<p className="mt-4 text-sm text-zinc-500">Đang tải chương...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-2">
					<Link to={`/story/${storyId}`} className="text-sm text-brand hover:underline">← Quay lại truyện</Link>
				</div>
				<div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
					<p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
					<button
						onClick={() => navigate(`/story/${storyId}`)}
						className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
					>
						Quay lại truyện
					</button>
				</div>
			</div>
		);
	}

	if (!chapter) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-2">
					<Link to={`/story/${storyId}`} className="text-sm text-brand hover:underline">← Quay lại truyện</Link>
				</div>
				<div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					Không tìm thấy chương
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Chapter Navigation Navbar - Sticky */}
			<div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
				<div className="mx-auto max-w-7xl px-4 py-3">
					<div className="flex items-center justify-between gap-4">
						{/* Back to Story */}
						<Link
							to={`/story/${storyId}`}
							className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-brand dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-brand"
						>
							<ArrowLeft size={16} />
							<span className="hidden sm:inline">Quay lại</span>
						</Link>

						{/* Chapter Info & Navigation */}
						<div className="flex flex-1 items-center justify-center gap-2">
							{/* Previous Chapter */}
							{chapter.prevChapterNumber !== null && chapter.prevChapterNumber !== undefined ? (
								<Link
									to={`/story/${storyId}/chapter/${chapter.prevChapterNumber}`}
									className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand dark:hover:bg-brand/10"
									onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
								>
									<ChevronLeft size={18} />
									<span className="hidden sm:inline">Chương {chapter.prevChapterNumber}</span>
								</Link>
							) : (
								<div className="w-[100px] sm:w-[120px]" />
							)}

							{/* Current Chapter Info & Dropdown */}
							<div className="relative" ref={chapterListRef}>
								<button
									onClick={() => setShowChapterList(!showChapterList)}
									className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-900 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-brand dark:hover:bg-brand/10"
								>
									<List size={16} />
									<span>
										Chương {chapter.chapterNumber}
										{chapter.title && (
											<span className="ml-1 hidden text-xs font-normal text-zinc-500 sm:inline dark:text-zinc-400">
												: {chapter.title.length > 30 ? chapter.title.substring(0, 30) + '...' : chapter.title}
											</span>
										)}
									</span>
								</button>

								{/* Chapter List Dropdown */}
								{showChapterList && (
									<div className="absolute left-1/2 top-full z-50 mt-2 max-h-[60vh] w-[280px] -translate-x-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
										<div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
											<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Danh sách chương</h3>
											<button
												onClick={() => setShowChapterList(false)}
												className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
											>
												<X size={16} />
											</button>
										</div>
										<div className="max-h-[50vh] overflow-y-auto">
											{allChapters.length > 0 ? (
												allChapters.map((ch) => (
													<button
														key={ch.id}
														onClick={() => handleChapterSelect(ch.chapterNumber)}
														className={`w-full px-4 py-2.5 text-left text-sm transition ${
															ch.chapterNumber === chapter.chapterNumber
																? 'bg-brand/10 font-semibold text-brand dark:bg-brand/20'
																: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
														}`}
													>
														<div className="flex items-center justify-between">
															<span>Chương {ch.chapterNumber}</span>
															{ch.chapterNumber === chapter.chapterNumber && (
																<span className="text-xs text-brand">●</span>
															)}
														</div>
														{ch.title && (
															<p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
																{ch.title}
															</p>
														)}
													</button>
												))
											) : (
												<div className="px-4 py-8 text-center text-sm text-zinc-500">Chưa có chương nào</div>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Next Chapter */}
							{chapter.nextChapterNumber !== null && chapter.nextChapterNumber !== undefined ? (
								<Link
									to={`/story/${storyId}/chapter/${chapter.nextChapterNumber}`}
									className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand dark:hover:bg-brand/10"
									onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
								>
									<span className="hidden sm:inline">Chương {chapter.nextChapterNumber}</span>
									<ChevronRight size={18} />
								</Link>
							) : (
								<div className="w-[100px] sm:w-[120px]" />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Chapter Content */}
			<div className="mx-auto max-w-3xl space-y-4">
				{imageUrls.length > 0 ? (
					imageUrls.map((imageUrl, index) => (
						<div key={index} className="overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
							<img
								src={imageUrl}
								alt={`Trang ${index + 1}`}
								className="w-full"
								loading={index < 3 ? 'eager' : 'lazy'}
								onError={(e) => {
									console.error(`Failed to load image: ${imageUrl}`);
									(e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x1200?text=Không+tải+được+ảnh';
								}}
							/>
						</div>
					))
				) : (
					<div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						Chưa có ảnh cho chương này
					</div>
				)}
			</div>

			{/* Bottom Navigation (for mobile) */}
			<div className="sticky bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden">
				<div className="mx-auto max-w-3xl px-4 py-3">
					<div className="flex items-center justify-between gap-2">
						{chapter.prevChapterNumber !== null && chapter.prevChapterNumber !== undefined ? (
							<Link
								to={`/story/${storyId}/chapter/${chapter.prevChapterNumber}`}
								className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand dark:hover:bg-brand/10"
								onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
							>
								<ChevronLeft size={18} />
								<span>Trước</span>
							</Link>
						) : (
							<div className="flex-1" />
						)}
						{chapter.nextChapterNumber !== null && chapter.nextChapterNumber !== undefined ? (
							<Link
								to={`/story/${storyId}/chapter/${chapter.nextChapterNumber}`}
								className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand dark:hover:bg-brand/10"
								onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
							>
								<span>Sau</span>
								<ChevronRight size={18} />
							</Link>
						) : (
							<div className="flex-1" />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}


