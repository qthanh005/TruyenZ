import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { mockBookmarks, mockHistory } from '@/shared/mocks';

export default function ProfilePage() {
	const { user } = useAuth();
	const [bookmarks, setBookmarks] = useState<any[]>([]);
	const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setBookmarks(mockBookmarks);
            setHistory(mockHistory);
        }, 300);
        return () => clearTimeout(timer);
    }, [user]);

	return (
		<div className="space-y-6">
			<section>
				<h1 className="text-2xl font-semibold">Hồ sơ</h1>
				<div className="mt-2 text-sm text-zinc-500">{user?.profile?.email}</div>
			</section>
			<section>
				<h2 className="mb-2 text-lg font-semibold">Bookmark</h2>
				<div className="space-y-2 text-sm">
					{bookmarks.map((b) => (
						<div key={b.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
							{b.title}
						</div>
					))}
				</div>
			</section>
			<section>
				<h2 className="mb-2 text-lg font-semibold">Lịch sử đọc</h2>
				<div className="space-y-2 text-sm">
					{history.map((h) => (
						<div key={h.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
							{h.title}
						</div>
					))}
				</div>
			</section>
		</div>
	);
}


