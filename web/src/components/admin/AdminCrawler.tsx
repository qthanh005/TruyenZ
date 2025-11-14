import { useCallback, useRef, useState } from 'react';

import { crawlerConfig } from '../../shared/config/env';

type CrawlType = 'title' | 'images';

const formatTimestamp = () => `[${new Date().toLocaleTimeString()}]`;

export default function AdminCrawler() {
	const [crawlUrl, setCrawlUrl] = useState('');
	const [crawlType, setCrawlType] = useState<CrawlType>('title');
	const [skipChapters, setSkipChapters] = useState(false);
	const [skipApi, setSkipApi] = useState(false);
	const [useDb, setUseDb] = useState(true); // Mặc định dùng database trực tiếp
	const [userId, setUserId] = useState('1');
	const [storyServiceUrl, setStoryServiceUrl] = useState('http://localhost:8083');
	const [dbHost, setDbHost] = useState('localhost');
	const [dbPort, setDbPort] = useState('5432');
	const [dbName, setDbName] = useState('story_db');
	const [dbUser, setDbUser] = useState('postgres');
	const [dbPassword, setDbPassword] = useState('postgres123');
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const [crawlResult, setCrawlResult] = useState<{ storyId?: number; success: boolean } | null>(null);
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
				body: JSON.stringify({ 
					url, 
					type: crawlType,
					skipChapters,
					skipApi,
					useDb,
					userId,
					storyServiceUrl,
					dbHost,
					dbPort,
					dbName,
					dbUser,
					dbPassword
				}),
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

			// Tìm story ID từ logs - tìm pattern "Story ID: X" hoặc "story X" hoặc "Đã tạo story: X"
			let storyId: number | undefined;
			for (const log of logs) {
				// Pattern 1: "Story ID: 123" hoặc "Story ID 123"
				const match1 = log.match(/Story\s+ID[:\s]+(\d+)/i);
				if (match1) {
					storyId = parseInt(match1[1]);
					break;
				}
				// Pattern 2: "Đã tạo story: 123 - Title"
				const match2 = log.match(/Đã\s+tạo\s+story[:\s]+(\d+)/i);
				if (match2) {
					storyId = parseInt(match2[1]);
					break;
				}
				// Pattern 3: "story X" trong context
				const match3 = log.match(/\bstory\s+(\d+)\b/i);
				if (match3 && (log.includes('tạo') || log.includes('created'))) {
					storyId = parseInt(match3[1]);
					break;
				}
			}
			
			if (storyId && !skipApi) {
				setCrawlResult({ storyId, success: true });
				appendLog(`✓ Đã tạo story thành công với ID: ${storyId}`);
				appendLog('Truyện đã được lưu vào database story_db.');
			} else if (skipApi) {
				setCrawlResult({ success: true });
				appendLog('✓ Crawl hoàn thành (bỏ qua API, chỉ lưu file).');
			} else {
				setCrawlResult({ success: true });
				appendLog('✓ Crawl hoàn thành.');
			}
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
	}, [appendCrawlerLogs, appendLog, crawlType, crawlUrl, skipChapters, skipApi, useDb, userId, storyServiceUrl, dbHost, dbPort, dbName, dbUser, dbPassword]);

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
					<div className="space-y-3">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={skipChapters}
								onChange={(e) => setSkipChapters(e.target.checked)}
								className="text-brand"
							/>
							<span className="text-sm">Bỏ qua việc tải ảnh các chương</span>
						</label>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={skipApi}
								onChange={(e) => setSkipApi(e.target.checked)}
								className="text-brand"
							/>
							<span className="text-sm">Bỏ qua việc lưu vào database (chỉ crawl và lưu file)</span>
						</label>
						{!skipApi && (
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={useDb}
									onChange={(e) => setUseDb(e.target.checked)}
									className="text-brand"
								/>
								<span className="text-sm">Lưu trực tiếp vào database PostgreSQL (thay vì qua API)</span>
							</label>
						)}
					</div>
					{!skipApi && useDb && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-medium">Database Host</label>
								<input
									type="text"
									value={dbHost}
									onChange={(e) => setDbHost(e.target.value)}
									placeholder="localhost"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Database Port</label>
								<input
									type="text"
									value={dbPort}
									onChange={(e) => setDbPort(e.target.value)}
									placeholder="5432"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Database Name</label>
								<input
									type="text"
									value={dbName}
									onChange={(e) => setDbName(e.target.value)}
									placeholder="story_db"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Database User</label>
								<input
									type="text"
									value={dbUser}
									onChange={(e) => setDbUser(e.target.value)}
									placeholder="postgres"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
							<div className="sm:col-span-2">
								<label className="mb-2 block text-sm font-medium">Database Password</label>
								<input
									type="password"
									value={dbPassword}
									onChange={(e) => setDbPassword(e.target.value)}
									placeholder="postgres123"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
						</div>
					)}
					{!skipApi && !useDb && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-medium">Story Service URL</label>
								<input
									type="text"
									value={storyServiceUrl}
									onChange={(e) => setStoryServiceUrl(e.target.value)}
									placeholder="http://localhost:8083"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">User ID</label>
								<input
									type="text"
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
									placeholder="1"
									className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900"
								/>
							</div>
						</div>
					)}
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

			{/* Crawl Result */}
			{crawlResult && (
				<div className={`rounded-xl border p-6 shadow-sm ${
					crawlResult.success 
						? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
						: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
				}`}>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold">
								{crawlResult.success ? '✓ Crawl thành công' : '✗ Crawl thất bại'}
							</h3>
							{crawlResult.storyId && (
								<p className="mt-2 text-sm">
									Story ID: <span className="font-mono font-bold">{crawlResult.storyId}</span>
								</p>
							)}
							<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
								{crawlResult.storyId 
									? 'Truyện đã được lưu vào database story_db và có thể xem trên trang web.'
									: 'Dữ liệu đã được crawl và lưu vào file system.'}
							</p>
						</div>
						{crawlResult.storyId && (
							<a
								href={`/story/${crawlResult.storyId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
							>
								Xem truyện
							</a>
						)}
					</div>
				</div>
			)}

			{/* Logs */}
			<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Logs</h3>
					<button
						onClick={() => {
							setLogs([]);
							setCrawlResult(null);
						}}
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
						<strong>Crawl thông tin truyện:</strong> Crawl thông tin truyện, ảnh bìa và các chương từ truyenqqgo.com
					</li>
					<li>
						<strong>Lưu vào database:</strong> Khi crawl xong, truyện sẽ tự động được lưu vào database story_db qua API story-service
					</li>
					<li>
						<strong>Bỏ qua chương:</strong> Chọn "Bỏ qua việc tải ảnh các chương" để chỉ crawl thông tin truyện
					</li>
					<li>
						<strong>Chỉ crawl file:</strong> Chọn "Bỏ qua việc gọi API" để chỉ lưu file, không lưu vào database
					</li>
					<li>Đảm bảo URL hợp lệ từ truyenqqgo.com</li>
					<li>Đảm bảo story-service đang chạy (mặc định: http://localhost:8083)</li>
					<li>Quá trình crawl có thể mất vài phút tùy thuộc vào số lượng dữ liệu</li>
				</ul>
			</div>
		</div>
	);
}
