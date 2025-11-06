import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, endpoints } from '@/services/apiClient';

type Chapter = { id: string; name: string; index?: number };
type Story = { id: string; title: string; author?: string; cover?: string; description?: string; genres?: string[] };

export default function StoryDetailPage() {
	const { storyId } = useParams();
	const [story, setStory] = useState<Story | null>(null);
	const [chapters, setChapters] = useState<Chapter[]>([]);

	useEffect(() => {
		if (!storyId) return;
		(async () => {
			try {
				const [{ data: s }, { data: c }] = await Promise.all([
					api.get(endpoints.storyDetail(storyId)),
					api.get(endpoints.chapters(storyId)),
				]);
				setStory(s);
				setChapters(c?.items || c || []);
			} catch {}
		})();
	}, [storyId]);

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
			</div>
		</div>
	);
}


