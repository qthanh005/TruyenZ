import { useCallback, useRef, useState } from 'react';

import { crawlerConfig } from '../../shared/config/env';

type CrawlType = 'title' | 'images';

const formatTimestamp = () => `[${new Date().toLocaleTimeString()}]`;

export default function AdminCrawler() {
	const [crawlUrl, setCrawlUrl] = useState('');
	const [crawlType, setCrawlType] = useState<CrawlType>('title');
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const controllerRef = useRef<AbortController | null>(null);

	const appendLog = useCallback((message: string) => {
		setLogs((prev) => [...prev, `${formatTimestamp()} ${message}`]);
	}, []);

	const appendCrawlerLogs = useCallback((lines: string[]) => {
		if (!lines || lines.length === 0) return;
		setLogs((prev) => [
			...prev,
			...lines
				.map((line) => line.trim())
				.filter((line) => line.length > 0)
				.map((line) => `${formatTimestamp()} [Crawler] ${line}`),
		]);
	}, []);

	const handleStartCrawl = useCallback(async () => {
		const url = crawlUrl.trim();
		if (!url) {
			alert('Vui lòng nhập URL');
			return;
		}

		if (crawlType === 'images') {
			appendLog('Chức năng crawl ảnh chương hiện chưa được hỗ trợ từ giao diện.');
			return;
		}

		setIsRunning(true);
		appendLog(`Bắt đầu crawl ${crawlType} từ: ${url}`);
		appendLog('Đang gửi yêu cầu tới crawler server...');

		const controller = new AbortController();
		controllerRef.current = controller;

		try {
			const response = await fetch(`${crawlerConfig.apiBaseUrl}/api/crawl`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url, type: crawlType }),
				signal: controller.signal,
			});

			const rawBody = await response.text();
			let payload: Record<string, unknown> = {};
			try {
				payload = rawBody ? JSON.parse(rawBody) : {};
			} catch (parseError) {
				console.warn('Không thể parse JSON từ crawler:', parseError);
			}

			const logs = Array.isArray(payload.logs) ? (payload.logs as string[]) : [];
			if (logs.length > 0) {
				appendCrawlerLogs(logs);
			}

			if (!response.ok) {
				const errorMessage =
					(typeof payload.error === 'string' && payload.error.trim().length > 0
						? payload.error
						: rawBody?.trim()) || `Máy chủ trả về mã ${response.status}`;
				throw new Error(errorMessage);
			}

			appendLog('Hoàn thành quá trình crawl.');
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				appendLog('Đã huỷ crawl theo yêu cầu.');
			} else {
				const message = error instanceof Error ? error.message : 'Lỗi không xác định';
				appendLog(`Lỗi: ${message}`);
			}
		} finally {
			controllerRef.current = null;
			setIsRunning(false);
		}
	}, [appendCrawlerLogs, appendLog, crawlType, crawlUrl]);

	const handleCancel = useCallback(() => {
		if (controllerRef.current) {
			controllerRef.current.abort();
			controllerRef.current = null;
			appendLog('Đang gửi tín hiệu huỷ tới crawler...');
		}
	}, [appendLog]);

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
									onChange={(e) => setCrawlType(e.target.value as CrawlType)}
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
									onChange={(e) => setCrawlType(e.target.value as CrawlType)}
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
								onClick={handleCancel}
								className="rounded-lg border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
							>
								Huỷ crawl
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
							<div key={idx} className="mb-1 whitespace-pre-wrap">
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
						<strong>Crawl thông tin truyện:</strong> Gửi yêu cầu chạy script Python `crawl_title.py`
					</li>
					<li>
						<strong>Crawl ảnh chương:</strong> Tính năng từ giao diện đang được chuẩn bị
					</li>
					<li>Đảm bảo URL hợp lệ từ truyenqqgo.com</li>
					<li>Quá trình crawl có thể mất vài phút tùy thuộc vào số lượng dữ liệu</li>
				</ul>
			</div>
		</div>
	);
}
