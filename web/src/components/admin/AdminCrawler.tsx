import { useState } from 'react';

export default function AdminCrawler() {
	const [crawlUrl, setCrawlUrl] = useState('');
	const [crawlType, setCrawlType] = useState<'title' | 'images'>('title');
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);

	const handleStartCrawl = () => {
		if (!crawlUrl.trim()) {
			alert('Vui lòng nhập URL');
			return;
		}

		setIsRunning(true);
		setLogs([...logs, `[${new Date().toLocaleTimeString()}] Bắt đầu crawl ${crawlType} từ: ${crawlUrl}`]);

		// Mock crawl process
		setTimeout(() => {
			setLogs((prev) => [
				...prev,
				`[${new Date().toLocaleTimeString()}] Đang phân tích URL...`,
				`[${new Date().toLocaleTimeString()}] Đã tìm thấy thông tin truyện`,
				`[${new Date().toLocaleTimeString()}] Đang tải dữ liệu...`,
				`[${new Date().toLocaleTimeString()}] Hoàn thành!`,
			]);
			setIsRunning(false);
		}, 3000);
	};

	const handleStopCrawl = () => {
		setIsRunning(false);
		setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Đã dừng crawl`]);
	};

	return (
		<div className="space-y-6">
			{/* Crawler Config */}
			<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<h3 className="mb-4 text-lg font-semibold">Cấu hình Crawler</h3>
				<div className="space-y-4">
					<div>
						<label className="mb-2 block text-sm font-medium">Loại crawl</label>
						<div className="flex gap-4">
							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="crawlType"
									value="title"
									checked={crawlType === 'title'}
									onChange={(e) => setCrawlType(e.target.value as 'title' | 'images')}
									className="text-brand"
								/>
								<span className="text-sm">Crawl thông tin truyện (crawl_title.py)</span>
							</label>
							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="crawlType"
									value="images"
									checked={crawlType === 'images'}
									onChange={(e) => setCrawlType(e.target.value as 'title' | 'images')}
									className="text-brand"
								/>
								<span className="text-sm">Crawl ảnh chương (crawl_images.py)</span>
							</label>
						</div>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium">URL nguồn</label>
						<input
							type="text"
							value={crawlUrl}
							onChange={(e) => setCrawlUrl(e.target.value)}
							placeholder="https://truyenqqgo.com/truyen-tranh/..."
							className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
						/>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleStartCrawl}
							disabled={isRunning || !crawlUrl.trim()}
							className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
						>
							{isRunning ? 'Đang chạy...' : 'Bắt đầu crawl'}
						</button>
						{isRunning && (
							<button
								onClick={handleStopCrawl}
								className="rounded-lg border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
							>
								Dừng
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Logs */}
			<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Logs</h3>
					<button
						onClick={() => setLogs([])}
						className="rounded-md border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-800"
					>
						Xóa logs
					</button>
				</div>
				<div className="h-64 overflow-y-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-green-400">
					{logs.length === 0 ? (
						<div className="text-zinc-500">Chưa có logs...</div>
					) : (
						logs.map((log, idx) => (
							<div key={idx} className="mb-1">
								{log}
							</div>
						))
					)}
				</div>
			</div>

			{/* Instructions */}
			<div className="rounded-xl border border-zinc-200 bg-blue-50 p-6 dark:border-zinc-800 dark:bg-blue-900/20">
				<h3 className="mb-2 text-lg font-semibold">Hướng dẫn sử dụng</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm">
					<li>
						<strong>Crawl thông tin truyện:</strong> Sử dụng để crawl thông tin cơ bản của truyện (tên, tác giả, ảnh bìa, thể
						loại, danh sách chương)
					</li>
					<li>
						<strong>Crawl ảnh chương:</strong> Sử dụng để tải các ảnh trong chương truyện về máy chủ
					</li>
					<li>Đảm bảo URL hợp lệ từ truyenqqgo.com</li>
					<li>Quá trình crawl có thể mất vài phút tùy thuộc vào số lượng dữ liệu</li>
				</ul>
			</div>
		</div>
	);
}

