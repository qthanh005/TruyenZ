import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flame, Layers, Lock, Sparkles, Star, Users, Trash2, Reply, X, Heart } from 'lucide-react';

import { CheckoutModal } from '@/components/payments/CheckoutModal';
import { usePremiumStore } from '@/shared/stores/premiumStore';
import { api, endpoints } from '@/services/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import type { CommentResponse, CommentRequest, CommentWithUser } from '@/types/comment';
import type { UserInfo } from '@/types/user';

type Chapter = { id: string | number; name: string; index?: number; chapterNumber?: number };
type Story = {
	id: string | number;
	title: string;
	author?: string;
	cover?: string;
	description?: string;
	genres?: string[];
	isPremium?: boolean;
	price?: number;
};

type StoryResponse = {
	id: number;
	title: string;
	description?: string;
	genres?: string[];
	coverImageId?: string;
	paid: boolean;
	price: number;
	author: string;
};

type ChapterResponse = {
	id: number;
	storyId: number;
	chapterNumber: number;
	title: string;
	imageIds?: string[];
};

const mockStats = {
	views: '1.2M',
	followers: '230K',
	rating: 4.8,
	updatedAt: 'Cập nhật 2 giờ trước',
};

const mockRecommendations = [
	{
		id: '5',
		title: 'Solo Leveling',
		cover: 'https://picsum.photos/seed/reco-1/160/220',
		description: 'Tiến trình nâng cấp không điểm dừng.',
	},
	{
		id: '6',
		title: 'Kimetsu no Yaiba',
		cover: 'https://picsum.photos/seed/reco-2/160/220',
		description: 'Diệt quỷ cứu em gái.',
	},
];

export default function StoryDetailPage() {
	const { storyId } = useParams();
	const [story, setStory] = useState<Story | null>(null);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [comments, setComments] = useState<CommentWithUser[]>([]);
	const [allComments, setAllComments] = useState<CommentWithUser[]>([]); // Tất cả comments đã load
	const [totalComments, setTotalComments] = useState(0);
	const [newComment, setNewComment] = useState('');
	const [commentLoading, setCommentLoading] = useState(false);
	const [commentError, setCommentError] = useState<string | null>(null);
	const [submittingComment, setSubmittingComment] = useState(false);
	const [userInfoCache, setUserInfoCache] = useState<Map<number, UserInfo>>(new Map());
	const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
	const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
	const [replyContent, setReplyContent] = useState('');
	const [replies, setReplies] = useState<Map<number, CommentWithUser[]>>(new Map());
	const [nestedReplies, setNestedReplies] = useState<Map<number, CommentWithUser[]>>(new Map()); // Replies của replies
	const [showReplies, setShowReplies] = useState<Set<number>>(new Set());
	const [showNestedReplies, setShowNestedReplies] = useState<Set<number>>(new Set()); // Hiển thị nested replies
	const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
	const [replyCounts, setReplyCounts] = useState<Map<number, number>>(new Map());
	const [nestedReplyCounts, setNestedReplyCounts] = useState<Map<number, number>>(new Map()); // Số lượng nested replies
	const [replyingToReplyId, setReplyingToReplyId] = useState<number | null>(null); // Đang reply reply nào
	const [replyToReplyContent, setReplyToReplyContent] = useState(''); // Nội dung reply của reply
	const [displayedComments, setDisplayedComments] = useState(5); // Số comments hiển thị (infinite scroll)
	const openCheckout = usePremiumStore((state) => state.openCheckout);
	const purchases = usePremiumStore((state) => state.purchases);
	const checkPurchase = usePremiumStore((state) => state.checkPurchase);
	const purchaseRecord = storyId ? purchases[String(storyId)] : undefined;
	const { user, isAuthenticated } = useAuth();
	const [hasAccess, setHasAccess] = useState(false);
	const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);
	const [isFollowing, setIsFollowing] = useState(false);
	const [isTogglingFollow, setIsTogglingFollow] = useState(false);

	// Load story details from API
	useEffect(() => {
		if (!storyId) return;

		const loadStory = async () => {
			try {
				setLoading(true);
				setError(null);

				// Load story details
				const storyResponse = await api.get<StoryResponse>(endpoints.storyDetail(storyId));
				const storyData = storyResponse.data;

				// Map story response to Story type
				const gatewayUrl = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8081';
				const coverUrl = storyData.coverImageId
					? `${gatewayUrl}${storyData.coverImageId}`
					: `https://picsum.photos/seed/story-${storyData.id}/1200/680`;

				// Premium is determined by price > 0
				const isPremium = storyData.price > 0;
				
				const mappedStory: Story = {
					id: storyData.id,
					title: storyData.title,
					author: storyData.author,
					cover: coverUrl,
					description: storyData.description,
					genres: storyData.genres || [],
					isPremium: isPremium,
					price: isPremium ? storyData.price : undefined,
				};

				setStory(mappedStory);

				// Check purchase status từ backend nếu là premium story
				if (isPremium && isAuthenticated) {
					setIsCheckingPurchase(true);
					try {
						console.log(`[StoryDetailPage] Checking purchase for storyId: ${storyData.id}`);
						const purchased = await checkPurchase(storyData.id);
						console.log(`[StoryDetailPage] Purchase check result for storyId ${storyData.id}: ${purchased}`);
						setHasAccess(purchased);
					} catch (err) {
						console.error('Failed to check purchase:', err);
						// Fallback về localStorage check
						const localAccess = Boolean(purchases[String(storyData.id)]);
						console.log(`[StoryDetailPage] Fallback to localStorage check for storyId ${storyData.id}: ${localAccess}`);
						setHasAccess(localAccess);
					} finally {
						setIsCheckingPurchase(false);
					}
				}

				// Check follow status
				if (isAuthenticated) {
					try {
						const followResponse = await api.get<{ following: boolean }>(endpoints.checkFollowing(storyData.id));
						setIsFollowing(followResponse.data.following);
					} catch (err) {
						console.error('Failed to check follow status:', err);
						setIsFollowing(false);
					}
				} else {
					// Free story hoặc chưa đăng nhập
					setHasAccess(!isPremium);
				}

				// Load chapters
				const chaptersResponse = await api.get<ChapterResponse[]>(endpoints.chapters(storyId));
				const chaptersData = chaptersResponse.data;

				// Map chapters response to Chapter type
				const mappedChapters: Chapter[] = chaptersData.map((ch) => ({
					id: ch.id,
					name: ch.title,
					index: ch.chapterNumber,
					chapterNumber: ch.chapterNumber,
				}));

				// Sort by chapter number
				mappedChapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

				setChapters(mappedChapters);
			} catch (err) {
				console.error('Error loading story:', err);
				setError('Không thể tải thông tin truyện. Vui lòng thử lại sau.');
			} finally {
				setLoading(false);
			}
		};

		loadStory();
	}, [storyId]);

	// Load comments from API với cấu trúc phân cấp
	useEffect(() => {
		if (!storyId) return;

		const loadComments = async () => {
			try {
				setCommentLoading(true);
				setCommentError(null);

				// Get root comments by story ID (comments without chapterId or parentId)
				const response = await api.get<CommentResponse[]>(endpoints.getRootCommentsByStory(storyId));
				
				// Handle ResponseEntity wrapper if present
				const rootCommentsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];

				// Load user info cho root comments
				const currentCache = userInfoCache;
				const replyCountsMap = new Map<number, number>();
				
				// Load user info cho root comments và đếm số replies
				const rootCommentsWithUser: CommentWithUser[] = await Promise.all(
					rootCommentsData.map(async (comment: CommentResponse) => {
						let userInfo: UserInfo | null = null;
						
						if (currentCache.has(comment.userId)) {
							userInfo = currentCache.get(comment.userId)!;
						} else {
							try {
								const userResponse = await api.get<UserInfo>(endpoints.getUserById(comment.userId));
								userInfo = userResponse.data;
								setUserInfoCache((prev) => new Map(prev).set(comment.userId, userInfo!));
							} catch (err) {
								console.error(`Failed to load user info for userId ${comment.userId}:`, err);
								userInfo = {
									id: comment.userId,
									username: `User ${comment.userId}`,
									email: '',
									avatarUrl: null,
								};
							}
						}

						const commentWithUser: CommentWithUser = {
							...comment,
							user: {
								username: userInfo.username,
								avatarUrl: userInfo.avatarUrl,
							},
						};
						
						// Đếm số replies cho comment này (không load chi tiết)
						try {
							const repliesResponse = await api.get<CommentResponse[]>(endpoints.getRepliesByParentId(comment.id));
							const repliesData = Array.isArray(repliesResponse.data) ? repliesResponse.data : [];
							if (repliesData.length > 0) {
								replyCountsMap.set(comment.id, repliesData.length);
							}
						} catch (err) {
							console.error(`Failed to count replies for comment ${comment.id}:`, err);
						}

						return commentWithUser;
					})
				);

				// Lưu tất cả comments và hiển thị theo displayedComments
				setAllComments(rootCommentsWithUser);
				setReplyCounts(replyCountsMap);
				setTotalComments(rootCommentsWithUser.length);
				// Reset displayedComments khi load lại
				setDisplayedComments(5);
			} catch (err: any) {
				console.error('Error loading comments:', err);
				console.error('Error details:', {
					message: err.message,
					code: err.code,
					response: err.response,
					request: err.config?.url,
				});
				
				let errorMessage = 'Không thể tải bình luận. Vui lòng thử lại sau.';
				
				if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
					errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n- API Gateway có đang chạy không (port 8081)\n- Comment Service có đang chạy không (port 8883)\n- Kiểm tra Console để xem chi tiết lỗi';
				} else if (err.response) {
					errorMessage = err.response.data?.message 
						|| err.response.data?.error 
						|| `Lỗi ${err.response.status}: ${err.response.statusText}`;
				} else if (err.message) {
					errorMessage = err.message;
				}
				
				setCommentError(errorMessage);
				setComments([]);
				setAllComments([]);
				setReplies(new Map());
				setNestedReplies(new Map());
				setReplyCounts(new Map());
				setNestedReplyCounts(new Map());
				setShowReplies(new Set());
				setShowNestedReplies(new Set());
				setDisplayedComments(5);
				setTotalComments(0);
			} finally {
				setCommentLoading(false);
			}
		};

		loadComments();
	}, [storyId]);

	// Cập nhật comments hiển thị khi displayedComments thay đổi
	useEffect(() => {
		setComments(allComments.slice(0, displayedComments));
	}, [displayedComments, allComments]);

	// Scroll to comment khi có hash trong URL (từ notification)
	useEffect(() => {
		const hash = window.location.hash.substring(1); // Remove #
		if (hash) {
			// Đợi comments load xong
			setTimeout(() => {
				// Đầu tiên scroll đến phần comments section
				const commentsSection = document.getElementById('comments-section');
				if (commentsSection) {
					commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
				
				// Sau đó scroll đến comment cụ thể
				setTimeout(() => {
					const element = document.getElementById(hash);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
						// Highlight comment
						element.classList.add('ring-2', 'ring-brand', 'ring-offset-2', 'rounded-lg');
						setTimeout(() => {
							element.classList.remove('ring-2', 'ring-brand', 'ring-offset-2');
						}, 2000);
					}
				}, 300);
			}, 500);
		}
	}, [comments, storyId]);

	const hasMoreComments = displayedComments < allComments.length;

	const formatPrice = (price?: number) =>
		new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price ?? 39000);

	const handlePurchaseClick = () => {
		if (!story) return;
		openCheckout({
			id: String(story.id),
			title: story.title,
			price: story.price ?? 39000,
		});
	};

	const handleToggleFollow = async () => {
		if (!story || !isAuthenticated || isTogglingFollow) return;

		try {
			setIsTogglingFollow(true);
			if (isFollowing) {
				await api.delete(endpoints.unfollowStory(story.id));
				setIsFollowing(false);
			} else {
				await api.post(endpoints.followStory(story.id));
				setIsFollowing(true);
			}
		} catch (err: any) {
			console.error('Failed to toggle follow:', err);
			const errorMessage = err.response?.data?.error || 'Không thể thực hiện thao tác. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setIsTogglingFollow(false);
		}
	};

	// Update hasAccess khi purchase thành công
	useEffect(() => {
		if (storyId && story?.isPremium) {
			const storyIdStr = String(storyId);
			const localHasAccess = Boolean(purchases[storyIdStr]);
			if (localHasAccess && !hasAccess) {
				setHasAccess(true);
			}
		}
	}, [purchases, storyId, story?.isPremium, hasAccess]);

	const canRead = !story?.isPremium || hasAccess;

	// Get current user ID
	const getCurrentUserId = (): number | null => {
		if (!user || !isAuthenticated) return null;
		
		if ('id' in user) {
			// Email user
			const userId = parseInt(user.id, 10);
			return isNaN(userId) ? null : userId;
		} else if (user.profile?.sub) {
			// OAuth user
			const userId = parseInt(user.profile.sub, 10);
			return isNaN(userId) ? null : userId;
		}
		return null;
	};

	// Check if comment can be deleted (within 5 minutes and is user's comment)
	const canDeleteComment = (comment: CommentWithUser): boolean => {
		const currentUserId = getCurrentUserId();
		if (!currentUserId || comment.userId !== currentUserId) return false;
		
		const commentDate = new Date(comment.createdAt);
		const now = new Date();
		const diffMinutes = (now.getTime() - commentDate.getTime()) / (1000 * 60);
		
		return diffMinutes <= 5;
	};

	// Handle delete comment
	const handleDeleteComment = async (commentId: number) => {
		if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
			return;
		}

		const currentUserId = getCurrentUserId();
		if (!currentUserId) {
			alert('Bạn cần đăng nhập để xóa bình luận');
			return;
		}

		try {
			setDeletingCommentId(commentId);
			await api.put(endpoints.deleteComment(commentId.toString()), {
				userId: currentUserId
			});
			
			// Remove comment from list
			setComments((prev) => prev.filter((c) => c.id !== commentId));
			setTotalComments((prev) => Math.max(0, prev - 1));
		} catch (err: any) {
			console.error('Error deleting comment:', err);
			// Backend trả về error trong response.data.error
			const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Không thể xóa bình luận. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setDeletingCommentId(null);
		}
	};

	const loadReplies = async (parentId: number) => {
		if (loadingReplies.has(parentId) || replies.has(parentId)) return;

		try {
			setLoadingReplies((prev) => new Set(prev).add(parentId));
			const response = await api.get<CommentResponse[]>(endpoints.getRepliesByParentId(parentId));
			const repliesData = Array.isArray(response.data) ? response.data : [];

			// Load user info for each reply
			const currentCache = userInfoCache;
			const repliesWithUser: CommentWithUser[] = await Promise.all(
				repliesData.map(async (reply: CommentResponse) => {
					if (currentCache.has(reply.userId)) {
						const cachedUser = currentCache.get(reply.userId)!;
						return {
							...reply,
							user: {
								username: cachedUser.username,
								avatarUrl: cachedUser.avatarUrl,
							},
						};
					}

					try {
						const userResponse = await api.get<UserInfo>(endpoints.getUserById(reply.userId));
						const userData = userResponse.data;
						
						setUserInfoCache((prev) => new Map(prev).set(reply.userId, userData));
						
						return {
							...reply,
							user: {
								username: userData.username,
								avatarUrl: userData.avatarUrl,
							},
						};
					} catch (err) {
						console.error(`Failed to load user info for reply userId ${reply.userId}:`, err);
						return {
							...reply,
							user: {
								username: `User ${reply.userId}`,
								avatarUrl: null,
							},
						};
					}
				})
			);

			// Đếm nested replies cho mỗi reply
			const nestedCountsMap = new Map<number, number>();
			for (const reply of repliesWithUser) {
				try {
					const nestedResponse = await api.get<CommentResponse[]>(endpoints.getRepliesByParentId(reply.id));
					const nestedData = Array.isArray(nestedResponse.data) ? nestedResponse.data : [];
					if (nestedData.length > 0) {
						nestedCountsMap.set(reply.id, nestedData.length);
					}
				} catch (err) {
					// Ignore errors when counting nested replies
				}
			}

			setReplies((prev) => new Map(prev).set(parentId, repliesWithUser));
			setNestedReplyCounts((prev) => {
				const newMap = new Map(prev);
				nestedCountsMap.forEach((count, replyId) => {
					newMap.set(replyId, count);
				});
				return newMap;
			});
			setShowReplies((prev) => new Set(prev).add(parentId));
		} catch (err) {
			console.error('Failed to load replies:', err);
		} finally {
			setLoadingReplies((prev) => {
				const newSet = new Set(prev);
				newSet.delete(parentId);
				return newSet;
			});
		}
	};

	const loadNestedReplies = async (replyId: number) => {
		if (loadingReplies.has(replyId) || nestedReplies.has(replyId)) return;

		try {
			setLoadingReplies((prev) => new Set(prev).add(replyId));
			const response = await api.get<CommentResponse[]>(endpoints.getRepliesByParentId(replyId));
			const nestedRepliesData = Array.isArray(response.data) ? response.data : [];

			// Load user info for each nested reply
			const currentCache = userInfoCache;
			const nestedRepliesWithUser: CommentWithUser[] = await Promise.all(
				nestedRepliesData.map(async (nestedReply: CommentResponse) => {
					if (currentCache.has(nestedReply.userId)) {
						const cachedUser = currentCache.get(nestedReply.userId)!;
						return {
							...nestedReply,
							user: {
								username: cachedUser.username,
								avatarUrl: cachedUser.avatarUrl,
							},
						};
					}

					try {
						const userResponse = await api.get<UserInfo>(endpoints.getUserById(nestedReply.userId));
						const userData = userResponse.data;
						
						setUserInfoCache((prev) => new Map(prev).set(nestedReply.userId, userData));
						
						return {
							...nestedReply,
							user: {
								username: userData.username,
								avatarUrl: userData.avatarUrl,
							},
						};
					} catch (err) {
						console.error(`Failed to load user info for nested reply userId ${nestedReply.userId}:`, err);
						return {
							...nestedReply,
							user: {
								username: `User ${nestedReply.userId}`,
								avatarUrl: null,
							},
						};
					}
				})
			);

			setNestedReplies((prev) => new Map(prev).set(replyId, nestedRepliesWithUser));
			setShowNestedReplies((prev) => new Set(prev).add(replyId));
		} catch (err) {
			console.error('Failed to load nested replies:', err);
		} finally {
			setLoadingReplies((prev) => {
				const newSet = new Set(prev);
				newSet.delete(replyId);
				return newSet;
			});
		}
	};

	const handleReplyToReply = async (replyId: number) => {
		if (!storyId || !replyToReplyContent.trim() || !isAuthenticated || !user) {
			if (!isAuthenticated) {
				alert('Vui lòng đăng nhập để trả lời');
			}
			return;
		}

		// Get userId from user object
		let userId: number;
		if ('id' in user) {
			userId = parseInt(user.id, 10);
		} else if (user.profile?.sub) {
			userId = parseInt(user.profile.sub, 10);
		} else {
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		if (isNaN(userId)) {
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			setSubmittingComment(true);

			const commentRequest: CommentRequest = {
				storyId: parseInt(storyId, 10),
				chapterId: null,
				userId: userId,
				parentId: replyId, // Reply của reply
				content: replyToReplyContent.trim(),
			};

			const response = await api.post<CommentResponse>(endpoints.createComment(), commentRequest);
			const newNestedReply = response.data;

			// Load user info for new nested reply
			try {
				const userResponse = await api.get<UserInfo>(endpoints.getUserById(newNestedReply.userId));
				const userData = userResponse.data;
				
				setUserInfoCache((prev) => new Map(prev).set(newNestedReply.userId, userData));
				
				const nestedReplyWithUser: CommentWithUser = {
					...newNestedReply,
					user: {
						username: userData.username,
						avatarUrl: userData.avatarUrl,
					},
				};

				// Add nested reply to nested replies map
				setNestedReplies((prev) => {
					const newMap = new Map(prev);
					const existingNestedReplies = newMap.get(replyId) || [];
					return newMap.set(replyId, [...existingNestedReplies, nestedReplyWithUser]);
				});
			} catch (err) {
				console.error('Failed to load user info for new nested reply:', err);
				const nestedReplyWithUser: CommentWithUser = {
					...newNestedReply,
					user: {
						username: `User ${newNestedReply.userId}`,
						avatarUrl: null,
					},
				};
				setNestedReplies((prev) => {
					const newMap = new Map(prev);
					const existingNestedReplies = newMap.get(replyId) || [];
					return newMap.set(replyId, [...existingNestedReplies, nestedReplyWithUser]);
				});
			}

			setReplyToReplyContent('');
			setReplyingToReplyId(null);
			
			// Cập nhật nested reply count
			setNestedReplyCounts((prev) => {
				const newMap = new Map(prev);
				const currentCount = newMap.get(replyId) || 0;
				return newMap.set(replyId, currentCount + 1);
			});
			
			// Nếu đang hiển thị nested replies, thêm reply mới vào
			if (showNestedReplies.has(replyId)) {
				// Already added above
			}
		} catch (err: any) {
			console.error('Error creating nested reply:', err);
			const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi trả lời. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setSubmittingComment(false);
		}
	};

	const handleReply = async (parentId: number) => {
		if (!storyId || !replyContent.trim() || !isAuthenticated || !user) {
			if (!isAuthenticated) {
				alert('Vui lòng đăng nhập để trả lời');
			}
			return;
		}

		// Get userId from user object
		let userId: number;
		if ('id' in user) {
			userId = parseInt(user.id, 10);
		} else if (user.profile?.sub) {
			userId = parseInt(user.profile.sub, 10);
		} else {
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		if (isNaN(userId)) {
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			setSubmittingComment(true);

			const commentRequest: CommentRequest = {
				storyId: parseInt(storyId, 10),
				chapterId: null,
				userId: userId,
				parentId: parentId,
				content: replyContent.trim(),
			};

			const response = await api.post<CommentResponse>(endpoints.createComment(), commentRequest);
			const newReply = response.data;

			// Load user info for new reply
			let replyWithUser: CommentWithUser;
			try {
				const userResponse = await api.get<UserInfo>(endpoints.getUserById(newReply.userId));
				const userData = userResponse.data;
				
				setUserInfoCache((prev) => new Map(prev).set(newReply.userId, userData));
				
				replyWithUser = {
					...newReply,
					user: {
						username: userData.username,
						avatarUrl: userData.avatarUrl,
					},
				};
			} catch (err) {
				console.error('Failed to load user info for new reply:', err);
				replyWithUser = {
					...newReply,
					user: {
						username: `User ${newReply.userId}`,
						avatarUrl: null,
					},
				};
			}

			// Add reply to replies map
			setReplies((prev) => {
				const newMap = new Map(prev);
				const existingReplies = newMap.get(parentId) || [];
				return newMap.set(parentId, [...existingReplies, replyWithUser]);
			});

			setReplyContent('');
			setReplyingToCommentId(null);
			
			// Cập nhật reply count và hiển thị reply mới
			setReplyCounts((prev) => {
				const newMap = new Map(prev);
				const currentCount = newMap.get(parentId) || 0;
				return newMap.set(parentId, currentCount + 1);
			});
			
			// Nếu đang hiển thị replies, reply đã được thêm vào ở trên
		} catch (err: any) {
			console.error('Error creating reply:', err);
			const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi trả lời. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setSubmittingComment(false);
		}
	};

	const handleAddComment = async () => {
		if (!storyId || !newComment.trim() || !isAuthenticated || !user) {
			if (!isAuthenticated) {
				alert('Vui lòng đăng nhập để bình luận');
			}
			return;
		}

		// Get userId from user object
		let userId: number;
		if ('id' in user) {
			// Email user
			userId = parseInt(user.id, 10);
		} else if (user.profile?.sub) {
			// OAuth user
			userId = parseInt(user.profile.sub, 10);
		} else {
			console.error('Cannot get userId from user object');
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		if (isNaN(userId)) {
			console.error('Invalid userId:', user);
			alert('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
			return;
		}

		try {
			setSubmittingComment(true);

			const commentRequest: CommentRequest = {
				storyId: parseInt(storyId, 10),
				chapterId: null, // Root comment for story
				userId: userId,
				parentId: null, // Root comment
				content: newComment.trim(),
			};

			const response = await api.post<CommentResponse>(endpoints.createComment(), commentRequest);
			const newCommentData = response.data;

			// Load user info for new comment
			try {
				const userResponse = await api.get<UserInfo>(endpoints.getUserById(newCommentData.userId));
				const userData = userResponse.data;
				
				// Update cache
				setUserInfoCache((prev) => new Map(prev).set(newCommentData.userId, userData));
				
				// Add new comment to the list with user info
				const commentWithUser: CommentWithUser = {
					...newCommentData,
					user: {
						username: userData.username,
						avatarUrl: userData.avatarUrl,
					},
				};
				// Thêm vào đầu danh sách
				setAllComments((prev) => {
					const updated = [commentWithUser, ...prev];
					// Tăng displayedComments nếu đang hiển thị hết
					if (displayedComments >= prev.length) {
						setDisplayedComments((current) => current + 1);
					}
					return updated;
				});
				setTotalComments((prev) => prev + 1);
			} catch (err) {
				console.error('Failed to load user info for new comment:', err);
				// Add comment without user info
				const commentWithUser: CommentWithUser = {
					...newCommentData,
					user: {
						username: `User ${newCommentData.userId}`,
						avatarUrl: null,
					},
				};
				setAllComments((prev) => {
					const updated = [commentWithUser, ...prev];
					// Tăng displayedComments nếu đang hiển thị hết
					if (displayedComments >= prev.length) {
						setDisplayedComments((current) => current + 1);
					}
					return updated;
				});
				setTotalComments((prev) => prev + 1);
			}
			setNewComment('');
		} catch (err: any) {
			console.error('Error creating comment:', err);
			const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.';
			alert(errorMessage);
		} finally {
			setSubmittingComment(false);
		}
	};

	if (!storyId) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
					<p className="mt-4 text-sm text-zinc-500">Đang tải thông tin truyện...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
				<p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
				>
					Thử lại
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			{story ? (
				<section className={`relative overflow-hidden rounded-3xl border bg-zinc-950 text-white shadow-lg ${
					story.isPremium 
						? hasAccess
							? 'border-emerald-400 border-2 shadow-emerald-200/30 dark:border-emerald-500 dark:shadow-emerald-500/30'
							: 'border-amber-400 border-2 shadow-amber-200/30 dark:border-amber-500 dark:shadow-amber-500/30'
						: 'border-zinc-200 dark:border-zinc-800'
				}`}>
					<div className="absolute inset-0">
						<img
							src={story.cover || 'https://picsum.photos/seed/placeholder/1200/680'}
							alt={story.title}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
						<div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
					</div>
					<div className="relative grid gap-8 p-8 md:grid-cols-[220px,1fr] md:gap-12 md:p-12">
						<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
							<img
								src={story.cover || 'https://picsum.photos/seed/placeholder/320/420'}
								alt={story.title}
								className="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
						<div className="space-y-6">
							<div className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
								story.isPremium 
									? hasAccess
										? 'bg-emerald-500/20 text-emerald-200'
										: 'bg-white/10 text-amber-200'
									: 'bg-white/10 text-amber-200'
							}`}>
								{story.isPremium ? <Sparkles size={14} /> : <Flame size={14} />}
								{story.isPremium 
									? hasAccess 
										? 'Đã sở hữu' 
										: 'Premium Series'
									: 'Đang thịnh hành'}
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold sm:text-4xl">{story.title}</h1>
								{story.author && (
									<p className="text-sm text-zinc-200">
										Tác giả: <span className="font-medium text-white">{story.author}</span>
									</p>
								)}
								<div className="flex flex-wrap gap-2 text-xs text-zinc-100">
									{story.genres?.map((genre) => (
										<span key={genre} className="rounded-full bg-white/10 px-3 py-1">
											{genre}
										</span>
									))}
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Lượt xem</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.views}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Theo dõi</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.followers}</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-300">
										<Star size={14} />
										Đánh giá
									</p>
									<p className="mt-1 text-xl font-semibold text-white">{mockStats.rating}/5</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
									<p className="text-xs uppercase tracking-wide text-zinc-300">Cập nhật</p>
									<p className="mt-1 text-sm font-semibold text-white">{mockStats.updatedAt}</p>
								</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
								<p className="text-sm leading-relaxed text-zinc-100">
									{story.description ||
										'Mô tả truyện chưa được cập nhật. Hiện chúng tôi đang thu thập nội dung chi tiết để mang đến trải nghiệm tốt hơn.'}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-sm">
								{story.isPremium ? (
									hasAccess ? (
										<button className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:opacity-90">
											Đọc từ chương mới nhất
										</button>
									) : (
										<>
											<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
												<Layers size={16} />
												<span>Giá: {formatPrice(story.price)}</span>
											</div>
											<button
												className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-medium text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-90"
												onClick={handlePurchaseClick}
											>
												Mua truyện premium
											</button>
										</>
									)
								) : (
									<button className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-medium text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-90">
										Đọc từ chương mới nhất
									</button>
								)}
								{isAuthenticated ? (
									<button
										onClick={handleToggleFollow}
										disabled={isTogglingFollow}
										className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 font-medium transition ${
											isFollowing
												? 'border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30'
												: 'border-white/30 text-white/90 hover:bg-white/10'
										} ${isTogglingFollow ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										<Heart size={16} className={isFollowing ? 'fill-current' : ''} />
										{isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
									</button>
								) : (
									<button
										onClick={() => alert('Vui lòng đăng nhập để theo dõi truyện')}
										className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 font-medium text-white/90 transition hover:bg-white/10"
									>
										<Heart size={16} />
										Theo dõi
									</button>
								)}
								{hasAccess && story.isPremium && purchaseRecord && (
									<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200">
										<Layers size={14} />
										<span>Đã sở hữu từ {new Date(purchaseRecord.purchasedAt).toLocaleDateString('vi-VN')}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</section>
			) : (
				<div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
					Đang tải dữ liệu truyện...
				</div>
			)}

			<section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Danh sách chương</h2>
								<p className="text-sm text-zinc-500">Chọn chương để tiếp tục trải nghiệm.</p>
							</div>
							<button className="text-sm font-medium text-brand hover:underline">Nhảy tới chương...</button>
						</div>
						<div className="relative mt-4">
							<div
								className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
									!canRead ? 'pointer-events-none blur-sm opacity-60' : ''
								}`}
							>
								{chapters.length > 0 ? (
									chapters.map((chapter) => (
										<Link
											key={chapter.id}
											to={`/story/${storyId}/chapter/${chapter.chapterNumber || chapter.id}`}
											className="group flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 dark:border-zinc-800 dark:hover:border-brand/50"
										>
											<div>
												<p className="font-semibold text-zinc-800 transition group-hover:text-brand dark:text-white">
													{chapter.chapterNumber ? `Chương ${chapter.chapterNumber}` : chapter.index ? `Chương ${chapter.index}` : 'Chương chưa đánh số'}
												</p>
												<p className="text-xs text-zinc-500 dark:text-zinc-400">{chapter.name}</p>
											</div>
											<div className="text-xs font-semibold text-brand">Đọc</div>
										</Link>
									))
								) : (
									<div className="col-span-full py-8 text-center text-sm text-zinc-500">
										Chưa có chương nào
									</div>
								)}
							</div>
							{!canRead && story?.isPremium && (
								<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand/60 bg-white/85 text-center shadow-inner backdrop-blur-sm dark:bg-zinc-900/90">
									<div className="flex flex-col items-center gap-2 px-6">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
											<Lock className="h-5 w-5" />
										</div>
										<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
											Nội dung premium đã được khóa
										</p>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											Mua truyện để mở khóa toàn bộ chương và nhận cập nhật mới nhanh nhất.
										</p>
										<button
											className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
											onClick={handlePurchaseClick}
										>
											Mua truyện với {formatPrice(story.price)}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Bộ sưu tập tương tự</h3>
						<p className="mt-1 text-sm text-zinc-500">Gợi ý dựa trên thể loại và mức độ thịnh hành.</p>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							{mockRecommendations.map((item) => (
								<Link
									key={item.id}
									to={`/story/${item.id}`}
									className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
								>
									<div className="aspect-[3/4] w-full overflow-hidden">
										<img
											src={item.cover}
											alt={item.title}
											className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
											loading="lazy"
										/>
									</div>
									<div className="space-y-1 p-3">
										<p className="text-sm font-semibold text-zinc-800 transition group-hover:text-brand dark:text-white">
											{item.title}
										</p>
										<p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>

				<aside id="comments-section" className="space-y-6">
					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Bình luận</h3>
							<span className="text-xs text-zinc-500">{totalComments} bình luận</span>
						</div>
						<div className="mt-4 space-y-3 text-sm">
							<textarea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Chia sẻ cảm nhận của bạn..."
								className="min-h-[100px] w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-zinc-800 dark:bg-zinc-900"
							/>
							<div className="flex justify-end">
								<button
									className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
									onClick={handleAddComment}
									disabled={submittingComment || !isAuthenticated}
								>
									{submittingComment ? (
										<>
											<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
											Đang gửi...
										</>
									) : (
										<>
											<Users size={14} />
											Gửi bình luận
										</>
									)}
								</button>
							</div>
						</div>
						{commentError && (
							<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
								{commentError}
							</div>
						)}
						<div className="mt-6 space-y-4">
							{commentLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-center">
										<div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
										<p className="mt-2 text-xs text-zinc-500">Đang tải bình luận...</p>
									</div>
								</div>
							) : comments.length === 0 ? (
								<div className="py-8 text-center text-sm text-zinc-500">
									Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
								</div>
							) : (
								comments.map((comment) => {
									const canDelete = canDeleteComment(comment);
									const isDeleting = deletingCommentId === comment.id;
									
									return (
										<div key={comment.id} id={String(comment.id)} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-3 flex-1">
													{comment.user?.avatarUrl ? (
														<img
															src={comment.user.avatarUrl}
															alt={comment.user.username}
															className="h-10 w-10 rounded-full object-cover"
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-sm">
															{comment.user?.username?.charAt(0).toUpperCase() || 'U'}
														</div>
													)}
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<p className="text-sm font-semibold text-zinc-800 dark:text-white">
																{comment.user?.username || `User ${comment.userId}`}
															</p>
															{canDelete && (
																<button
																	onClick={() => handleDeleteComment(comment.id)}
																	disabled={isDeleting}
																	className="ml-auto text-xs text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
																	title="Xóa bình luận (chỉ trong 5 phút đầu)"
																>
																	{isDeleting ? (
																		<div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
																	) : (
																		<Trash2 size={14} />
																	)}
																	<span>Xóa</span>
																</button>
															)}
														</div>
														<p className="text-xs text-zinc-500">
															{new Date(comment.createdAt).toLocaleString('vi-VN')}
														</p>
													</div>
												</div>
											</div>
											<p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
												{comment.content}
											</p>
											<div className="mt-3 flex items-center gap-4">
												{isAuthenticated && (
													<button
														onClick={() => {
															if (replyingToCommentId === comment.id) {
																setReplyingToCommentId(null);
																setReplyContent('');
															} else {
																setReplyingToCommentId(comment.id);
															}
														}}
														className="flex items-center gap-1 text-xs text-zinc-500 hover:text-brand transition-colors"
													>
														<Reply size={14} />
														<span>Trả lời</span>
													</button>
												)}
												{replyCounts.has(comment.id) && replyCounts.get(comment.id)! > 0 && (
													<button
														onClick={() => {
															if (showReplies.has(comment.id)) {
																// Ẩn replies
																setShowReplies((prev) => {
																	const newSet = new Set(prev);
																	newSet.delete(comment.id);
																	return newSet;
																});
															} else {
																// Hiện replies - load nếu chưa có
																if (!replies.has(comment.id)) {
																	loadReplies(comment.id);
																} else {
																	setShowReplies((prev) => new Set(prev).add(comment.id));
																}
															}
														}}
														className="text-xs text-zinc-500 hover:text-brand transition-colors"
													>
														{showReplies.has(comment.id) ? (
															<>Ẩn {replyCounts.get(comment.id)} trả lời</>
														) : (
															<>Xem {replyCounts.get(comment.id)} trả lời</>
														)}
													</button>
												)}
											</div>
											{replyingToCommentId === comment.id && (
												<div className="mt-4 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
													<textarea
														value={replyContent}
														onChange={(e) => setReplyContent(e.target.value)}
														placeholder={`Trả lời ${comment.user?.username || 'người dùng'}...`}
														className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800"
													/>
													<div className="flex items-center justify-end gap-2">
														<button
															onClick={() => {
																setReplyingToCommentId(null);
																setReplyContent('');
															}}
															className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
														>
															Hủy
														</button>
														<button
															onClick={() => handleReply(comment.id)}
															disabled={submittingComment || !replyContent.trim()}
															className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
														>
															{submittingComment ? (
																<>
																	<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
																	Đang gửi...
																</>
															) : (
																<>
																	<Reply size={12} />
																	Trả lời
																</>
															)}
														</button>
													</div>
												</div>
											)}
											{/* Hiển thị replies dưới parent comment với indent khi được mở */}
											{showReplies.has(comment.id) && replies.has(comment.id) && replies.get(comment.id)!.length > 0 && (
												<div className="mt-4 ml-6 space-y-3 border-l-2 border-zinc-300 pl-4 dark:border-zinc-700">
													{loadingReplies.has(comment.id) ? (
														<div className="py-2 text-center text-xs text-zinc-500">Đang tải...</div>
													) : (
														replies.get(comment.id)!.map((reply) => (
															<div key={reply.id} className="space-y-2">
																<div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
																	<div className="flex items-center gap-2">
																		{reply.user?.avatarUrl ? (
																			<img
																				src={reply.user.avatarUrl}
																				alt={reply.user.username}
																				className="h-8 w-8 rounded-full object-cover"
																			/>
																		) : (
																			<div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-xs">
																				{reply.user?.username?.charAt(0).toUpperCase() || 'U'}
																			</div>
																		)}
																		<div className="flex-1">
																			<p className="text-xs font-semibold text-zinc-800 dark:text-white">
																				{reply.user?.username || `User ${reply.userId}`}
																			</p>
																			<p className="text-xs text-zinc-500">
																				{new Date(reply.createdAt).toLocaleString('vi-VN')}
																			</p>
																		</div>
																	</div>
																	<p className="mt-2 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-300">
																		{reply.content}
																	</p>
																	<div className="mt-2 flex items-center gap-3">
																		{isAuthenticated && (
																			<button
																				onClick={() => {
																					if (replyingToReplyId === reply.id) {
																						setReplyingToReplyId(null);
																						setReplyToReplyContent('');
																					} else {
																						setReplyingToReplyId(reply.id);
																						if (!nestedReplies.has(reply.id) && nestedReplyCounts.has(reply.id)) {
																							loadNestedReplies(reply.id);
																						}
																					}
																				}}
																				className="flex items-center gap-1 text-xs text-zinc-500 hover:text-brand transition-colors"
																			>
																				<Reply size={12} />
																				<span>Trả lời</span>
																			</button>
																		)}
																		{nestedReplyCounts.has(reply.id) && nestedReplyCounts.get(reply.id)! > 0 && (
																			<button
																				onClick={() => {
																					if (showNestedReplies.has(reply.id)) {
																						setShowNestedReplies((prev) => {
																							const newSet = new Set(prev);
																							newSet.delete(reply.id);
																							return newSet;
																						});
																					} else {
																						if (!nestedReplies.has(reply.id)) {
																							loadNestedReplies(reply.id);
																						} else {
																							setShowNestedReplies((prev) => new Set(prev).add(reply.id));
																						}
																					}
																				}}
																				className="text-xs text-zinc-500 hover:text-brand transition-colors"
																			>
																				{showNestedReplies.has(reply.id) ? (
																					<>Ẩn {nestedReplyCounts.get(reply.id)} trả lời</>
																				) : (
																					<>Xem {nestedReplyCounts.get(reply.id)} trả lời</>
																				)}
																			</button>
																		)}
																	</div>
																	{replyingToReplyId === reply.id && (
																		<div className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
																			<textarea
																				value={replyToReplyContent}
																				onChange={(e) => setReplyToReplyContent(e.target.value)}
																				placeholder={`Trả lời ${reply.user?.username || 'người dùng'}...`}
																				className="min-h-[60px] w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-600 dark:bg-zinc-900"
																			/>
																			<div className="flex items-center justify-end gap-2">
																				<button
																					onClick={() => {
																						setReplyingToReplyId(null);
																						setReplyToReplyContent('');
																					}}
																					className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
																				>
																					Hủy
																				</button>
																				<button
																					onClick={() => handleReplyToReply(reply.id)}
																					disabled={submittingComment || !replyToReplyContent.trim()}
																					className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
																				>
																					{submittingComment ? (
																						<>
																							<div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
																							Đang gửi...
																						</>
																					) : (
																						<>
																							<Reply size={10} />
																							Trả lời
																						</>
																					)}
																				</button>
																			</div>
																		</div>
																	)}
																</div>
																{/* Hiển thị nested replies (replies của reply) */}
																{showNestedReplies.has(reply.id) && nestedReplies.has(reply.id) && nestedReplies.get(reply.id)!.length > 0 && (
																	<div className="ml-4 space-y-2 border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
																		{loadingReplies.has(reply.id) ? (
																			<div className="py-1 text-center text-xs text-zinc-500">Đang tải...</div>
																		) : (
																			nestedReplies.get(reply.id)!.map((nestedReply) => (
																				<div key={nestedReply.id} className="rounded-lg border border-zinc-200 bg-zinc-50/30 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
																					<div className="flex items-center gap-2">
																						{nestedReply.user?.avatarUrl ? (
																							<img
																								src={nestedReply.user.avatarUrl}
																								alt={nestedReply.user.username}
																								className="h-6 w-6 rounded-full object-cover"
																							/>
																						) : (
																							<div className="h-6 w-6 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-[10px]">
																								{nestedReply.user?.username?.charAt(0).toUpperCase() || 'U'}
																							</div>
																						)}
																						<div className="flex-1">
																							<p className="text-[10px] font-semibold text-zinc-800 dark:text-white">
																								{nestedReply.user?.username || `User ${nestedReply.userId}`}
																							</p>
																							<p className="text-[10px] text-zinc-500">
																								{new Date(nestedReply.createdAt).toLocaleString('vi-VN')}
																							</p>
																						</div>
																					</div>
																					<p className="mt-1 whitespace-pre-wrap text-[10px] text-zinc-600 dark:text-zinc-300">
																						{nestedReply.content}
																					</p>
																				</div>
																			))
																		)}
																	</div>
																)}
															</div>
														))
													)}
												</div>
											)}
										</div>
									);
								})
							)}
						</div>
						{/* Load more button thay vì pagination */}
						{hasMoreComments && (
							<div className="mt-4 flex items-center justify-center">
								<button
									onClick={() => setDisplayedComments((prev) => prev + 5)}
									className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
								>
									Xem thêm bình luận ({allComments.length - displayedComments} còn lại)
								</button>
							</div>
						)}
					</div>

					<div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Thông tin thêm</h3>
						<div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Lịch phát hành:</span> Thứ Tư &
								Thứ Bảy hàng tuần
							</p>
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Tình trạng:</span> Đang tiến hành
							</p>
							<p>
								<span className="font-semibold text-zinc-900 dark:text-white">Định dạng:</span> Manga màu, bản
								dịch tiếng Việt
							</p>
						</div>
					</div>
				</aside>
			</section>

			<CheckoutModal />
		</div>
	);
}

