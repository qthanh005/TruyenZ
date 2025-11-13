import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Clock, Shield, Star, User as UserIcon, Wallet } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { mockBookmarks, mockHistory } from '@/shared/mocks';
import { useWalletStore } from '@/shared/stores/walletStore';

type BookmarkItem = {
	id: string;
	title: string;
	cover?: string;
	lastChapter?: string;
};

type HistoryItem = {
	id: string;
	title: string;
	lastReadAt?: string;
	progress?: string;
};

const gradientPalette = [
	'from-violet-500 via-fuchsia-500 to-rose-500',
	'from-emerald-500 via-teal-500 to-sky-500',
	'from-amber-500 via-orange-500 to-rose-500',
	'from-blue-500 via-indigo-500 to-violet-500',
	'from-cyan-500 via-sky-500 to-purple-500',
];

function pickGradient(key: string | undefined) {
	if (!key) return gradientPalette[0];
	const index =
		key
			.split('')
			.map((char) => char.charCodeAt(0))
			.reduce((sum, current) => sum + current, 0) % gradientPalette.length;
	return gradientPalette[index];
}

function uppercaseInitials(name: string) {
	if (!name) return '?';
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfilePage() {
	const { user } = useAuth();
	const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const balance = useWalletStore((state) => state.balance);
	const openTopUp = useWalletStore((state) => state.open);

	useEffect(() => {
		const timer = setTimeout(() => {
			setBookmarks(
				mockBookmarks.map((item, index) => ({
					...item,
					cover: `https://picsum.photos/seed/bookmark-${index}/200/260`,
					lastChapter: `Chương ${index + 5}`,
				}))
			);
			setHistory(
				mockHistory.map((item, index) => ({
					...item,
					progress: `Đọc ${50 + index * 10}%`,
					lastReadAt: new Date(Date.now() - index * 36_00_000).toLocaleString('vi-VN'),
				}))
			);
		}, 300);
		return () => clearTimeout(timer);
	}, [user]);

	const displayName =
		user?.profile?.name ||
		user?.profile?.preferred_username ||
		user?.username ||
		user?.name ||
		'Độc giả Truyenz';
	const displayEmail = user?.profile?.email || user?.email || 'Chưa cập nhật email';
	const role = user?.profile?.role || user?.role || 'Thành viên';

	const heroGradient = useMemo(() => pickGradient(user?.id || displayName), [user?.id, displayName]);
	const initials = useMemo(() => uppercaseInitials(displayName), [displayName]);
	const joinedAt = useMemo(
		() =>
			new Date(Date.now() - 96_000_000).toLocaleDateString('vi-VN', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}),
		[]
	);

	const stats = useMemo(
		() => [
			{
				label: 'Truyện đã lưu',
				value: bookmarks.length,
				icon: Bookmark,
				theme: 'bg-emerald-500/10 text-emerald-500',
				subtext: 'Tất cả truyện đã bookmark',
			},
			{
				label: 'Chương đã đọc',
				value: history.length * 7,
				icon: Clock,
				theme: 'bg-sky-500/10 text-sky-500',
				subtext: 'Số chương gần đây đã hoàn thành',
			},
			{
				label: 'Đánh giá',
				value: '4.8/5',
				icon: Star,
				theme: 'bg-amber-500/10 text-amber-500',
				subtext: 'Điểm trung bình đóng góp cộng đồng',
			},
			{
				label: 'Quyền hạn',
				value: role,
				icon: Shield,
				theme: 'bg-violet-500/10 text-violet-500',
				subtext: 'Vai trò hiện tại trên hệ thống',
			},
			{
				label: 'Số dư ví',
				value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(balance),
				icon: Wallet,
				theme: 'bg-rose-500/10 text-rose-500',
				subtext: 'Dùng để mua truyện premium',
			},
		],
		[bookmarks.length, history.length, role, balance]
	);

	const siteHighlights = [
		{
			title: 'Trải nghiệm đọc mượt mà',
			description:
				'Hệ thống hiển thị nhanh, hỗ trợ đọc mọi lúc với chế độ tối, ghi nhớ lịch sử xuyên suốt giữa các thiết bị.',
		},
		{
			title: 'Cộng đồng sôi động',
			description:
				'Tham gia thảo luận, chia sẻ cảm nhận và góp ý cải thiện chất lượng bản dịch cùng hàng nghìn độc giả khác.',
		},
		{
			title: 'Theo dõi sát sao',
			description: 'Bookmark truyện yêu thích, nhận thông báo ngay khi chương mới được cập nhật.',
		},
	];

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className={`absolute inset-0 bg-gradient-to-r ${heroGradient} opacity-90 blur-3xl`} />
				<div className="relative grid gap-8 p-8 md:grid-cols-[auto,1fr] md:gap-12 md:p-12">
					<div className="flex flex-col items-center gap-4 md:items-start">
						<div className="relative">
							<div className="grid h-32 w-32 place-items-center rounded-full bg-white/90 text-3xl font-semibold text-zinc-900 shadow-lg ring-4 ring-white/50 dark:bg-zinc-900 dark:text-white dark:ring-zinc-800">
								{initials}
							</div>
							<div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
								<UserIcon size={20} />
							</div>
						</div>
						<button className="rounded-full border border-white/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/10 dark:border-zinc-700 dark:text-zinc-200">
							Cập nhật avatar
						</button>
					</div>

					<div className="flex flex-col justify-center gap-6">
						<div>
							<h1 className="text-3xl font-semibold text-white drop-shadow-sm">{displayName}</h1>
							<div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-100/90">
								<span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
									{role}
								</span>
								<span>{displayEmail}</span>
								<span className="hidden md:inline-block">•</span>
								<span>Tham gia từ {joinedAt}</span>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800">
								Chỉnh sửa hồ sơ
							</button>
							<button className="rounded-full border border-white/60 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10 dark:border-zinc-700 dark:text-zinc-200">
								Quản lý bảo mật
							</button>
							<button
								className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500/30"
								onClick={() => openTopUp()}
							>
								<Wallet size={16} />
								Nạp thêm tiền
							</button>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{stats.map(({ icon: Icon, label, value, theme, subtext }) => (
					<div
						key={label}
						className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
					>
						<div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${theme}`}>
							<Icon size={18} />
							<span>{label}</span>
						</div>
						<div className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">{value}</div>
						<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtext}</p>
					</div>
				))}
			</section>

			<section className="grid gap-8 lg:grid-cols-2">
				<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Bookmark yêu thích</h2>
						<button className="text-sm text-brand hover:underline">Xem tất cả</button>
					</div>
					<div className="mt-6 grid gap-4">
						{bookmarks.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								Bạn chưa lưu truyện nào. Hãy khám phá trang chủ và tìm cho mình bộ truyện yêu thích!
							</div>
						) : (
							bookmarks.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:border-brand/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand/60"
								>
									<div className="h-20 w-16 overflow-hidden rounded-xl bg-zinc-200 shadow-inner">
										<img
											src={item.cover}
											alt={item.title}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
											{item.title}
										</h3>
										<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.lastChapter}</p>
									</div>
									<button className="rounded-full bg-white px-4 py-1 text-xs font-medium text-brand shadow-sm transition hover:bg-brand/10 dark:bg-zinc-800 dark:text-brand dark:hover:bg-brand/20">
										Tiếp tục đọc
									</button>
								</div>
							))
						)}
					</div>
				</div>

				<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Lịch sử gần đây</h2>
						<button className="text-sm text-brand hover:underline">Quản lý lịch sử</button>
					</div>
					<div className="mt-6 space-y-4">
						{history.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
								Chưa có lịch sử đọc. Bắt đầu chương mới và hệ thống sẽ tự động lưu lại cho bạn.
							</div>
						) : (
							history.map((item) => (
								<div
									key={item.id}
									className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition hover:border-brand/50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand/60"
								>
									<div className="flex items-center justify-between gap-4">
										<div>
											<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
											<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
												{item.progress} • Cập nhật lúc {item.lastReadAt}
											</p>
										</div>
										<button className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-brand/50 hover:text-brand dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand/60 dark:hover:text-brand">
											Đọc tiếp
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-8 shadow-sm dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Vì sao chọn Truyenz?</h2>
				<div className="mt-6 grid gap-6 md:grid-cols-3">
					{siteHighlights.map((item) => (
						<div
							key={item.title}
							className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80"
						>
							<h3 className="text-base font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
							<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

