import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
	Bell, 
	X, 
	MessageCircle, 
	Heart, 
	Star, 
	CreditCard, 
	CheckCircle2, 
	XCircle,
	Sparkles
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';
import { api, endpoints } from '@/services/apiClient';

function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return 'Vừa xong';
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} phút trước`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} giờ trước`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays} ngày trước`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks} tuần trước`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	return `${diffInMonths} tháng trước`;
}

function getNotificationIcon(content: string) {
	const lowerContent = content.toLowerCase();
	if (lowerContent.includes('nạp tiền') || lowerContent.includes('payment') || lowerContent.includes('thanh toán')) {
		return <CreditCard className="h-4 w-4 text-emerald-500" />;
	}
	if (lowerContent.includes('bình luận') || lowerContent.includes('comment') || lowerContent.includes('trả lời')) {
		return <MessageCircle className="h-4 w-4 text-blue-500" />;
	}
	if (lowerContent.includes('thích') || lowerContent.includes('like') || lowerContent.includes('reaction')) {
		return <Heart className="h-4 w-4 text-red-500" />;
	}
	if (lowerContent.includes('đánh giá') || lowerContent.includes('rating') || lowerContent.includes('sao')) {
		return <Star className="h-4 w-4 text-amber-500" />;
	}
	if (lowerContent.includes('thành công') || lowerContent.includes('success')) {
		return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
	}
	if (lowerContent.includes('thất bại') || lowerContent.includes('failed')) {
		return <XCircle className="h-4 w-4 text-red-500" />;
	}
	return <Bell className="h-4 w-4 text-zinc-500" />;
}

function getNotificationColor(content: string) {
	const lowerContent = content.toLowerCase();
	if (lowerContent.includes('nạp tiền') || lowerContent.includes('payment') || lowerContent.includes('thanh toán')) {
		return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
	}
	if (lowerContent.includes('bình luận') || lowerContent.includes('comment') || lowerContent.includes('trả lời')) {
		return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
	}
	if (lowerContent.includes('thích') || lowerContent.includes('like') || lowerContent.includes('reaction')) {
		return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
	}
	if (lowerContent.includes('đánh giá') || lowerContent.includes('rating') || lowerContent.includes('sao')) {
		return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
	}
	if (lowerContent.includes('thành công') || lowerContent.includes('success')) {
		return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
	}
	if (lowerContent.includes('thất bại') || lowerContent.includes('failed')) {
		return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
	}
	return 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700';
}

export function NotificationDropdown() {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const { notifications, loading, unreadCount, refresh } = useNotifications();

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (
				isOpen &&
				dropdownRef.current &&
				!dropdownRef.current.contains(target) &&
				buttonRef.current &&
				!buttonRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleNotificationClick = async (notification: Notification) => {
		// Mark as read nếu chưa đọc
		if (!notification.isRead) {
			try {
				await api.put(endpoints.markNotificationAsRead(notification.id));
				// Refresh notifications để cập nhật UI
				refresh();
			} catch (err) {
				console.error('Failed to mark notification as read:', err);
			}
		}

		if (notification.link) {
			// Kiểm tra xem link có phải là story link không
			if (notification.link.startsWith('/story/')) {
				// Parse link để lấy storyId và commentId
				const linkParts = notification.link.split('/');
				const storyId = linkParts[2]; // /story/{storyId}/...
				
				// Validate storyId
				if (!storyId || storyId === 'undefined' || storyId === 'null') {
					console.error('Invalid storyId in notification link:', notification.link);
					navigate('/');
					setIsOpen(false);
					return;
				}
				
				const hash = notification.link.split('#')[1]; // commentId từ hash
				
				// Navigate đến story page
				navigate(`/story/${storyId}`);
				setIsOpen(false);
				
				// Scroll to comments section và comment cụ thể
				setTimeout(() => {
					// Đầu tiên scroll đến phần comments section
					const commentsSection = document.getElementById('comments-section');
					if (commentsSection) {
						commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
					
					// Sau đó scroll đến comment cụ thể nếu có hash
					if (hash) {
						setTimeout(() => {
							const commentElement = document.getElementById(hash);
							if (commentElement) {
								commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
								// Highlight comment
								commentElement.classList.add('ring-2', 'ring-brand', 'ring-offset-2', 'rounded-lg');
								setTimeout(() => {
									commentElement.classList.remove('ring-2', 'ring-brand', 'ring-offset-2');
								}, 2000);
							}
						}, 300);
					}
				}, 500);
			} else {
				// Link không phải story link (ví dụ: "/" cho deposit notification)
				// Chỉ navigate đến link đó, không cần load story
				navigate(notification.link);
				setIsOpen(false);
			}
		}
	};

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				onClick={() => {
					setIsOpen(!isOpen);
					if (!isOpen) {
						refresh();
					}
				}}
				className="relative inline-flex items-center justify-center rounded-lg p-2.5 text-zinc-700 transition-all hover:bg-zinc-100 hover:scale-105 dark:text-zinc-300 dark:hover:bg-zinc-900"
				aria-label="Thông báo"
			>
				<Bell className="h-5 w-5 transition-transform duration-200" />
				{unreadCount > 0 && (
					<span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className="absolute right-0 z-50 mt-2 w-96 animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900"
				>
					<div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-5 py-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-brand/10 p-1.5">
								<Bell className="h-4 w-4 text-brand" />
							</div>
							<h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
								Thông báo
								{unreadCount > 0 && (
									<span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
										{unreadCount}
									</span>
								)}
							</h3>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
							aria-label="Đóng"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent dark:scrollbar-thumb-zinc-700">
						{loading ? (
							<div className="flex flex-col items-center justify-center p-12">
								<div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
								<p className="text-sm font-medium text-zinc-500">Đang tải thông báo...</p>
							</div>
						) : notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-12">
								<div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
									<Sparkles className="h-8 w-8 text-zinc-400" />
								</div>
								<p className="text-sm font-medium text-zinc-500">Chưa có thông báo nào</p>
								<p className="mt-1 text-xs text-zinc-400">Thông báo mới sẽ xuất hiện ở đây</p>
							</div>
						) : (
							<div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
								{notifications.map((notification, index) => (
									<button
										key={notification.id}
										onClick={() => handleNotificationClick(notification)}
										className={`group relative w-full px-5 py-4 text-left transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
											!notification.isRead 
												? 'bg-gradient-to-r from-blue-50/50 via-white to-white dark:from-blue-900/10 dark:via-zinc-900 dark:to-zinc-900' 
												: 'bg-white dark:bg-zinc-900'
										}`}
										style={{
											animationDelay: `${index * 50}ms`,
										}}
									>
										{!notification.isRead && (
											<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400"></div>
										)}
										<div className="flex items-start gap-3">
											<div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
												!notification.isRead 
													? getNotificationColor(notification.content)
													: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
											}`}>
												{getNotificationIcon(notification.content)}
											</div>
											<div className="min-w-0 flex-1">
												<p className={`text-sm leading-relaxed ${
													!notification.isRead 
														? 'font-semibold text-zinc-900 dark:text-zinc-100' 
														: 'font-medium text-zinc-700 dark:text-zinc-300'
												}`}>
													{notification.content}
												</p>
												<div className="mt-2 flex items-center gap-2">
													<p className="text-xs text-zinc-500 dark:text-zinc-400">
														{formatTimeAgo(notification.createdAt)}
													</p>
													{!notification.isRead && (
														<span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
													)}
												</div>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

