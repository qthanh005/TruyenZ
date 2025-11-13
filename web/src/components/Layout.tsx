import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { TopUpModal } from '@/components/payments/TopUpModal';

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
			<Navbar />
			<main className="mx-auto max-w-7xl px-4 pb-12 pt-6">{children}</main>
			<footer className="border-t border-zinc-200 dark:border-zinc-800">
				<div className="mx-auto max-w-7xl px-4 py-8">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div>
							<div className="text-lg font-semibold">TruyệnZ</div>
							<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
								Nền tảng đọc truyện mô phỏng (demo) dùng dữ liệu mock để minh hoạ giao diện và luồng trải nghiệm trước khi kết nối backend.
							</p>
						</div>
						<div>
							<div className="text-sm font-semibold">Điều hướng</div>
							<div className="mt-2 flex flex-col gap-1 text-sm">
								<Link to="/" className="hover:underline">Trang chủ</Link>
								<Link to="/me" className="hover:underline">Tài khoản</Link>
							</div>
						</div>
						<div>
							<div className="text-sm font-semibold">Liên hệ</div>
							<div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
								<div>Email: contact@example.com</div>
								<div>Facebook: facebook.com/yourpage</div>
							</div>
						</div>
					</div>
					<div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex sm.items-center sm:justify-between">
						<div>© {new Date().getFullYear()} TruyệnZ. All rights reserved.</div>
						<div>Thiết kế & phát triển: Lê Quang Thành - 52300064</div>
					</div>
				</div>
			</footer>
			<TopUpModal />
		</div>
	);
}

