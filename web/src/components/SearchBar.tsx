import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { Search } from 'lucide-react';

type Suggestion = { id: string; title: string; author?: string };

export function SearchBar({ onSelect }: { onSelect: (storyId: string) => void }) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

	useEffect(() => {
		if (!query) {
			setSuggestions([]);
			return;
		}
		const t = setTimeout(async () => {
			setLoading(true);
			try {
				const { data } = await api.get(endpoints.stories(query));
				setSuggestions((data?.items || data || []).slice(0, 8));
			} catch {}
			setLoading(false);
		}, 250);
		return () => clearTimeout(t);
	}, [query]);

	const show = useMemo(() => open && (loading || suggestions.length > 0), [open, loading, suggestions]);

	return (
		<div className="relative">
			<div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-brand/50 dark:border-zinc-800">
				<Search className="h-4 w-4 text-zinc-500" />
				<input
					type="text"
					placeholder="Tìm truyện, tác giả, thể loại..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 150)}
					className="w-full bg-transparent outline-none placeholder:text-zinc-400"
				/>
			</div>
			{show && (
				<div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
					{loading && <div className="px-3 py-2 text-sm text-zinc-500">Đang tìm...</div>}
					{!loading && suggestions.map((s) => (
						<button
							key={s.id}
							className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
							onClick={() => onSelect(s.id)}
						>
							<div className="font-medium">{s.title}</div>
							{s.author && <div className="text-xs text-zinc-500">{s.author}</div>}
						</button>
					))}
					{!loading && suggestions.length === 0 && (
						<div className="px-3 py-2 text-sm text-zinc-500">Không có kết quả</div>
					)}
				</div>
			)}
		</div>
	);
}


