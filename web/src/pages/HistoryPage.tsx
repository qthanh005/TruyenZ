import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

type HistoryItem = {
    storyId: string;
    storyTitle: string;
    cover?: string;
    chapterId: string;
    chapterTitle: string;
    lastRead: string;
};

export default function HistoryPage() {
    const { isAuthenticated } = useAuth();

    // Mock data - sẽ được thay thế bằng API call
    const historyItems: HistoryItem[] = [
        {
            storyId: '1',
            storyTitle: 'Đại Chúa Tể',
            cover: 'https://picsum.photos/300/400?random=1',
            chapterId: '101',
            chapterTitle: 'Chương 101: Khởi đầu mới',
            lastRead: '2 giờ trước',
        },
        {
            storyId: '2',
            storyTitle: 'Thám Tử Lừng Danh Conan',
            cover: 'https://picsum.photos/300/400?random=2',
            chapterId: '45',
            chapterTitle: 'Chương 45: Vụ án bí ẩn',
            lastRead: '1 ngày trước',
        },
        {
            storyId: '3',
            storyTitle: 'One Piece',
            cover: 'https://picsum.photos/300/400?random=3',
            chapterId: '1050',
            chapterTitle: 'Chương 1050: Hành trình tiếp tục',
            lastRead: '3 ngày trước',
        },
    ];

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-16 w-16 text-zinc-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Chưa đăng nhập</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    Vui lòng đăng nhập để xem lịch sử đọc truyện của bạn
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-brand" />
                <h1 className="text-3xl font-bold">Lịch sử đọc</h1>
            </div>
            {historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-16 w-16 text-zinc-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Chưa có lịch sử</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Bạn chưa đọc truyện nào. Hãy bắt đầu khám phá ngay!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {historyItems.map((item) => (
                        <Link
                            key={`${item.storyId}-${item.chapterId}`}
                            to={`/story/${item.storyId}/chapter/${item.chapterId}`}
                            className="group flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                                {item.cover ? (
                                    <img
                                        src={item.cover}
                                        alt={item.storyTitle}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">No Image</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition-colors">
                                    {item.storyTitle}
                                </div>
                                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    {item.chapterTitle}
                                </div>
                                <div className="mt-2 text-xs text-zinc-500">
                                    Đọc {item.lastRead}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

