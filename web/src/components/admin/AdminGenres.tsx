import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { useConfirm } from '@/hooks/useConfirm';
import {
	Sparkles,
	Tag,
	BookOpen,
	Search,
	Filter,
	CirclePlus,
	ArrowUpRight,
	Wand2,
	CheckCircle2,
	PencilLine,
	Trash2,
} from 'lucide-react';

type Genre = {
	id: number;
	name: string;
	slug: string;
	description?: string | null;
	storyCount: number;
};

type FormState = {
	name: string;
	description: string;
};

export default function AdminGenres() {
	const confirm = useConfirm();
	const [genres, setGenres] = useState<Genre[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
	const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
	const [formState, setFormState] = useState<FormState>({ name: '', description: '' });
	const [submitting, setSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const filteredGenres = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return genres;
		return genres.filter((genre) => genre.name.toLowerCase().includes(q) || genre.slug.toLowerCase().includes(q));
	}, [genres, searchTerm]);

	const stats = useMemo(() => {
		const total = genres.length;
		const withDescription = genres.filter((genre) => genre.description && genre.description.trim().length > 0).length;
		const totalStories = genres.reduce((sum, genre) => sum + genre.storyCount, 0);
		const topGenre = genres.reduce<Genre | null>((curr, genre) => {
			if (!curr || genre.storyCount > curr.storyCount) return genre;
			return curr;
		}, null);

		return {
			total,
			withDescription,
			missingDescription: total - withDescription,
			totalStories,
			topGenreName: topGenre?.name ?? 'Chưa xác định',
		};
	}, [genres]);

	const loadGenres = async () => {
		try {
			setLoading(true);
			const response = await api.get<Genre[]>(endpoints.getAdminGenres());
			setGenres(response.data);
		} catch (error) {
			console.error('Error loading genres:', error);
			setGenres([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadGenres();
	}, []);

	const openCreateModal = () => {
		setModalMode('create');
		setSelectedGenre(null);
		setFormState({ name: '', description: '' });
	};

	const openEditModal = (genre: Genre) => {
		setModalMode('edit');
		setSelectedGenre(genre);
		setFormState({
			name: genre.name,
			description: genre.description ?? '',
		});
	};

	const closeModal = () => {
		setModalMode(null);
		setSelectedGenre(null);
		setFormState({ name: '', description: '' });
		setSubmitting(false);
	};

	const handleChange = (field: keyof FormState, value: string) => {
		setFormState((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async () => {
		if (!modalMode || submitting) return;
		const name = formState.name.trim();
		if (!name) {
			alert('Tên thể loại không được để trống');
			return;
		}
		setSubmitting(true);
		try {
			const payload = {
				name,
				description: formState.description.trim() || undefined,
			};
			if (modalMode === 'create') {
				const response = await api.post<Genre>(endpoints.createGenre(), payload);
				setGenres((prev) => [...prev, response.data]);
			} else if (selectedGenre) {
				const response = await api.put<Genre>(endpoints.updateGenre(selectedGenre.id), payload);
				setGenres((prev) => prev.map((g) => (g.id === response.data.id ? response.data : g)));
			}
			closeModal();
		} catch (error) {
			console.error('Failed to save genre:', error);
			alert('Không thể lưu thể loại. Vui lòng thử lại.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteGenre = async (genre: Genre) => {
		const confirmed = await confirm.confirm(
			`Bạn có chắc chắn muốn xóa thể loại "${genre.name}"? Thể loại sẽ bị xóa khỏi tất cả truyện.`,
			'danger',
			'Xác nhận xóa thể loại'
		);
		if (!confirmed) return;
		try {
			await api.delete(endpoints.deleteGenre(genre.id));
			setGenres((prev) => prev.filter((g) => g.id !== genre.id));
		} catch (error) {
			console.error('Failed to delete genre:', error);
			alert('Không thể xóa thể loại. Vui lòng thử lại.');
		}
	};

	return (
		<div className="space-y-6">
			<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 p-6 text-white shadow-lg">
				<div className="absolute inset-0 opacity-40">
					<div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-brand blur-3xl" />
					<div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-purple-500 blur-3xl" />
				</div>
				<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-white/60">Genre Intelligence</p>
						<h2 className="mt-3 text-3xl font-semibold">Quản lý thể loại</h2>
						<p className="mt-2 max-w-xl text-white/80">Nắm bắt cấu trúc nội dung và tối ưu danh mục truyện trong một bảng điều khiển duy nhất.</p>
						<div className="mt-6 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
								<p className="text-xs uppercase tracking-wide text-white/70">Tổng thể loại</p>
								<p className="mt-2 text-3xl font-semibold">{stats.total}</p>
								<p className="text-xs text-white/70">Đang hoạt động</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
								<p className="text-xs uppercase tracking-wide text-white/70">Truyện được gán</p>
								<p className="mt-2 text-3xl font-semibold">{stats.totalStories}</p>
								<p className="text-xs text-white/70">
									Nhiều nhất: <span className="font-medium">{stats.topGenreName}</span>
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
								<p className="text-xs uppercase tracking-wide text-white/70">Mô tả đầy đủ</p>
								<p className="mt-2 text-3xl font-semibold">{stats.withDescription}</p>
								<p className="text-xs text-white/70">{stats.missingDescription} thiếu mô tả</p>
							</div>
						</div>
					</div>
					<div className="grid w-full max-w-md gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-white backdrop-blur">
						<button
							onClick={openCreateModal}
							className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:bg-white/20"
						>
							<div>
								<p className="text-sm font-semibold">Thêm thể loại mới</p>
								<p className="text-xs text-white/70">Đồng bộ slug & mô tả</p>
							</div>
							<CirclePlus className="h-5 w-5" />
						</button>
						<button className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-white/80 transition hover:bg-white/10">
							<div>
								<p className="text-sm font-semibold">Tối ưu slug</p>
								<p className="text-xs text-white/70">Tuân thủ chuẩn SEO</p>
							</div>
							<ArrowUpRight className="h-5 w-5" />
						</button>
						<button className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-white/80 transition hover:bg-white/10">
							<div>
								<p className="text-sm font-semibold">Gợi ý mô tả</p>
								<p className="text-xs text-white/70">AI đề xuất nội dung</p>
							</div>
							<Wand2 className="h-5 w-5" />
						</button>
					</div>
				</div>
			</section>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
					<Search className="h-4 w-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Tìm theo tên hoặc slug..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
					/>
					<button className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
						<Filter className="h-4 w-4" />
						Bộ lọc
					</button>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={openCreateModal}
						className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90"
					>
						<Sparkles className="h-4 w-4" />
						Thêm thể loại
					</button>
				</div>
			</div>

			{loading ? (
				<div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 text-center text-zinc-500 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
					Đang tải dữ liệu thể loại...
				</div>
			) : filteredGenres.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
					Không tìm thấy thể loại nào. Hãy thử từ khóa khác hoặc tạo mới.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					{filteredGenres.map((genre) => (
						<div key={genre.id} className="group rounded-3xl border border-zinc-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
							<div className="flex items-start justify-between">
								<div>
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
										<Tag className="h-3 w-3" />
										{genre.slug}
									</div>
									<h4 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">{genre.name}</h4>
									<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
										{genre.description || 'Chưa có mô tả cho thể loại này.'}
									</p>
								</div>
								<span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
									ID #{genre.id}
								</span>
							</div>
							<div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
								<span className="inline-flex items-center gap-1 font-medium">
									<BookOpen className="h-3.5 w-3.5" />
									{genre.storyCount} truyện
								</span>
								<span className={`inline-flex items-center gap-1 ${genre.description ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
									{genre.description ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />}
									{genre.description ? 'Mô tả đầy đủ' : 'Cần mô tả'}
								</span>
							</div>
							<div className="mt-4 flex items-center justify-between">
								<div className="text-xs text-zinc-400">Quản lý qua API story-service</div>
								<div className="flex gap-2">
									<button
										onClick={() => openEditModal(genre)}
										className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
									>
										<PencilLine className="h-3.5 w-3.5" />
										Sửa
									</button>
									<button
										onClick={() => handleDeleteGenre(genre)}
										className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
									>
										<Trash2 className="h-3.5 w-3.5" />
										Xóa
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{modalMode && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl ring-1 ring-black/10 dark:border-zinc-800 dark:bg-zinc-900">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{modalMode === 'create' ? 'Create' : 'Update'}</p>
								<h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
									{modalMode === 'create' ? 'Thêm thể loại mới' : `Chỉnh sửa: ${selectedGenre?.name}`}
								</h3>
								<p className="mt-1 text-sm text-zinc-500">Slug sẽ được hệ thống tự động gợi ý dựa trên tên của bạn.</p>
							</div>
						</div>
						<div className="mt-6 space-y-5">
							<div>
								<label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Tên thể loại *</label>
								<div className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
									<input
										type="text"
										value={formState.name}
										onChange={(e) => handleChange('name', e.target.value)}
										placeholder="Ví dụ: Huyền Huyễn, Võ Hiệp..."
										className="w-full border-none bg-transparent text-sm outline-none placeholder:text-zinc-400"
									/>
								</div>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Mô tả (không bắt buộc)</label>
								<div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
									<textarea
										rows={4}
										value={formState.description}
										onChange={(e) => handleChange('description', e.target.value)}
										placeholder="Giới thiệu ngắn gọn để người đọc hiểu rõ hơn về thể loại này..."
										className="w-full border-none bg-transparent text-sm outline-none placeholder:text-zinc-400"
									/>
								</div>
							</div>
						</div>
						<div className="mt-6 flex items-center justify-between">
							<div className="text-xs text-zinc-400">* Bắt buộc. Có thể chỉnh sửa bất cứ lúc nào.</div>
							<div className="flex gap-2">
								<button
									onClick={closeModal}
									className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
									disabled={submitting}
								>
									Hủy
								</button>
								<button
									onClick={handleSubmit}
									disabled={submitting}
									className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90 disabled:opacity-50"
								>
									{submitting ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo thể loại' : 'Lưu thay đổi'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


