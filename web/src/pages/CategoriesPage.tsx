import { Link } from 'react-router-dom';
import { Grid3x3 } from 'lucide-react';

const categories = [
    { id: 'action', name: 'Hành Động', count: 1234, color: 'bg-red-500' },
    { id: 'romance', name: 'Tình Cảm', count: 856, color: 'bg-pink-500' },
    { id: 'fantasy', name: 'Huyền Huyễn', count: 2341, color: 'bg-purple-500' },
    { id: 'mystery', name: 'Trinh Thám', count: 567, color: 'bg-blue-500' },
    { id: 'comedy', name: 'Hài Hước', count: 789, color: 'bg-yellow-500' },
    { id: 'drama', name: 'Kịch Tính', count: 654, color: 'bg-orange-500' },
    { id: 'adventure', name: 'Phiêu Lưu', count: 432, color: 'bg-green-500' },
    { id: 'horror', name: 'Kinh Dị', count: 321, color: 'bg-gray-700' },
    { id: 'sci-fi', name: 'Khoa Học Viễn Tưởng', count: 543, color: 'bg-cyan-500' },
    { id: 'slice-of-life', name: 'Đời Thường', count: 678, color: 'bg-teal-500' },
    { id: 'supernatural', name: 'Siêu Nhiên', count: 890, color: 'bg-indigo-500' },
    { id: 'sports', name: 'Thể Thao', count: 234, color: 'bg-lime-500' },
];

export default function CategoriesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Grid3x3 className="h-6 w-6 text-brand" />
                <h1 className="text-3xl font-bold">Thể loại</h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
                Khám phá truyện theo thể loại yêu thích của bạn
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        to={`/categories/${category.id}`}
                        className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className={`absolute inset-0 ${category.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                        <div className="relative z-10 text-center">
                            <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${category.color} text-white`}>
                                <span className="text-xl font-bold">{category.name.charAt(0)}</span>
                            </div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</div>
                            <div className="mt-1 text-sm text-zinc-500">{category.count} truyện</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

