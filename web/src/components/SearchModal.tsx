import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, BookOpen, Star } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type Suggestion = { 
	id: number; 
	title: string; 
	author?: string;
	coverImageId?: string;
};

type SearchModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (storyId: string) => void;
};

export function SearchModal({ isOpen, onClose, onSelect }: SearchModalProps) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Reset when modal closes
	useEffect(() => {
		if (!isOpen) {
			setQuery('');
			setSuggestions([]);
		}
	}, [isOpen]);

	// Search with debounce
	useEffect(() => {
		if (!query.trim()) {
			setSuggestions([]);
			return;
		}

		const t = setTimeout(async () => {
			setLoading(true);
			try {
				const response = await api.get<Array<{ 
					id: number; 
					title: string; 
					author: string; 
					coverImageId?: string;
				}>>(endpoints.searchStories(query));
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

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Helper function to get cover image URL
	const getCoverUrl = (coverImageId?: string): string => {
		if (!coverImageId) {
			return `https://picsum.photos/seed/placeholder/120/160`;
		}
		const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081';
		return coverImageId.startsWith('http') ? coverImageId : `${gatewayUrl}${coverImageId.startsWith('/') ? '' : '/'}${coverImageId}`;
	};

	const handleSelect = (storyId: string | number) => {
		onSelect(String(storyId));
		onClose();
	};

	if (!isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className="relative z-[10000] mt-8 mb-8 w-full max-w-3xl mx-4">
				<div className="rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
					{/* Header */}
					<div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
							<input
								ref={inputRef}
								type="text"
								placeholder="Tìm truyện, tác giả, thể loại..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-brand dark:focus:bg-zinc-800"
							/>
						</div>
						<button
							onClick={onClose}
							className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
							aria-label="Đóng"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Content */}
					<div className="max-h-[60vh] overflow-y-auto">
						{loading && (
							<div className="flex items-center justify-center px-6 py-12">
								<div className="text-center">
									<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
									<p className="mt-3 text-sm text-zinc-500">Đang tìm kiếm...</p>
								</div>
							</div>
						)}

						{!loading && query.trim() && suggestions.length === 0 && (
							<div className="flex flex-col items-center justify-center px-6 py-12">
								<BookOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
								<p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">Không tìm thấy kết quả</p>
								<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Thử tìm kiếm với từ khóa khác</p>
							</div>
						)}

						{!loading && !query.trim() && (
							<div className="flex flex-col items-center justify-center px-6 py-12">
								<Search className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
								<p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">Nhập từ khóa để tìm kiếm</p>
								<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Tìm kiếm theo tên truyện, tác giả hoặc thể loại</p>
							</div>
						)}

						{!loading && suggestions.length > 0 && (
							<div className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{suggestions.map((s) => (
									<button
										key={s.id}
										className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
										onClick={() => handleSelect(s.id)}
									>
										{/* Cover Image */}
										<div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700">
											<img
												src={getCoverUrl(s.coverImageId)}
												alt={s.title}
												className="w-full h-full object-cover"
												loading="lazy"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.src = `https://picsum.photos/seed/story-${s.id}/120/180`;
												}}
											/>
										</div>
										
										{/* Story Info */}
										<div className="flex-1 min-w-0">
											<h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
												{s.title}
											</h3>
											{s.author && (
												<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
													Tác giả: {s.author}
												</p>
											)}
										</div>

										{/* Arrow Icon */}
										<div className="flex-shrink-0 text-zinc-400">
											<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</div>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					{query.trim() && suggestions.length > 0 && (
						<div className="border-t border-zinc-200 px-6 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
							Tìm thấy {suggestions.length} {suggestions.length === 1 ? 'kết quả' : 'kết quả'}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}

