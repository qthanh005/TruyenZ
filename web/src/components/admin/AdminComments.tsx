import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { Search, Filter, MessageSquare, Trash2, Shield, ShieldOff, Eye, EyeOff, X } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';

type AdminComment = {
	id: number;
	storyId: number;
	chapterId?: number | null;
	userId: number;
	parentId?: number | null;
	content: string;
	isDeleted: string; // "No", "Yes", "Blocked"
	createdAt: string;
	updatedAt?: string | null;
};

type Story = {
	id: number;
	title: string;
};

export default function AdminComments() {
	const [comments, setComments] = useState<AdminComment[]>([]);
	const [stories, setStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'No', 'Yes', 'Blocked'
	const [selectedComment, setSelectedComment] = useState<AdminComment | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
	const [blockingCommentId, setBlockingCommentId] = useState<number | null>(null);
	const confirm = useConfirm();
	const toast = useToast();
	const pageSize = 10;

	const loadComments = useCallback(async () => {
		try {
			setLoading(true);
			const isDeleted = statusFilter === 'all' ? undefined : statusFilter;
			const url = endpoints.getAllCommentsForAdmin(selectedStoryId || undefined, isDeleted);
			const response = await api.get<AdminComment[]>(url);
			setComments(Array.isArray(response.data) ? response.data : []);
		} catch (error: any) {
			console.error('Error loading comments:', error);
			if (error.response?.status === 404) {
				toast.error('Endpoint chưa được triển khai. Vui lòng restart comment service.');
			} else if (error.code === 'ERR_INSUFFICIENT_RESOURCES' || error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
				console.warn('Too many requests, please wait...');
				toast.error('Quá nhiều request. Vui lòng đợi một chút và thử lại.');
			} else {
				toast.error(error.response?.data?.error || 'Không thể tải danh sách bình luận');
			}
			setComments([]);
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedStoryId, statusFilter]);

	const loadStories = useCallback(async () => {
		try {
			const response = await api.get<Story[]>(endpoints.stories());
			setStories(response.data);
		} catch (error) {
			console.error('Error loading stories:', error);
		}
	}, []);

	useEffect(() => {
		loadStories();
	}, []); // Only run once on mount

	useEffect(() => {
		loadComments();
	}, [selectedStoryId, statusFilter]); // Only reload when filters change

	const filteredComments = useMemo(() => {
		let filtered = comments;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(comment) =>
					comment.content.toLowerCase().includes(query) ||
					comment.id.toString().includes(query) ||
					comment.userId.toString().includes(query)
			);
		}

		return filtered;
	}, [comments, searchQuery]);

	const paginatedComments = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredComments.slice(start, start + pageSize);
	}, [filteredComments, page]);

	const totalPages = Math.ceil(filteredComments.length / pageSize);

	const handleDelete = async (commentId: number) => {
		const confirmed = await confirm.confirm(
			'Bạn có chắc chắn muốn xóa bình luận này?',
			'danger',
			'Xác nhận xóa bình luận'
		);
		if (!confirmed) return;

		try {
			setDeletingCommentId(commentId);
			await api.put(endpoints.deleteComment(commentId.toString()));
			toast.success('Xóa bình luận thành công');
			loadComments();
		} catch (error: any) {
			console.error('Error deleting comment:', error);
			toast.error(error.response?.data?.error || 'Không thể xóa bình luận');
		} finally {
			setDeletingCommentId(null);
		}
	};

	const handleBlock = async (commentId: number) => {
		const confirmed = await confirm.confirm(
			'Bạn có chắc chắn muốn chặn bình luận này?',
			'warning',
			'Xác nhận chặn bình luận'
		);
		if (!confirmed) return;

		try {
			setBlockingCommentId(commentId);
			await api.put(endpoints.blockComment(commentId.toString()));
			toast.success('Chặn bình luận thành công');
			loadComments();
		} catch (error: any) {
			console.error('Error blocking comment:', error);
			toast.error(error.response?.data?.error || 'Không thể chặn bình luận');
		} finally {
			setBlockingCommentId(null);
		}
	};

	const handleUnblock = async (commentId: number) => {
		try {
			setBlockingCommentId(commentId);
			await api.put(endpoints.unblockComment(commentId.toString()));
			toast.success('Bỏ chặn bình luận thành công');
			loadComments();
		} catch (error: any) {
			console.error('Error unblocking comment:', error);
			toast.error(error.response?.data?.error || 'Không thể bỏ chặn bình luận');
		} finally {
			setBlockingCommentId(null);
		}
	};

	const getStatusBadge = (isDeleted: string) => {
		switch (isDeleted) {
			case 'No':
				return (
					<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
						Hoạt động
					</span>
				);
			case 'Yes':
				return (
					<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
						Đã xóa
					</span>
				);
			case 'Blocked':
				return (
					<span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
						Đã chặn
					</span>
				);
			default:
				return null;
		}
	};

	const getStoryTitle = (storyId: number) => {
		const story = stories.find((s) => s.id === storyId);
		return story?.title || `Truyện #${storyId}`;
	};

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
						<input
							type="text"
							placeholder="Tìm kiếm bình luận..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800"
						/>
					</div>

					{/* Story Filter */}
					<div>
						<select
							value={selectedStoryId || ''}
							onChange={(e) => {
								setSelectedStoryId(e.target.value ? Number(e.target.value) : null);
								setPage(1);
							}}
							className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800"
						>
							<option value="">Tất cả truyện</option>
							{stories.map((story) => (
								<option key={story.id} value={story.id}>
									{story.title}
								</option>
							))}
						</select>
					</div>

					{/* Status Filter */}
					<div>
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPage(1);
							}}
							className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800"
						>
							<option value="all">Tất cả trạng thái</option>
							<option value="No">Hoạt động</option>
							<option value="Yes">Đã xóa</option>
							<option value="Blocked">Đã chặn</option>
						</select>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<div className="text-sm text-zinc-500">Tổng bình luận</div>
					<div className="mt-1 text-2xl font-semibold">{comments.length}</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<div className="text-sm text-zinc-500">Hoạt động</div>
					<div className="mt-1 text-2xl font-semibold text-green-600">
						{comments.filter((c) => c.isDeleted === 'No').length}
					</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<div className="text-sm text-zinc-500">Đã xóa</div>
					<div className="mt-1 text-2xl font-semibold text-red-600">
						{comments.filter((c) => c.isDeleted === 'Yes').length}
					</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<div className="text-sm text-zinc-500">Đã chặn</div>
					<div className="mt-1 text-2xl font-semibold text-yellow-600">
						{comments.filter((c) => c.isDeleted === 'Blocked').length}
					</div>
				</div>
			</div>

			{/* Comments Table */}
			<div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
					</div>
				) : paginatedComments.length === 0 ? (
					<div className="py-12 text-center text-sm text-zinc-500">Không có bình luận nào</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">ID</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Nội dung</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Truyện</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">User ID</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Trạng thái</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Ngày tạo</th>
									<th className="px-4 py-3 text-right text-xs font-semibold uppercase text-zinc-500">Thao tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{paginatedComments.map((comment) => (
									<tr
										key={comment.id}
										className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
									>
										<td className="px-4 py-3 text-sm font-medium">{comment.id}</td>
										<td className="px-4 py-3">
											<div className="max-w-md">
												<p className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
													{comment.content}
												</p>
												{comment.parentId && (
													<span className="mt-1 text-xs text-zinc-500">Trả lời comment #{comment.parentId}</span>
												)}
											</div>
										</td>
										<td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
											{getStoryTitle(comment.storyId)}
										</td>
										<td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{comment.userId}</td>
										<td className="px-4 py-3">{getStatusBadge(comment.isDeleted)}</td>
										<td className="px-4 py-3 text-sm text-zinc-500">
											{new Date(comment.createdAt).toLocaleString('vi-VN')}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-2">
												<button
													onClick={() => {
														setSelectedComment(comment);
														setIsDetailOpen(true);
													}}
													className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
													title="Xem chi tiết"
												>
													<Eye className="h-4 w-4" />
												</button>
												{comment.isDeleted === 'Blocked' ? (
													<button
														onClick={() => handleUnblock(comment.id)}
														disabled={blockingCommentId === comment.id}
														className="rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/20"
														title="Bỏ chặn"
													>
														{blockingCommentId === comment.id ? (
															<div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
														) : (
															<ShieldOff className="h-4 w-4" />
														)}
													</button>
												) : comment.isDeleted === 'No' ? (
													<button
														onClick={() => handleBlock(comment.id)}
														disabled={blockingCommentId === comment.id}
														className="rounded-md p-1.5 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50 dark:hover:bg-yellow-900/20"
														title="Chặn"
													>
														{blockingCommentId === comment.id ? (
															<div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
														) : (
															<Shield className="h-4 w-4" />
														)}
													</button>
												) : null}
												{comment.isDeleted !== 'Yes' && (
													<button
														onClick={() => handleDelete(comment.id)}
														disabled={deletingCommentId === comment.id}
														className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
														title="Xóa"
													>
														{deletingCommentId === comment.id ? (
															<div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
														) : (
															<Trash2 className="h-4 w-4" />
														)}
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
						<div className="flex items-center justify-between">
							<div className="text-sm text-zinc-500">
								Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredComments.length)} trong tổng số{' '}
								{filteredComments.length} bình luận
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
								>
									Trước
								</button>
								<span className="flex items-center px-3 text-sm">
									Trang {page} / {totalPages}
								</span>
								<button
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
								>
									Sau
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Detail Modal */}
			{isDetailOpen && selectedComment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
							<h3 className="text-lg font-semibold">Chi tiết bình luận</h3>
							<button
								onClick={() => {
									setIsDetailOpen(false);
									setSelectedComment(null);
								}}
								className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="text-sm font-medium text-zinc-500">ID</label>
								<p className="mt-1 text-sm">{selectedComment.id}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-zinc-500">Nội dung</label>
								<p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
									{selectedComment.content}
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-zinc-500">Truyện</label>
									<p className="mt-1 text-sm">{getStoryTitle(selectedComment.storyId)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-zinc-500">User ID</label>
									<p className="mt-1 text-sm">{selectedComment.userId}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-zinc-500">Trạng thái</label>
									<div className="mt-1">{getStatusBadge(selectedComment.isDeleted)}</div>
								</div>
								<div>
									<label className="text-sm font-medium text-zinc-500">Ngày tạo</label>
									<p className="mt-1 text-sm">{new Date(selectedComment.createdAt).toLocaleString('vi-VN')}</p>
								</div>
								{selectedComment.parentId && (
									<div>
										<label className="text-sm font-medium text-zinc-500">Trả lời comment</label>
										<p className="mt-1 text-sm">#{selectedComment.parentId}</p>
									</div>
								)}
								{selectedComment.chapterId && (
									<div>
										<label className="text-sm font-medium text-zinc-500">Chapter ID</label>
										<p className="mt-1 text-sm">{selectedComment.chapterId}</p>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
							<button
								onClick={() => {
									setIsDetailOpen(false);
									setSelectedComment(null);
								}}
								className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
							>
								Đóng
							</button>
							{selectedComment.isDeleted === 'Blocked' ? (
								<button
									onClick={() => {
										handleUnblock(selectedComment.id);
										setIsDetailOpen(false);
										setSelectedComment(null);
									}}
									className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
								>
									Bỏ chặn
								</button>
							) : selectedComment.isDeleted === 'No' ? (
								<>
									<button
										onClick={() => {
											handleBlock(selectedComment.id);
											setIsDetailOpen(false);
											setSelectedComment(null);
										}}
										className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
									>
										Chặn
									</button>
									<button
										onClick={() => {
											handleDelete(selectedComment.id);
											setIsDetailOpen(false);
											setSelectedComment(null);
										}}
										className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
									>
										Xóa
									</button>
								</>
							) : null}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

