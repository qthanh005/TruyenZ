import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';

type UploadAvatarModalProps = {
	isOpen: boolean;
	onClose: () => void;
	currentAvatarUrl?: string;
	onUpdate: () => void;
};

export default function UploadAvatarModal({ isOpen, onClose, currentAvatarUrl, onUpdate }: UploadAvatarModalProps) {
	const { showToast } = useToast();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			showToast('Chỉ chấp nhận file ảnh', 'error');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			showToast('File không được vượt quá 5MB', 'error');
			return;
		}

		setSelectedFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			showToast('Vui lòng chọn file ảnh', 'error');
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			// Don't set Content-Type header - let axios set it automatically with boundary
			const response = await api.post(endpoints.uploadAvatar(), formData);

			showToast('Cập nhật avatar thành công', 'success');
			onUpdate();
			onClose();
			// Reset state
			setSelectedFile(null);
			setPreview(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error: any) {
			console.error('Error uploading avatar:', error);
			const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi upload avatar';
			showToast(errorMessage, 'error');
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm('Bạn có chắc chắn muốn xóa avatar?')) {
			return;
		}

		setUploading(true);
		try {
			await api.delete(endpoints.deleteAvatar());
			showToast('Đã xóa avatar', 'success');
			onUpdate();
			onClose();
			setSelectedFile(null);
			setPreview(null);
		} catch (error: any) {
			console.error('Error deleting avatar:', error);
			const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi xóa avatar';
			showToast(errorMessage, 'error');
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		if (!uploading) {
			setSelectedFile(null);
			setPreview(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			onClose();
		}
	};

	if (!isOpen) return null;

	const displayPreview = preview || currentAvatarUrl;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
			<div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
					<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Cập nhật avatar</h2>
					<button
						onClick={handleClose}
						disabled={uploading}
						className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-6">
					{/* Preview */}
					<div className="mb-6 flex flex-col items-center">
						<div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
							{displayPreview ? (
								<img
									src={displayPreview}
									alt="Avatar preview"
									className="h-full w-full object-cover"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.style.display = 'none';
									}}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center">
									<ImageIcon size={48} className="text-zinc-400" />
								</div>
							)}
						</div>
						<p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
							{selectedFile ? 'Ảnh mới' : currentAvatarUrl ? 'Ảnh hiện tại' : 'Chưa có avatar'}
						</p>
					</div>

					{/* File Input */}
					<div className="mb-6">
						<label
							htmlFor="avatar-upload"
							className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 transition hover:border-brand hover:bg-brand/5 dark:border-zinc-700 dark:bg-zinc-900"
						>
							<Upload size={32} className="mb-2 text-zinc-400" />
							<p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
								{selectedFile ? selectedFile.name : 'Chọn ảnh đại diện'}
							</p>
							<p className="text-xs text-zinc-500 dark:text-zinc-400">
								PNG, JPG, GIF tối đa 5MB
							</p>
							<input
								ref={fileInputRef}
								id="avatar-upload"
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
								disabled={uploading}
							/>
						</label>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-3">
						{currentAvatarUrl && (
							<button
								type="button"
								onClick={handleDelete}
								disabled={uploading}
								className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
							>
								<Trash2 size={16} />
								Xóa avatar
							</button>
						)}
						<button
							type="button"
							onClick={handleClose}
							disabled={uploading}
							className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
						>
							Hủy
						</button>
						<button
							type="button"
							onClick={handleUpload}
							disabled={uploading || !selectedFile}
							className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
						>
							{uploading ? 'Đang upload...' : 'Cập nhật'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

