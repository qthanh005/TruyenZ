import { useEffect, useState } from 'react';

type Comic = {
	id: number;
	title: string;
	slug: string;
	author: string;
	status: string;
	views: number;
	follows: number;
	cover_image?: string;
	last_crawled_at?: string;
};

export default function AdminComics() {
	const [comics, setComics] = useState<Comic[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const pageSize = 10;

	useEffect(() => {
		// Mock data - sẽ thay thế bằng API call
		const timer = setTimeout(() => {
			setComics([
				{
					id: 1,
					title: 'Đại Chúa Tể',
					slug: 'dai-chua-te',
					author: 'Tác giả A',
					status: 'Ongoing',
					views: 125000,
					follows: 8500,
					cover_image: 'https://picsum.photos/100/150?random=1',
					last_crawled_at: '2024-01-15 10:30:00',
				},
				{
					id: 2,
					title: 'Thám Tử Conan',
					slug: 'tham-tu-conan',
					author: 'Tác giả B',
					status: 'Ongoing',
					views: 98000,
					follows: 7200,
					cover_image: 'https://picsum.photos/100/150?random=2',
					last_crawled_at: '2024-01-14 15:20:00',
				},
				{
					id: 3,
					title: 'One Piece',
					slug: 'one-piece',
					author: 'Oda Eiichiro',
					status: 'Ongoing',
					views: 250000,
					follows: 15000,
					cover_image: 'https://picsum.photos/100/150?random=3',
					last_crawled_at: '2024-01-15 08:00:00',
				},
			]);
			setLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const filteredComics = comics.filter(
		(comic) => comic.title.toLowerCase().includes(searchQuery.toLowerCase()) || comic.slug.includes(searchQuery.toLowerCase())
	);

	const paginatedComics = filteredComics.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="space-y-4">
			{/* Search and Actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex-1">
					<input
						type="text"
						placeholder="Tìm kiếm truyện..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
					/>
				</div>
				<button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90">
					+ Thêm truyện mới
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
										Ảnh
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Tên truyện
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Tác giả
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Trạng thái
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Lượt xem
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Theo dõi
									</th>
									<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Thao tác
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{paginatedComics.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
											Không tìm thấy truyện nào
										</td>
									</tr>
								) : (
									paginatedComics.map((comic) => (
										<tr key={comic.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
											<td className="px-4 py-3">
												<div className="h-16 w-12 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
													{comic.cover_image ? (
														<img src={comic.cover_image} alt={comic.title} className="h-full w-full object-cover" />
													) : (
														<div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">No Image</div>
													)}
												</div>
											</td>
											<td className="px-4 py-3">
												<div className="font-medium">{comic.title}</div>
												<div className="text-xs text-zinc-500">{comic.slug}</div>
											</td>
											<td className="px-4 py-3 text-sm">{comic.author}</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														comic.status === 'Ongoing'
															? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
															: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
													}`}
												>
													{comic.status === 'Ongoing' ? 'Đang ra' : 'Hoàn thành'}
												</span>
											</td>
											<td className="px-4 py-3 text-sm">{comic.views.toLocaleString('vi-VN')}</td>
											<td className="px-4 py-3 text-sm">{comic.follows.toLocaleString('vi-VN')}</td>
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
			{!loading && filteredComics.length > 0 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-zinc-500">
						Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredComics.length)} / {filteredComics.length}
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
							onClick={() => setPage((p) => Math.min(Math.ceil(filteredComics.length / pageSize), p + 1))}
							disabled={page >= Math.ceil(filteredComics.length / pageSize)}
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

