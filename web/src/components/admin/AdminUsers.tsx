import { useEffect, useState } from 'react';

type User = {
	id: number;
	email: string;
	name: string;
	role: string;
	created_at: string;
	last_login?: string;
	status: string;
};

export default function AdminUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const pageSize = 10;

	useEffect(() => {
		// Mock data
		const timer = setTimeout(() => {
			setUsers([
				{
					id: 1,
					email: 'user1@example.com',
					name: 'Nguyễn Văn A',
					role: 'User',
					created_at: '2024-01-01 10:00:00',
					last_login: '2024-01-15 08:30:00',
					status: 'Active',
				},
				{
					id: 2,
					email: 'user2@example.com',
					name: 'Trần Thị B',
					role: 'User',
					created_at: '2024-01-02 11:00:00',
					last_login: '2024-01-14 15:20:00',
					status: 'Active',
				},
				{
					id: 3,
					email: 'admin@example.com',
					name: 'Admin User',
					role: 'Admin',
					created_at: '2023-12-01 09:00:00',
					last_login: '2024-01-15 10:00:00',
					status: 'Active',
				},
			]);
			setLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const filteredUsers = users.filter(
		(user) =>
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex-1">
					<input
						type="text"
						placeholder="Tìm kiếm người dùng..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
					/>
				</div>
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
										ID
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Tên
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Email
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Vai trò
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Trạng thái
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Đăng nhập cuối
									</th>
									<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
										Thao tác
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
								{paginatedUsers.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
											Không tìm thấy người dùng nào
										</td>
									</tr>
								) : (
									paginatedUsers.map((user) => (
										<tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
											<td className="px-4 py-3 text-sm">{user.id}</td>
											<td className="px-4 py-3">
												<div className="font-medium">{user.name}</div>
											</td>
											<td className="px-4 py-3 text-sm">{user.email}</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														user.role === 'Admin'
															? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
															: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
													}`}
												>
													{user.role}
												</span>
											</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														user.status === 'Active'
															? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
															: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
													}`}
												>
													{user.status}
												</span>
											</td>
											<td className="px-4 py-3 text-sm text-zinc-500">{user.last_login || 'Chưa đăng nhập'}</td>
											<td className="px-4 py-3 text-right">
												<div className="flex justify-end gap-2">
													<button className="rounded-md bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600">
														Sửa
													</button>
													<button className="rounded-md bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600">
														Khóa
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
			{!loading && filteredUsers.length > 0 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-zinc-500">
						Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredUsers.length)} / {filteredUsers.length}
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
							onClick={() => setPage((p) => Math.min(Math.ceil(filteredUsers.length / pageSize), p + 1))}
							disabled={page >= Math.ceil(filteredUsers.length / pageSize)}
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

