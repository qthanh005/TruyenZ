import { useEffect, useMemo, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type Suggestion = { 
	id: number; 
	title: string; 
	author?: string;
	coverImageId?: string;
};

type SearchBarProps = {
	onSelect: (storyId: string) => void;
	expanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
	compact?: boolean; // Hiển thị dạng compact (chỉ icon) khi chưa expand
};

export function SearchBar({ onSelect, expanded: controlledExpanded, onExpandChange, compact = false }: SearchBarProps) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [internalExpanded, setInternalExpanded] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Use controlled or internal state
	const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
	const setExpanded = (value: boolean) => {
		if (onExpandChange) {
			onExpandChange(value);
		} else {
			setInternalExpanded(value);
		}
	};

	useEffect(() => {
		if (!query) {
			setSuggestions([]);
			return;
		}
        const t = setTimeout(async () => {
			setLoading(true);
            try {
                const response = await api.get<Array<{ id: number; title: string; author: string; coverImageId?: string }>>(endpoints.searchStories(query));
                const data = response.data.map(s => ({
					id: s.id,
					title: s.title,
					author: s.author,
					coverImageId: s.coverImageId,
				}));
                setSuggestions(data);
            } catch (err) {
				console.error('Search error:', err);
				setSuggestions([]);
			}
			setLoading(false);
		}, 300);
		return () => clearTimeout(t);
	}, [query]);

	// Focus input when expanded
	useEffect(() => {
		if (expanded && inputRef.current) {
			inputRef.current.focus();
		}
	}, [expanded]);

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		if (open) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [open]);

	const show = useMemo(() => open && (loading || suggestions.length > 0 || query.length > 0), [open, loading, suggestions, query]);

	const handleExpand = () => {
		setExpanded(true);
	};

	const handleCollapse = () => {
		setExpanded(false);
		setQuery('');
		setOpen(false);
		setSuggestions([]);
	};

	const handleSelect = (storyId: string | number) => {
		onSelect(String(storyId));
		setQuery('');
		setOpen(false);
		setSuggestions([]);
		if (compact) {
			setExpanded(false);
		}
	};

	// Compact mode: chỉ hiển thị icon khi chưa expand
	if (compact && !expanded) {
		return (
			<button
				onClick={handleExpand}
				className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
				aria-label="Tìm kiếm"
			>
				<Search className="h-5 w-5" />
			</button>
		);
	}

	// Helper function to get cover image URL
	const getCoverUrl = (coverImageId?: string): string => {
		if (!coverImageId) {
			return `https://picsum.photos/seed/placeholder/120/160`;
		}
		const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
		return coverImageId.startsWith('http') ? coverImageId : `${gatewayUrl}${coverImageId.startsWith('/') ? '' : '/'}${coverImageId}`;
	};

	return (
		<div ref={containerRef} className={`relative transition-all duration-500 ease-out ${expanded ? 'w-full' : compact ? 'w-auto' : 'w-full'}`}>
			<div className={`flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm transition-all duration-500 ease-out focus-within:ring-2 focus-within:ring-brand/50 dark:border-zinc-800 ${
				expanded ? 'bg-white dark:bg-zinc-900 shadow-lg scale-100' : 'bg-transparent'
			}`}>
				<Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Tìm truyện, tác giả, thể loại..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => {
						setOpen(true);
						if (compact) {
							setExpanded(true);
						}
					}}
					onBlur={() => {
						// Delay để cho phép click vào suggestions
						setTimeout(() => setOpen(false), 200);
					}}
					className="w-full bg-transparent outline-none placeholder:text-zinc-400"
				/>
				{expanded && compact && (
					<button
						onClick={handleCollapse}
						className="flex-shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
						aria-label="Đóng tìm kiếm"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
			{show && (
				<div className="absolute z-50 mt-2 w-full max-h-96 overflow-y-auto overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in slide-in-from-top-2 duration-200">
					{loading && (
						<div className="flex items-center justify-center px-4 py-8">
							<div className="text-sm text-zinc-500">Đang tìm...</div>
						</div>
					)}
					{!loading && suggestions.length > 0 && suggestions.map((s) => (
						<button
							key={s.id}
							className="flex w-full items-center gap-3 cursor-pointer px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
							onClick={() => handleSelect(s.id)}
							onMouseDown={(e) => e.preventDefault()} // Prevent blur
						>
							{/* Cover Image */}
							<div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-700">
								<img
									src={getCoverUrl(s.coverImageId)}
									alt={s.title}
									className="w-full h-full object-cover"
									loading="lazy"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = `https://picsum.photos/seed/story-${s.id}/120/160`;
									}}
								/>
							</div>
							{/* Story Info */}
							<div className="flex-1 min-w-0">
								<div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.title}</div>
								{s.author && (
									<div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Tác giả: {s.author}</div>
								)}
							</div>
						</button>
					))}
					{!loading && suggestions.length === 0 && query.length > 0 && (
						<div className="flex items-center justify-center px-4 py-8">
							<div className="text-sm text-zinc-500">Không tìm thấy kết quả</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}


