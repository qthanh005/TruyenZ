import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

type RankedStory = {
    id: string;
    title: string;
    cover?: string;
    genres?: string[];
    rating: number;
    views: number;
    rank: number;
};

export default function RankingPage() {
    // Mock data - sẽ được thay thế bằng API call
    const topStories: RankedStory[] = [
        { id: '1', title: 'Đại Chúa Tể', cover: 'https://picsum.photos/300/400?random=1', genres: ['Huyền Huyễn', 'Hành Động'], rating: 4.8, views: 1234567, rank: 1 },
        { id: '2', title: 'Thám Tử Lừng Danh Conan', cover: 'https://picsum.photos/300/400?random=2', genres: ['Trinh Thám'], rating: 4.7, views: 987654, rank: 2 },
        { id: '3', title: 'One Piece', cover: 'https://picsum.photos/300/400?random=3', genres: ['Phiêu Lưu'], rating: 4.9, views: 2345678, rank: 3 },
        { id: '4', title: 'Naruto', cover: 'https://picsum.photos/300/400?random=4', genres: ['Hành Động'], rating: 4.6, views: 876543, rank: 4 },
        { id: '5', title: 'Attack on Titan', cover: 'https://picsum.photos/300/400?random=5', genres: ['Hành Động', 'Kịch Tính'], rating: 4.9, views: 765432, rank: 5 },
        { id: '6', title: 'Solo Leveling', cover: 'https://picsum.photos/300/400?random=6', genres: ['Hành Động'], rating: 4.8, views: 654321, rank: 6 },
        { id: '7', title: 'Doraemon', cover: 'https://picsum.photos/300/400?random=7', genres: ['Hài Hước'], rating: 4.5, views: 543210, rank: 7 },
        { id: '8', title: 'Kimetsu no Yaiba', cover: 'https://picsum.photos/300/400?random=8', genres: ['Hành Động'], rating: 4.7, views: 432109, rank: 8 },
        { id: '9', title: 'Jujutsu Kaisen', cover: 'https://picsum.photos/300/400?random=9', genres: ['Siêu Nhiên'], rating: 4.6, views: 321098, rank: 9 },
        { id: '10', title: 'Spy x Family', cover: 'https://picsum.photos/300/400?random=10', genres: ['Gia Đình'], rating: 4.8, views: 210987, rank: 10 },
    ];

    const getRankBadge = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
        if (rank === 2) return 'bg-gray-300/20 text-gray-600 dark:text-gray-400';
        if (rank === 3) return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-brand" />
                <h1 className="text-3xl font-bold">Xếp hạng</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
                Top những truyện được yêu thích nhất
            </p>
            <div className="space-y-3">
                {topStories.map((story) => (
                    <Link
                        key={story.id}
                        to={`/story/${story.id}`}
                        className="group flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${getRankColor(story.rank)}`}>
                            {getRankBadge(story.rank)}
                        </div>
                        <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                            {story.cover ? (
                                <img
                                    src={story.cover}
                                    alt={story.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">No Image</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition-colors">
                                {story.title}
                            </div>
                            {story.genres && (
                                <div className="mt-1 text-sm text-zinc-500">{story.genres.join(', ')}</div>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <span>★</span>
                                    <span className="text-yellow-500">{story.rating}</span>
                                </div>
                                <div>
                                    {story.views.toLocaleString('vi-VN')} lượt xem
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

