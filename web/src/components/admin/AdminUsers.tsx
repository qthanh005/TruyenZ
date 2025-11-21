import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { Search, Filter, Users as UsersIcon, ShieldHalf, AlertCircle, UserCheck, ArrowUpRight, CirclePlus } from 'lucide-react';

type AdminUser = {
	id: number;
	username: string;
	email: string | null;
	role: string;
	status: 'ACTIVE' | 'LOCKED';
	avatarUrl?: string | null;
	bio?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	lockedAt?: string | null;
	lockReason?: string | null;
};

type EditFormState = {
	username: string;
	email: string;
	role: string;
	avatarUrl: string;
	bio: string;
};

export default function AdminUsers() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editForm, setEditForm] = useState<EditFormState>({
		username: '',
		email: '',
		role: 'USER',
		avatarUrl: '',
		bio: '',
	});
	const [savingEdit, setSavingEdit] = useState(false);
	const pageSize = 10;

	const loadUsers = useCallback(async () => {
		try {
			setLoading(true);
			const response = await api.get<AdminUser[]>(endpoints.getAllUsers());

			const mappedUsers = response.data.map((user) => ({
				id: user.id,
				username: user.username,
				email: user.email ?? null,
				role: user.role ?? 'USER',
				status: (user.status as AdminUser['status']) ?? 'ACTIVE',
				avatarUrl: user.avatarUrl ?? null,
				bio: user.bio ?? null,
				createdAt: user.createdAt ?? null,
				updatedAt: user.updatedAt ?? null,
				lockedAt: user.lockedAt ?? null,
				lockReason: user.lockReason ?? null,
			}));

			setUsers(mappedUsers);
		} catch (error) {
			console.error('Error loading users:', error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	useEffect(() => {
		setPage(1);
	}, [searchQuery]);

	const formatDate = (value?: string | null) => {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString('vi-VN');
	};

	const formatStatusLabel = (status: AdminUser['status']) => {
		return status === 'LOCKED' ? 'Đã khóa' : 'Đang hoạt động';
	};

	const handleOpenEdit = (user: AdminUser) => {
		setSelectedUser(user);
		setEditForm({
			username: user.username ?? '',
			email: user.email ?? '',
			role: user.role ?? 'USER',
			avatarUrl: user.avatarUrl ?? '',
			bio: user.bio ?? '',
		});
		setIsEditOpen(true);
	};

	const handleCloseEdit = () => {
		setIsEditOpen(false);
		setSelectedUser(null);
	};

	const handleEditChange = (field: keyof EditFormState, value: string) => {
		setEditForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleUpdateUser = async () => {
		if (!selectedUser) return;
		if (!editForm.username.trim()) {
			alert('Username không được để trống');
			return;
		}
		setSavingEdit(true);
		try {
			const payload = {
				username: editForm.username.trim(),
				email: editForm.email.trim(),
				role: editForm.role.toUpperCase(),
				avatarUrl: editForm.avatarUrl.trim(),
				bio: editForm.bio.trim(),
			};
			const response = await api.put<AdminUser>(endpoints.updateUser(selectedUser.id), payload);
			const updatedUser = {
				...selectedUser,
				...response.data,
				email: response.data.email ?? null,
				avatarUrl: response.data.avatarUrl ?? null,
				bio: response.data.bio ?? null,
				status: (response.data.status as AdminUser['status']) ?? 'ACTIVE',
				createdAt: response.data.createdAt ?? null,
				updatedAt: response.data.updatedAt ?? null,
				lockedAt: response.data.lockedAt ?? null,
				lockReason: response.data.lockReason ?? null,
				role: response.data.role ?? selectedUser.role,
				username: response.data.username ?? selectedUser.username,
			};

			setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
			setSelectedUser(updatedUser);
			setIsEditOpen(false);
		} catch (error) {
			console.error('Failed to update user:', error);
			alert('Không thể cập nhật người dùng. Vui lòng thử lại.');
		} finally {
			setSavingEdit(false);
		}
	};

	const filteredUsers = users.filter(
		(user) =>
			(user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
	);

	const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

	const summaryStats = useMemo(() => {
		const total = users.length;
		const admins = users.filter((user) => user.role === 'ADMIN').length;
		const locked = users.filter((user) => user.status === 'LOCKED').length;
		const active = total - locked;
		return {
			total,
			admins,
			locked,
			active,
		};
	}, [users]);

	return (
		<div className="space-y-6">
			<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 p-6 text-white shadow-lg">
				<div className="absolute inset-0 opacity-40">
					<div className="absolute -left-16 top-0 h-60 w-60 rounded-full bg-brand blur-3xl" />
					<div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-purple-500 blur-3xl" />
				</div>
				<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-[0.35em] text-white/60">User Management</p>
						<h2 className="text-3xl font-semibold">Quản lý người dùng</h2>
						<p className="max-w-2xl text-sm text-white/70">
							Theo dõi trạng thái tài khoản, vai trò và hoạt động đăng nhập mới nhất của cộng đồng đọc truyện.
						</p>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{[
								{ label: 'Tổng người dùng', value: summaryStats.total, icon: UsersIcon },
								{ label: 'Admin', value: summaryStats.admins, icon: ShieldHalf },
								{ label: 'Đang hoạt động', value: summaryStats.active, icon: UserCheck },
								{ label: 'Đã khóa', value: summaryStats.locked, icon: AlertCircle },
							].map((stat) => {
								const Icon = stat.icon;
								return (
									<div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
										<p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
										<div className="mt-2 flex items-center justify-between">
											<p className="text-3xl font-semibold">{stat.value}</p>
											<Icon className="h-5 w-5 text-white/70" />
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className="grid w-full max-w-md gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
						<button className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:bg-white/20">
							<div>
								<p className="text-sm font-semibold">Thêm người dùng</p>
								<p className="text-xs text-white/70">Tạo tài khoản mới thủ công</p>
							</div>
							<CirclePlus className="h-5 w-5" />
						</button>
						<button className="flex items-center justify_between rounded-xl border border-white/10 px-4 py-3 text-left text-white/80 transition hover:bg-white/10">
							<div>
								<p className="text-sm font-semibold">Gửi lời mời</p>
								<p className="text-xs text-white/70">Mời admin/biên tập viên</p>
							</div>
							<ArrowUpRight className="h-5 w-5" />
						</button>
					</div>
				</div>
			</section>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
					<Search className="h-4 w-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Tìm theo tên, email hoặc ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
					/>
					<button className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
						<Filter className="h-4 w-4" />
						Bộ lọc
					</button>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
				{loading ? (
					<div className="p-8 text-center text-zinc-500">Đang tải...</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
								<tr className="text-xs uppercase tracking-wider">
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
												<div className="font-medium">{user.username}</div>
											</td>
											<td className="px-4 py-3 text-sm">{user.email || '—'}</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														user.role === 'ADMIN'
															? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
															: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
													}`}
												>
													{user.role === 'ADMIN' ? 'Admin' : 'User'}
												</span>
											</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
														user.status === 'ACTIVE'
															? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
															: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
													}`}
												>
													{formatStatusLabel(user.status)}
												</span>
											</td>
											<td className="px-4 py-3 text-sm text-zinc-500">
												{formatDate(user.updatedAt) || 'Chưa cập nhật'}
											</td>
											<td className="px-4 py-3 text-right">
												<button
													className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
													onClick={() => handleOpenEdit(user)}
												>
													Sửa
												</button>
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

			{isEditOpen && selectedUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl ring-1 ring-black/10 dark:border-zinc-800 dark:bg-zinc-900">
						<div className="mb-6 flex items-start justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Edit User</p>
								<h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{selectedUser.username}</h3>
								<p className="text-sm text-zinc-500">{selectedUser.email || 'Chưa có email'}</p>
							</div>
							<button onClick={handleCloseEdit} className="rounded-full border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
								<input
									value={editForm.username}
									onChange={(e) => handleEditChange('username', e.target.value)}
									className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>

							<div>
								<label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
								<input
									type="email"
									value={editForm.email}
									onChange={(e) => handleEditChange('email', e.target.value)}
									className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Vai trò</label>
									<select
										value={editForm.role}
										onChange={(e) => handleEditChange('role', e.target.value)}
										className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
									>
										<option value="USER">User</option>
										<option value="ADMIN">Admin</option>
									</select>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ảnh đại diện (URL)</label>
									<input
										value={editForm.avatarUrl}
										onChange={(e) => handleEditChange('avatarUrl', e.target.value)}
										className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
									/>
								</div>
							</div>

							<div>
								<label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Giới thiệu</label>
								<textarea
									rows={3}
									value={editForm.bio}
									onChange={(e) => handleEditChange('bio', e.target.value)}
									className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button
								onClick={handleCloseEdit}
								className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800"
								disabled={savingEdit}
							>
								Hủy
							</button>
							<button
								onClick={handleUpdateUser}
								disabled={savingEdit}
								className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90 disabled:opacity-50"
							>
								{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

