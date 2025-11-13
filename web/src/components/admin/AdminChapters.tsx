import { useEffect, useState } from 'react';

type Chapter = {
	id: number;
	comic_id: number;
	comic_title: string;
	chapter_number: number;
	title: string;
	views: number;
	status: string;
	created_at: string;
};

export default function AdminChapters() {
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const pageSize = 10;

	useEffect(() => {
		// Mock data
		const timer = setTimeout(() => {
			setChapters([
				{
					id: 1,
					comic_id: 1,
					comic_title: 'Đại Chúa Tể',
					chapter_number: 125,
					title: 'Chương 125',
					views: 15000,
					status: 'Published',
					created_at: '2024-01-15 10:00:00',
				},
				{
					id: 2,
					comic_id: 1,
					comic_title: 'Đại Chúa Tể',
					chapter_number: 124,
					title: 'Chương 124',
					views: 18000,
					status: 'Published',
					created_at: '2024-01-14 10:00:00',
				},
				{
					id: 3,
					comic_id: 2,
					comic_title: 'Thám Tử Conan',
					chapter_number: 1100,
					title: 'Chương 1100',
					views: 22000,
					status: 'Published',
					created_at: '2024-01-13 10:00:00',
				},
			]);
			setLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const filteredChapters =
		filterStatus === 'all' ? chapters : chapters.filter((ch) => ch.status === filterStatus);
	const paginatedChapters = filteredChapters.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-2">
					<button
						onClick={() => setFilterStatus('all')}
						className={`rounded-lg px-4 py-2 text-sm font-medium ${
							filterStatus === 'all'
								? 'bg-brand text-white'
								: 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
						}`}
					>
						Tất cả
					</button>
					<button
						onClick={() => setFilterStatus('Published')}
						className={`rounded-lg px-4 py-2 text-sm font-medium ${
							filterStatus === 'Published'
								? 'bg-brand text-white'
								: 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
						}`}
					>
						Đã xuất bản
					</button>
					<button
						onClick={() => setFilterStatus('Draft')}
						className={`rounded-lg px-4 py-2 text-sm font-medium ${
							filterStatus === 'Draft'
								? 'bg-brand text-white'
								: 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
						}`}
					>
						Bản nháp
					</button>
				</div>
				<button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90">
					+ Thêm chương mới
				</button>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				{loading ? (
					<div className="p-8 text-center text-zinc-500">Đang tải...</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Truyện
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Số chương
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Tiêu đề
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Lượt xem
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Trạng thái
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Ngày tạo
									</th>
									<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Thao tác
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{paginatedChapters.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
											Không tìm thấy chương nào
										</td>
									</tr>
								) : (
									paginatedChapters.map((chapter) => (
										<tr key={chapter.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
											<td className="px-4 py-3">
												<div className="font-medium">{chapter.comic_title}</div>
											</td>
											<td className="px-4 py-3 text-sm">{chapter.chapter_number}</td>
											<td className="px-4 py-3">
												<div className="font-medium">{chapter.title}</div>
											</td>
											<td className="px-4 py-3 text-sm">{chapter.views.toLocaleString('vi-VN')}</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														chapter.status === 'Published'
															? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
															: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
													}`}
												>
													{chapter.status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}
												</span>
											</td>
											<td className="px-4 py-3 text-sm text-zinc-500">{chapter.created_at}</td>
											<td className="px-4 py-3 text-right">
												<div className="flex justify-end gap-2">
													<button className="rounded-md bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600">
														Sửa
													</button>
													<button className="rounded-md bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600">
														Xóa
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination */}
			{!loading && filteredChapters.length > 0 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-zinc-500">
						Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredChapters.length)} / {filteredChapters.length}
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
						>
							Trước
						</button>
						<button
							onClick={() => setPage((p) => Math.min(Math.ceil(filteredChapters.length / pageSize), p + 1))}
							disabled={page >= Math.ceil(filteredChapters.length / pageSize)}
							className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
						>
							Sau
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

