import { useEffect, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { Link } from 'react-router-dom';

type Story = { id: string; title: string; cover?: string; genres?: string[]; rating?: number; description?: string };

export default function HomePage() {
	const [items, setItems] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await api.get(endpoints.stories());
				setItems(data?.items || data || []);
			} catch {}
			setLoading(false);
		})();
	}, []);

	return (
		<div className="space-y-6">
			<section>
				<h1 className="mb-3 text-2xl font-semibold">Đang hot</h1>
				{loading ? (
					<div className="text-sm text-zinc-500">Đang tải...</div>
				) : (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
						{items.map((s) => (
							<Link key={s.id} to={`/story/${s.id}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
								<div className="aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
									{s.cover ? (
										<img src={s.cover} alt={s.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
									) : (
										<div className="flex h-full w-full items-center justify-center text-zinc-400">No Image</div>
									)}
								</div>
								<div className="space-y-1 p-3">
									<div className="line-clamp-2 font-medium leading-snug">{s.title}</div>
									{s.genres && (
										<div className="truncate text-xs text-zinc-500">{s.genres.join(', ')}</div>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}


