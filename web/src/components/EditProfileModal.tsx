import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';

type UserProfile = {
	id?: number;
	username?: string;
	email?: string;
	avatarUrl?: string;
	bio?: string;
};

type EditProfileModalProps = {
	isOpen: boolean;
	onClose: () => void;
	user: UserProfile | null;
	onUpdate: () => void;
};

export default function EditProfileModal({ isOpen, onClose, user, onUpdate }: EditProfileModalProps) {
	const { showToast } = useToast();
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		avatarUrl: '',
		bio: '',
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (isOpen && user) {
			setFormData({
				username: user.username || '',
				email: user.email || '',
				avatarUrl: user.avatarUrl || '',
				bio: user.bio || '',
			});
			setErrors({});
		}
	}, [isOpen, user]);

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.username.trim()) {
			newErrors.username = 'Tên người dùng không được để trống';
		} else if (formData.username.length < 3) {
			newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
		} else if (formData.username.length > 50) {
			newErrors.username = 'Tên người dùng không được vượt quá 50 ký tự';
		}

		if (formData.email && !formData.email.includes('@')) {
			newErrors.email = 'Email không hợp lệ';
		}

		if (formData.bio && formData.bio.length > 500) {
			newErrors.bio = 'Tiểu sử không được vượt quá 500 ký tự';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		setLoading(true);
		try {
			// Build request body - only include fields that have values
			const requestBody: Record<string, any> = {
				username: formData.username.trim(),
			};

			// Only include optional fields if they have values
			if (formData.email.trim()) {
				requestBody.email = formData.email.trim();
			}
			if (formData.avatarUrl.trim()) {
				requestBody.avatarUrl = formData.avatarUrl.trim();
			}
			if (formData.bio.trim()) {
				requestBody.bio = formData.bio.trim();
			}

			const response = await api.put(endpoints.updateProfile(), requestBody);

			showToast('Cập nhật hồ sơ thành công', 'success');
			onUpdate();
			onClose();
		} catch (error: any) {
			console.error('Error updating profile:', error);
			const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi cập nhật hồ sơ';
			showToast(errorMessage, 'error');
			
			// Set field-specific errors if available
			if (error.response?.data?.field) {
				setErrors({ [error.response.data.field]: errorMessage });
			}
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
			<div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
					<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					<div className="space-y-6">
						{/* Username */}
						<div>
							<label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Tên người dùng <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="username"
								value={formData.username}
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
									errors.username
										? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
										: 'border-zinc-300 focus:border-brand focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900'
								} dark:text-white`}
								placeholder="Nhập tên người dùng"
								required
							/>
							{errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
						</div>

						{/* Email */}
						<div>
							<label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Email
							</label>
							<input
								type="email"
								id="email"
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
									errors.email
										? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
										: 'border-zinc-300 focus:border-brand focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900'
								} dark:text-white`}
								placeholder="Nhập email (tùy chọn)"
							/>
							{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
						</div>

						{/* Avatar URL */}
						<div>
							<label htmlFor="avatarUrl" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								URL Avatar
							</label>
							<input
								type="url"
								id="avatarUrl"
								value={formData.avatarUrl}
								onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
								className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
								placeholder="Nhập URL ảnh đại diện (tùy chọn)"
							/>
							{formData.avatarUrl && (
								<div className="mt-2">
									<img
										src={formData.avatarUrl}
										alt="Avatar preview"
										className="h-20 w-20 rounded-full object-cover"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.style.display = 'none';
										}}
									/>
								</div>
							)}
						</div>

						{/* Bio */}
						<div>
							<label htmlFor="bio" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Tiểu sử
							</label>
							<textarea
								id="bio"
								value={formData.bio}
								onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								rows={4}
								maxLength={500}
								className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
									errors.bio
										? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
										: 'border-zinc-300 focus:border-brand focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900'
								} dark:text-white`}
								placeholder="Giới thiệu về bản thân (tùy chọn)"
							/>
							<div className="mt-1 flex items-center justify-between">
								{errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
								<p className="ml-auto text-xs text-zinc-500">
									{formData.bio.length}/500
								</p>
							</div>
						</div>
					</div>

					<div className="mt-8 flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							Hủy
						</button>
						<button
							type="submit"
							disabled={loading}
							className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
						>
							{loading ? 'Đang lưu...' : 'Lưu thay đổi'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

