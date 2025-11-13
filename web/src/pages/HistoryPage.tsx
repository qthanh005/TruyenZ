import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, History, TrendingUp } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';

type HistoryItem = {
	storyId: string;
	storyTitle: string;
	cover?: string;
	chapterId: string;
	chapterTitle: string;
	lastRead: string;
	progress?: number;
	isTrending?: boolean;
	updatedAt?: string;
};

const historyItems: HistoryItem[] = [
	{
		storyId: '1',
		storyTitle: 'Đại Chúa Tể',
		cover: 'https://picsum.photos/300/400?random=11',
		chapterId: '101',
		chapterTitle: 'Chương 101: Khởi đầu mới',
		lastRead: 'Hôm nay • 14:32',
		progress: 62,
		isTrending: true,
		updatedAt: 'Cập nhật 10 phút trước',
	},
	{
		storyId: '2',
		storyTitle: 'Thám Tử Lừng Danh Conan',
		cover: 'https://picsum.photos/300/400?random=12',
		chapterId: '45',
		chapterTitle: 'Chương 45: Vụ án bí ẩn',
		lastRead: 'Hôm nay • 09:18',
		progress: 84,
		updatedAt: 'Cập nhật 2 giờ trước',
	},
	{
		storyId: '3',
		storyTitle: 'One Piece',
		cover: 'https://picsum.photos/300/400?random=13',
		chapterId: '1050',
		chapterTitle: 'Chương 1050: Hành trình tiếp tục',
		lastRead: 'Hôm qua • 22:45',
		progress: 38,
		updatedAt: 'Cập nhật 1 ngày trước',
	},
	{
		storyId: '4',
		storyTitle: 'Kimetsu no Yaiba',
		cover: 'https://picsum.photos/300/400?random=14',
		chapterId: '87',
		chapterTitle: 'Chương 87: Hơi thở mặt trời',
		lastRead: '2 ngày trước',
		progress: 95,
		updatedAt: 'Cập nhật 2 ngày trước',
	},
];

export default function HistoryPage() {
	const { isAuthenticated } = useAuth();

	const stats = useMemo(
		() => [
			{
				label: 'Truyện đang đọc',
				value: historyItems.length,
				icon: BookOpen,
				theme: 'from-emerald-500 via-teal-500 to-sky-500',
				subtext: 'Tiếp tục hành trình đang dang dở.',
			},
			{
				label: 'Tổng chương đã đọc',
				value: 126,
				icon: History,
				theme: 'from-violet-500 via-purple-500 to-indigo-500',
				subtext: 'Ghi nhớ xuyên suốt giữa các thiết bị.',
			},
			{
				label: 'Thời gian đọc tuần này',
				value: '18h 24m',
				icon: Clock,
				theme: 'from-amber-500 via-orange-500 to-red-500',
				subtext: 'Bạn đang duy trì chuỗi 6 ngày liên tiếp!',
			},
		],
		[]
	);

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
					<History size={28} />
				</div>
				<h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">Đăng nhập để xem lịch sử</h2>
				<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
					Chúng tôi sẽ đồng bộ lịch sử đọc truyện trên mọi thiết bị khi bạn đăng nhập.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-b from-brand/40 to-brand/10 blur-3xl" />
				<div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-50 backdrop-blur">
							<History size={16} />
							Lịch sử đọc
						</div>
						<h1 className="mt-4 text-3xl font-semibold md:text-4xl">Tiếp tục hành trình đọc truyện của bạn</h1>
						<p className="mt-3 max-w-2xl text-sm text-zinc-200">
							Chúng tôi lưu lại mọi chương truyện bạn đã đọc để bạn có thể quay lại bất kỳ lúc nào, trên mọi thiết bị.
						</p>
					</div>
					<button className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
						Xoá lịch sử
					</button>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{stats.map(({ label, value, icon: Icon, theme, subtext }) => (
					<div
						key={label}
						className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className={`absolute inset-0 bg-gradient-to-br ${theme} opacity-10`} />
						<div className="relative flex items-start gap-4">
							<div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-inset ring-zinc-100 dark:bg-zinc-900 dark:text-brand">
								<Icon size={22} />
							</div>
							<div>
								<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
								<p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
								<p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{subtext}</p>
							</div>
						</div>
					</div>
				))}
			</section>

			<section className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Nhật ký đọc gần đây</h2>
						<p className="mt-1 text-sm text-zinc-500">Sắp xếp theo thời gian, cập nhật liên tục.</p>
					</div>
					<div className="flex gap-2 text-xs font-medium">
						<button className="rounded-full bg-brand/10 px-4 py-1.5 text-brand hover:bg-brand/15">Tất cả</button>
						<button className="rounded-full px-4 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
							Hôm nay
						</button>
						<button className="rounded-full px-4 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
							Tuần này
						</button>
					</div>
				</div>

				<div className="space-y-4">
					{historyItems.map((item) => (
						<Link
							key={`${item.storyId}-${item.chapterId}`}
							to={`/story/${item.storyId}/chapter/${item.chapterId}`}
							className="group relative flex gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div className="absolute inset-y-0 left-0 w-1 rounded-full bg-brand/60 opacity-0 transition group-hover:opacity-100" />
							<div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-inner">
								<img src={item.cover} alt={item.storyTitle} className="h-full w-full object-cover" loading="lazy" />
							</div>
							<div className="flex-1">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<div>
										<h3 className="text-sm font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
											{item.storyTitle}
										</h3>
										<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.chapterTitle}</p>
									</div>
									<div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
										<Clock size={14} />
										<span>{item.lastRead}</span>
									</div>
								</div>
								<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
									<div className="flex items-center gap-1">
										<span className="font-semibold text-brand">{item.progress}%</span>
										<span>đã đọc</span>
									</div>
									{item.updatedAt && <span>{item.updatedAt}</span>}
									{item.isTrending && (
										<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
											<TrendingUp size={14} />
											Đang hot
										</span>
									)}
								</div>
								<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
									<div
										className="h-full rounded-full bg-gradient-to-r from-brand via-brand/80 to-brand/60 transition-[width]"
										style={{ width: `${item.progress}%` }}
									/>
								</div>
							</div>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
