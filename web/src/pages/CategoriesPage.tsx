import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid3x3, Layers, Stars, Tag } from 'lucide-react';

type Category = {
	id: string;
	name: string;
	count: number;
	description: string;
	color: string;
	popularFor: string[];
};

const CATEGORIES: Category[] = [
	{
		id: 'action',
		name: 'Hành Động',
		count: 1234,
		description: 'Những trận chiến mãn nhãn, anh hùng chiến đấu đến cùng.',
		color: 'from-red-500 to-rose-500',
		popularFor: ['Đại Chúa Tể', 'Kimetsu no Yaiba'],
	},
	{
		id: 'romance',
		name: 'Tình Cảm',
		count: 856,
		description: 'Những câu chuyện tình cảm đầy cảm xúc và lãng mạn.',
		color: 'from-pink-500 to-fuchsia-500',
		popularFor: ['Our Beloved Summer', 'Yours Truly'],
	},
	{
		id: 'fantasy',
		name: 'Huyền Huyễn',
		count: 2341,
		description: 'Thế giới ma pháp, thần khí và những truyền thuyết kỳ bí.',
		color: 'from-purple-500 to-indigo-500',
		popularFor: ['Đấu Phá Thương Khung', 'Hắc Ám Tây Du'],
	},
	{
		id: 'mystery',
		name: 'Trinh Thám',
		count: 567,
		description: 'Các vụ án hóc búa và chân tướng bất ngờ.',
		color: 'from-sky-500 to-blue-500',
		popularFor: ['Conan', 'Death Note'],
	},
	{
		id: 'comedy',
		name: 'Hài Hước',
		count: 789,
		description: 'Tiếng cười sảng khoái và những tình huống vui nhộn.',
		color: 'from-amber-500 to-orange-500',
		popularFor: ['Doraemon', 'Spy x Family'],
	},
	{
		id: 'drama',
		name: 'Kịch Tính',
		count: 654,
		description: 'Căng thẳng đỉnh điểm, cảm xúc mãnh liệt.',
		color: 'from-orange-500 to-red-500',
		popularFor: ['Attack on Titan', 'Tokyo Revengers'],
	},
	{
		id: 'adventure',
		name: 'Phiêu Lưu',
		count: 432,
		description: 'Hành trình khám phá vùng đất mới và những bí ẩn.',
		color: 'from-emerald-500 to-teal-500',
		popularFor: ['One Piece', 'Hunter x Hunter'],
	},
	{
		id: 'horror',
		name: 'Kinh Dị',
		count: 321,
		description: 'Rùng rợn, ám ảnh, những câu chuyện ma quái.',
		color: 'from-gray-700 to-gray-900',
		popularFor: ['Junji Ito Collection'],
	},
	{
		id: 'sci-fi',
		name: 'Khoa Học Viễn Tưởng',
		count: 543,
		description: 'Công nghệ tương lai, vũ trụ và giả tưởng khoa học.',
		color: 'from-cyan-500 to-sky-500',
		popularFor: ['Steins;Gate', 'Psycho-Pass'],
	},
	{
		id: 'slice-of-life',
		name: 'Đời Thường',
		count: 678,
		description: 'Những câu chuyện mộc mạc, gần gũi đời sống hằng ngày.',
		color: 'from-teal-500 to-emerald-500',
		popularFor: ['Barakamon', 'March Comes in Like a Lion'],
	},
	{
		id: 'supernatural',
		name: 'Siêu Nhiên',
		count: 890,
		description: 'Thế giới song song, linh hồn và phép thuật.',
		color: 'from-indigo-500 to-violet-500',
		popularFor: ['Bleach', 'Jujutsu Kaisen'],
	},
	{
		id: 'sports',
		name: 'Thể Thao',
		count: 234,
		description: 'Tinh thần đồng đội và đam mê cháy bỏng.',
		color: 'from-lime-500 to-green-500',
		popularFor: ['Haikyuu!!', 'Kuroko\'s Basketball'],
	},
];

const TAGS = [
	{ key: 'top', label: 'Thịnh hành' },
	{ key: 'new', label: 'Mới cập nhật' },
	{ key: 'classic', label: 'Kinh điển' },
	{ key: 'short', label: 'Ngắn tập' },
	{ key: 'long', label: 'Dài kỳ' },
];

export default function CategoriesPage() {
	const [activeTag, setActiveTag] = useState<string>('top');

	const highlighted = useMemo(() => CATEGORIES.slice(0, 3), []);
	const remaining = useMemo(() => CATEGORIES.slice(3), []);

	return (
		<div className="space-y-10">
			<section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-brand to-brand/80 p-8 text-white shadow-lg dark:border-zinc-800">
				<div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
				<div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
							<Grid3x3 size={16} />
							Thể loại
						</div>
						<h1 className="mt-4 text-3xl font-semibold md:text-4xl">Khám phá kho truyện theo gu của bạn</h1>
						<p className="mt-3 max-w-2xl text-sm text-white/85">
							Lọc truyện theo từng thể loại, từ phiêu lưu kỳ ảo đến đời thường nhẹ nhàng. Thư viện được cập nhật liên tục mỗi ngày để bạn luôn có lựa chọn mới.
						</p>
					</div>
					<div className="rounded-3xl bg-white/10 p-6 text-sm text-white/80 backdrop-blur">
						<span className="text-xs uppercase tracking-wide text-white/60">Gợi ý</span>
						<p className="mt-2">
							Đánh dấu thể loại yêu thích để nhận thông báo khi có truyện mới ra mắt. Bạn có thể theo dõi nhiều thể loại cùng lúc.
						</p>
					</div>
				</div>
				<div className="relative mt-6 flex flex-wrap gap-2 text-xs">
					{TAGS.map((tag) => (
						<button
							key={tag.key}
							onClick={() => setActiveTag(tag.key)}
							className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 transition ${
								activeTag === tag.key
									? 'border-white bg-white/15 text-white shadow-sm'
									: 'border-white/50 text-white/80 hover:border-white hover:text-white'
							}`}
						>
							<Tag size={14} />
							{tag.label}
						</button>
					))}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{highlighted.map((category) => (
					<Link
						key={category.id}
						to={`/categories/${category.id}`}
						className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`} />
						<div className="relative space-y-3 p-6">
							<div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white">
								<Layers size={14} />
								Top lựa chọn
							</div>
							<h2 className="text-lg font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
								{category.name}
							</h2>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">{category.description}</p>
							<div className="flex flex-wrap gap-2 text-xs text-zinc-500">
								{category.popularFor.map((title) => (
									<span key={title} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
										{title}
									</span>
								))}
							</div>
							<div className="mt-3 text-xs font-medium text-zinc-500">
								{category.count.toLocaleString('vi-VN')} truyện
							</div>
						</div>
					</Link>
				))}
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Khám phá tất cả thể loại</h2>
						<p className="text-sm text-zinc-500">Chọn thể loại phù hợp với mood hiện tại của bạn.</p>
					</div>
					<button className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-brand/40 hover:text-brand dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand/50 dark:hover:text-brand">
						<Stars size={14} />
						Giới thiệu cho tôi
					</button>
				</div>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{remaining.map((category) => (
						<Link
							key={category.id}
							to={`/categories/${category.id}`}
							className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
						>
							<div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 transition group-hover:opacity-15`} />
							<div className="relative space-y-2">
								<div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
									<Grid3x3 size={12} />
									Thể loại
								</div>
								<h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-brand dark:text-white">
									{category.name}
								</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400">{category.description}</p>
								<div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
									{category.popularFor.slice(0, 2).map((title) => (
										<span key={title} className="rounded-full bg-white px-2 py-0.5 shadow-sm dark:bg-zinc-800">
											{title}
										</span>
									))}
								</div>
								<div className="pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
									{category.count.toLocaleString('vi-VN')} truyện
								</div>
							</div>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
