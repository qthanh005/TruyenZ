import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChapters, getStoryById, getComments, MockComment } from '@/shared/mocks';

type Chapter = { id: string; name: string; index?: number };
type Story = { id: string; title: string; author?: string; cover?: string; description?: string; genres?: string[] };

export default function StoryDetailPage() {
	const { storyId } = useParams();
	const [story, setStory] = useState<Story | null>(null);
	const [chapters, setChapters] = useState<Chapter[]>([]);
    const [commentPage, setCommentPage] = useState(1);
    const [comments, setComments] = useState<MockComment[]>([]);
    const [totalComments, setTotalComments] = useState(0);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (!storyId) return;
        const timer = setTimeout(() => {
            const s = getStoryById(storyId) || null;
            const c = getChapters(storyId, 20);
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
		<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div className="md:col-span-2 space-y-4">
				{story ? (
					<>
						<div className="flex items-start gap-4">
							<div className="w-36 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
								{story.cover && <img src={story.cover} alt={story.title} className="w-full object-cover" />}
							</div>
							<div className="space-y-2">
								<h1 className="text-2xl font-semibold">{story.title}</h1>
								{story.author && <div className="text-sm text-zinc-500">Tác giả: {story.author}</div>}
								{story.genres && (
									<div className="flex flex-wrap gap-2">
										{story.genres.map((g) => (
											<span key={g} className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-800">
												{g}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
						{story.description && (
							<div className="prose prose-zinc max-w-none dark:prose-invert">
								<p>{story.description}</p>
							</div>
						)}
					</>
				) : (
					<div className="text-sm text-zinc-500">Đang tải...</div>
				)}
				<section>
					<h2 className="mb-2 text-lg font-semibold">Danh sách chương</h2>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{chapters.map((c) => (
							<Link key={c.id} to={`/story/${storyId}/chapter/${c.id}`} className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
								{c.index ? `Chương ${c.index}: ` : ''}{c.name}
							</Link>
						))}
					</div>
				</section>
			</div>
			<div className="space-y-4">
				<div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
					<h3 className="mb-2 font-semibold">Gợi ý</h3>
					<div className="text-sm text-zinc-500">Tính năng gợi ý sẽ hiển thị ở đây.</div>
				</div>
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="mb-3 font-semibold">Bình luận</h3>
                    <div className="mb-3 flex items-start gap-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết bình luận..."
                            className="min-h-[80px] flex-1 rounded-md border border-zinc-200 bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-zinc-800"
                        />
                        <button
                            className="h-9 rounded-md bg-brand px-3 text-sm text-white hover:opacity-90"
                            onClick={handleAddComment}
                        >
                            Gửi
                        </button>
                    </div>
                    <div className="space-y-3">
                        {comments.map((c) => (
                            <div key={c.id} className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                                <div className="mb-1 flex items-center justify-between">
                                    <div className="font-medium">{c.user}</div>
                                    <div className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{c.content}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
                            onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                            disabled={commentPage === 1}
                        >
                            Trước
                        </button>
                        {Array.from({ length: commentPages }).map((_, i) => (
                            <button
                                key={i}
                                className={`rounded-md px-3 py-1.5 text-sm ${commentPage === i + 1 ? 'bg-brand text-white' : 'border border-zinc-200 dark:border-zinc-800'}`}
                                onClick={() => setCommentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
                            onClick={() => setCommentPage((p) => Math.min(commentPages, p + 1))}
                            disabled={commentPage >= commentPages}
                        >
                            Sau
                        </button>
                    </div>
                </div>
			</div>
		</div>
	);
}


