import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapterContent } from '@/shared/mocks';

type ContentBlock = { type: 'text' | 'image'; value: string };
type Chapter = { id: string; name: string; index?: number; prevId?: string | null; nextId?: string | null; content?: ContentBlock[] };

export default function ChapterReaderPage() {
	const { storyId, chapterId } = useParams();
	const [chapter, setChapter] = useState<Chapter | null>(null);
	const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storyId || !chapterId) return;
        setLoading(true);
        const timer = setTimeout(() => {
            const data = getChapterContent(storyId, chapterId);
            setChapter(data);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [storyId, chapterId]);

	const content = useMemo(() => chapter?.content || [], [chapter]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<Link to={`/story/${storyId}`} className="text-sm text-brand hover:underline">← Quay lại truyện</Link>
				<div className="text-sm text-zinc-500">{chapter?.name}</div>
			</div>
			<div className="mx-auto max-w-3xl space-y-4">
				{loading && <div className="text-sm text-zinc-500">Đang tải chương...</div>}
				{!loading && content.map((b, i) => (
					b.type === 'image' ? (
						<div key={i} className="overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
							<img src={b.value} alt="page" className="w-full" />
						</div>
					) : (
						<p key={i} className="text-lg leading-8">{b.value}</p>
					)
				))}
			</div>
			<div className="flex items-center justify-between">
				{chapter?.prevId ? (
					<Link to={`/story/${storyId}/chapter/${chapter.prevId}`} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">← Chương trước</Link>
				) : <span />}
				{chapter?.nextId ? (
					<Link to={`/story/${storyId}/chapter/${chapter.nextId}`} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">Chương sau →</Link>
				) : <span />}
			</div>
		</div>
	);
}


