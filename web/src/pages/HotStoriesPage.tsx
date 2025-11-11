import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

type Story = { id: string; title: string; cover?: string; genres?: string[]; rating?: number };

export default function HotStoriesPage() {
    // Mock data - sẽ được thay thế bằng API call
    const hotStories: Story[] = [
        { id: '1', title: 'Đại Chúa Tể', cover: 'https://picsum.photos/300/400?random=1', genres: ['Huyền Huyễn', 'Hành Động'], rating: 4.8 },
        { id: '2', title: 'Thám Tử Lừng Danh Conan', cover: 'https://picsum.photos/300/400?random=2', genres: ['Trinh Thám'], rating: 4.7 },
        { id: '3', title: 'One Piece', cover: 'https://picsum.photos/300/400?random=3', genres: ['Phiêu Lưu'], rating: 4.9 },
        { id: '4', title: 'Naruto', cover: 'https://picsum.photos/300/400?random=4', genres: ['Hành Động'], rating: 4.6 },
        { id: '5', title: 'Attack on Titan', cover: 'https://picsum.photos/300/400?random=5', genres: ['Hành Động', 'Kịch Tính'], rating: 4.9 },
        { id: '6', title: 'Solo Leveling', cover: 'https://picsum.photos/300/400?random=6', genres: ['Hành Động'], rating: 4.8 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-brand" />
                <h1 className="text-3xl font-bold">Truyện hot</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
                Những truyện đang được yêu thích nhất hiện tại
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {hotStories.map((story) => (
                    <Link
                        key={story.id}
                        to={`/story/${story.id}`}
                        className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            {story.cover ? (
                                <img
                                    src={story.cover}
                                    alt={story.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-400">No Image</div>
                            )}
                            <div className="pointer-events-none absolute left-3 top-3 inline-flex rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white shadow-sm">
                                Hot
                            </div>
                        </div>
                        <div className="space-y-1 p-3">
                            <div className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-brand">
                                {story.title}
                            </div>
                            {story.genres && (
                                <div className="truncate text-xs text-zinc-500">{story.genres.join(', ')}</div>
                            )}
                            {story.rating && (
                                <div className="flex items-center gap-1 text-xs text-yellow-500">
                                    <span>★</span>
                                    <span>{story.rating}</span>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

