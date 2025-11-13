import { useEffect, useState } from 'react';

type Genre = {
	id: number;
	name: string;
	comic_count: number;
};

export default function AdminGenres() {
	const [genres, setGenres] = useState<Genre[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newGenreName, setNewGenreName] = useState('');

	useEffect(() => {
		// Mock data
		const timer = setTimeout(() => {
			setGenres([
				{ id: 1, name: 'Hành Động', comic_count: 250 },
				{ id: 2, name: 'Huyền Huyễn', comic_count: 180 },
				{ id: 3, name: 'Trinh Thám', comic_count: 120 },
				{ id: 4, name: 'Hài Hước', comic_count: 95 },
				{ id: 5, name: 'Phiêu Lưu', comic_count: 150 },
				{ id: 6, name: 'Siêu Nhiên', comic_count: 110 },
			]);
			setLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const handleAddGenre = () => {
		if (newGenreName.trim()) {
			const newGenre: Genre = {
				id: genres.length + 1,
				name: newGenreName.trim(),
				comic_count: 0,
			};
			setGenres([...genres, newGenre]);
			setNewGenreName('');
			setShowAddModal(false);
		}
	};

	const handleDeleteGenre = (id: number) => {
		if (confirm('Bạn có chắc chắn muốn xóa thể loại này?')) {
			setGenres(genres.filter((g) => g.id !== id));
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Danh sách thể loại</h3>
					<p className="text-sm text-zinc-500">Quản lý các thể loại truyện trong hệ thống</p>
				</div>
				<button
					onClick={() => setShowAddModal(true)}
					className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
				>
					+ Thêm thể loại
				</button>
			</div>

			{/* Genres Grid */}
			{loading ? (
				<div className="p-8 text-center text-zinc-500">Đang tải...</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{genres.map((genre) => (
						<div
							key={genre.id}
							className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h4 className="text-lg font-semibold">{genre.name}</h4>
									<p className="mt-1 text-sm text-zinc-500">{genre.comic_count} truyện</p>
								</div>
								<div className="flex gap-2">
									<button className="rounded-md bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600">
										Sửa
									</button>
									<button
										onClick={() => handleDeleteGenre(genre.id)}
										className="rounded-md bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
									>
										Xóa
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Modal */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
						<h3 className="mb-4 text-lg font-semibold">Thêm thể loại mới</h3>
						<div className="space-y-4">
							<div>
								<label className="mb-2 block text-sm font-medium">Tên thể loại</label>
								<input
									type="text"
									value={newGenreName}
									onChange={(e) => setNewGenreName(e.target.value)}
									placeholder="Nhập tên thể loại..."
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
									onKeyPress={(e) => e.key === 'Enter' && handleAddGenre()}
								/>
							</div>
							<div className="flex justify-end gap-2">
								<button
									onClick={() => {
										setShowAddModal(false);
										setNewGenreName('');
									}}
									className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800"
								>
									Hủy
								</button>
								<button
									onClick={handleAddGenre}
									className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
								>
									Thêm
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

