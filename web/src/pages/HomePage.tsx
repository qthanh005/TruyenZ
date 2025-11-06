import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Story = { id: string; title: string; cover?: string; genres?: string[]; rating?: number; description?: string };

export default function HomePage() {
    const [items, setItems] = useState<Story[]>([]);
    const [hotItems, setHotItems] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        // Mock data
        const mock: Story[] = [
            { id: '1', title: 'Đại Chúa Tể', cover: 'https://picsum.photos/300/400?random=1', genres: ['Huyền Huyễn', 'Hành Động'] },
            { id: '2', title: 'Thám Tử Lừng Danh Conan', cover: 'https://picsum.photos/300/400?random=2', genres: ['Trinh Thám'] },
            { id: '3', title: 'One Piece', cover: 'https://picsum.photos/300/400?random=3', genres: ['Phiêu Lưu'] },
            { id: '4', title: 'Naruto', cover: 'https://picsum.photos/300/400?random=4', genres: ['Hành Động'] },
            { id: '5', title: 'Attack on Titan', cover: 'https://picsum.photos/300/400?random=5', genres: ['Hành Động', 'Kịch Tính'] },
            { id: '6', title: 'Solo Leveling', cover: 'https://picsum.photos/300/400?random=6', genres: ['Hành Động'] },
            { id: '7', title: 'Doraemon', cover: 'https://picsum.photos/300/400?random=7', genres: ['Hài Hước'] },
            { id: '8', title: 'Kimetsu no Yaiba', cover: 'https://picsum.photos/300/400?random=8', genres: ['Hành Động'] },
            { id: '9', title: 'Jujutsu Kaisen', cover: 'https://picsum.photos/300/400?random=9', genres: ['Siêu Nhiên'] },
            { id: '10', title: 'Spy x Family', cover: 'https://picsum.photos/300/400?random=10', genres: ['Gia Đình'] },
        ];
        const hot: Story[] = [
            { id: '11', title: 'Đấu Phá Thương Khung', cover: 'https://picsum.photos/96/128?random=11' },
            { id: '12', title: 'Võ Luyện Đỉnh Phong', cover: 'https://picsum.photos/96/128?random=12' },
            { id: '13', title: 'Tây Du Ký', cover: 'https://picsum.photos/96/128?random=13' },
            { id: '14', title: 'Phong Vân', cover: 'https://picsum.photos/96/128?random=14' },
            { id: '15', title: 'Yêu Thần Ký', cover: 'https://picsum.photos/96/128?random=15' },
            { id: '16', title: 'Tales of Demons and Gods', cover: 'https://picsum.photos/96/128?random=16' },
            { id: '17', title: 'The Beginning After The End', cover: 'https://picsum.photos/96/128?random=17' },
            { id: '18', title: 'Legend of the Northern Blade', cover: 'https://picsum.photos/96/128?random=18' },
            { id: '19', title: 'Kingdom', cover: 'https://picsum.photos/96/128?random=19' },
            { id: '20', title: 'Blue Lock', cover: 'https://picsum.photos/96/128?random=20' },
        ];
        const timer = setTimeout(() => {
            setItems(mock);
            setHotItems(hot);
            setLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (loading || items.length === 0) return;
        const t = setInterval(() => setSlide((s) => (s + 1) % Math.min(6, items.length)), 4000);
        return () => clearInterval(t);
    }, [loading, items.length]);

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                {!loading && items.length > 0 && (
                    <section className="space-y-3 overflow-hidden rounded-2xl border border-zinc-200 p-0 shadow-sm dark:border-zinc-800">
                        <div className="px-4 pt-4 sm:px-6">
                            <h2 className="text-xl font-semibold tracking-tight">Truyện hot</h2>
                        </div>
                        <div className="relative h-60 w-full sm:h-72 md:h-80 lg:h-96 animate-scale-in">
                            {items.slice(0, Math.min(6, items.length)).map((s, i) => (
                                <div
                                    key={s.id}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === slide ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    <Link to={`/story/${s.id}`} className="relative block h-full w-full">
                                        <img
                                            src={s.cover}
                                            alt={s.title}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                                            <div className="line-clamp-2 text-lg font-semibold text-white drop-shadow sm:text-2xl">{s.title}</div>
                                            {s.genres && (
                                                <div className="mt-1 line-clamp-1 text-xs text-zinc-200/90 sm:text-sm">{s.genres.join(', ')}</div>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                            <button
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
                                onClick={() => setSlide((s) => (s - 1 + Math.min(6, items.length)) % Math.min(6, items.length))}
                                aria-label="Prev"
                            >
                                ‹
                            </button>
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
                                onClick={() => setSlide((s) => (s + 1) % Math.min(6, items.length))}
                                aria-label="Next"
                            >
                                ›
                            </button>
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                                {Array.from({ length: Math.min(6, items.length) }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`dot h-1.5 w-6 rounded-full ${i === slide ? 'dot-active' : 'dot-inactive'}`}
                                        onClick={() => setSlide(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                <section>
                    <div className="mb-4 flex items-end justify-between">
                        <h1 className="text-2xl font-semibold tracking-tight">Truyện mới cập nhật</h1>
                        {!loading && (
                            <span className="text-xs text-zinc-500">Hiển thị {Math.min(items.length, page * pageSize)} / {items.length}</span>
                        )}
                    </div>
                    {loading ? (
                        <div className="text-sm text-zinc-500">Đang tải...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                                {items.slice((page - 1) * pageSize, page * pageSize).map((s, i) => (
                                    <Link key={s.id} to={`/story/${s.id}`} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 animate-slide-up" style={{ ['--delay' as any]: `${i * 40}ms` }}>
                                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            {s.cover ? (
                                                <img src={s.cover} alt={s.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-400">No Image</div>
                                            )}
                                            <div className="pointer-events-none absolute left-3 top-3 inline-flex rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white shadow-sm">Mới</div>
                                        </div>
                                        <div className="space-y-1 p-3">
                                            <div className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-brand">{s.title}</div>
                                            {s.genres && (
                                                <div className="truncate text-xs text-zinc-500">{s.genres.join(', ')}</div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Trước
                                </button>
                                {Array.from({ length: Math.max(1, Math.ceil(items.length / pageSize)) }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`rounded-md px-3 py-1.5 text-sm ${page === i + 1 ? 'bg-brand text-white' : 'border border-zinc-200 dark:border-zinc-800'}`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-800"
                                    onClick={() => setPage((p) => Math.min(Math.ceil(items.length / pageSize), p + 1))}
                                    disabled={page >= Math.ceil(items.length / pageSize)}
                                >
                                    Sau
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
            <aside className="space-y-4">
                <div className="rounded-xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
                    <h3 className="mb-3 text-lg font-semibold">Truyện hot</h3>
                    {loading ? (
                        <div className="text-sm text-zinc-500">Đang tải...</div>
                    ) : (
                        <div className="space-y-3">
                            {hotItems.map((s, idx) => (
                                <Link key={s.id} to={`/story/${s.id}`} className="flex items-center gap-3 rounded-md p-1 transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                    <div className="h-16 w-12 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                                        {s.cover && <img src={s.cover} alt={s.title} className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">
                                            <span className="mr-2 text-zinc-400">{idx + 1}.</span>
                                            {s.title}
                                        </div>
                                        {s.genres && <div className="truncate text-xs text-zinc-500">{s.genres.join(', ')}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}


