import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, endpoints } from '@/services/apiClient';

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
			<div className="flex items-center justify-between gap-2">
				<Link to={`/story/${storyId}`} className="text-sm text-brand hover:underline">← Quay lại truyện</Link>
				<div className="text-sm text-zinc-500">
					Chương {chapter.chapterNumber}: {chapter.title}
				</div>
			</div>
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
			<div className="flex items-center justify-between">
				{chapter.prevChapterNumber !== null && chapter.prevChapterNumber !== undefined ? (
					<Link
						to={`/story/${storyId}/chapter/${chapter.prevChapterNumber}`}
						className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
					>
						← Chương {chapter.prevChapterNumber}
					</Link>
				) : (
					<span />
				)}
				{chapter.nextChapterNumber !== null && chapter.nextChapterNumber !== undefined ? (
					<Link
						to={`/story/${storyId}/chapter/${chapter.nextChapterNumber}`}
						className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
					>
						Chương {chapter.nextChapterNumber} →
					</Link>
				) : (
					<span />
				)}
			</div>
		</div>
	);
}


