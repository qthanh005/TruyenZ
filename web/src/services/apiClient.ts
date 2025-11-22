import axios from 'axios';
import { apiConfig } from '@/shared/config/env';
import { User } from 'oidc-client-ts';

export const api = axios.create({
	baseURL: apiConfig.gatewayBaseUrl,
	withCredentials: true,
});

// Interceptor để luôn thêm token từ localStorage hoặc OAuth user
api.interceptors.request.use((config) => {
	// Kiểm tra token từ localStorage (email/password auth)
	const localToken = localStorage.getItem('auth_token');
	if (localToken && !config.headers['Authorization']) {
		config.headers['Authorization'] = `Bearer ${localToken}`;
	}
	return config;
});

export function attachToken(user: User | null) {
	api.interceptors.request.clear();
	// Set up interceptor với priority cho OAuth token
	api.interceptors.request.use((config) => {
		// Ưu tiên OAuth token nếu có
		if (user?.access_token) {
			config.headers['Authorization'] = `Bearer ${user.access_token}`;
		} else {
			// Fallback to localStorage token
			const localToken = localStorage.getItem('auth_token');
			if (localToken && !config.headers['Authorization']) {
				config.headers['Authorization'] = `Bearer ${localToken}`;
			}
		}
		return config;
	});
}

// Example endpoints mapping to microservices
export const endpoints = {
	// User Service - Auth
	register: () => '/api/auth/register',
	login: () => '/api/auth/login',
	googleAuth: () => '/api/auth/google',
	refresh: () => '/api/auth/refresh',
	logout: () => '/api/auth/logout',
	// User Service
	me: () => '/api/user/me',
	updateProfile: () => '/api/user/me',
	uploadAvatar: () => '/api/user/avatar',
	deleteAvatar: () => '/api/user/avatar',
	profile: (userId: string) => `/api/user/${userId}`,
	getUserById: (userId: string | number) => `/api/user/${userId}`,
	bookmarks: () => '/api/user/bookmarks',
	addBookmark: () => '/api/user/bookmarks',
	removeBookmark: () => '/api/user/bookmarks',
	checkBookmark: (storyId: string | number, chapterId: string | number) => `/api/user/bookmarks/check?storyId=${storyId}&chapterId=${chapterId}`,
	getUserBookmarks: () => '/api/user/bookmarks',
	getStoryBookmarks: (storyId: string | number) => `/api/user/bookmarks/story/${storyId}`,
	history: () => '/api/user/history',
	saveHistory: () => '/api/user/history',
	deleteHistory: (storyId: string | number) => `/api/user/history/${storyId}`,
	deleteAllHistory: () => '/api/user/history',
	balance: () => '/api/user/balance',
	getAllUsers: () => '/api/user/admin/all',
	updateUser: (userId: string | number) => `/api/user/admin/${userId}`,
	// Follow Service
	followStory: (storyId: string | number) => `/api/user/follow/${storyId}`,
	unfollowStory: (storyId: string | number) => `/api/user/follow/${storyId}`,
	checkFollowing: (storyId: string | number) => `/api/user/follow/${storyId}/check`,
	getFollowedStories: () => '/api/user/follow/list',

	// Story Service
	stories: () => '/api/story',
	createStory: () => '/api/story',
	storyDetail: (id: string) => `/api/story/${id}`,
	updateStory: (id: string | number) => `/api/story/${id}`,
	deleteStory: (id: string | number) => `/api/story/${id}`,
	uploadCover: (storyId: string | number) => `/api/story/${storyId}/cover`,
	chapters: (storyId: string) => `/api/story/${storyId}/chapters`,
	createChapter: (storyId: string | number) => `/api/story/${storyId}/chapters`,
	chapterById: (chapterId: string) => `/api/story/chapters/${chapterId}`,
	chapterContent: (storyId: string, chapterId: string) => `/api/story/${storyId}/chapters/${chapterId}`,
	deleteChapter: (storyId: string | number, chapterId: string | number) => `/api/story/${storyId}/chapters/${chapterId}`,
	uploadChapterImages: (storyId: string | number, chapterNumber: number) => `/api/story/${storyId}/chapters/${chapterNumber}/images`,
	deleteChapterImages: (storyId: string | number, chapterNumber: number, index?: number, filename?: string) => {
		const baseUrl = `/api/story/${storyId}/chapters/${chapterNumber}/images`;
		const params = new URLSearchParams();
		if (index !== undefined) params.append('index', String(index + 1)); // API expects 1-based index
		if (filename) {
			// API accepts filename as array
			params.append('filename', filename);
		}
		const query = params.toString();
		return `${baseUrl}${query ? '?' + query : ''}`;
	},
	searchStories: (q: string) => `/api/story/search?title=${encodeURIComponent(q)}`,
	checkStoryPurchase: (storyId: string | number) => `/api/story/${storyId}/purchase/check`,
	getAllGenres: () => '/api/story/genres',
	getStoriesByGenre: (genre: string, page?: number, size?: number) => {
		const encodedGenre = encodeURIComponent(genre);
		const params = new URLSearchParams();
		if (page !== undefined) params.append('page', String(page));
		if (size !== undefined) params.append('size', String(size));
		const query = params.toString();
		return `/api/story/genre/${encodedGenre}${query ? '?' + query : ''}`;
	},
	getAdminGenres: () => '/api/story/admin/genres',
	createGenre: () => '/api/story/admin/genres',
	updateGenre: (genreId: string | number) => `/api/story/admin/genres/${genreId}`,
	deleteGenre: (genreId: string | number) => `/api/story/admin/genres/${genreId}`,

	// Comment Service
	createComment: () => '/api/comments',
	getCommentsByChapterAndStory: (chapterId: string, storyId: string) => `/api/comments/chapter/${chapterId}/story/${storyId}`,
	getRootCommentsByStory: (storyId: string) => `/api/comments/story/${storyId}/root`,
	getRepliesByParentId: (parentId: string | number) => `/api/comments/parent/${parentId}/replies`,
	updateComment: (commentId: string) => `/api/comments/${commentId}`,
	deleteComment: (commentId: string) => `/api/comments/${commentId}/delete`,
	blockComment: (commentId: string) => `/api/comments/${commentId}/block`,
	
	// Rating Service
	rating: (storyId: string) => `/api/rating/${storyId}`,
	getRating: (storyId: string | number) => `/api/rating/${storyId}`,
	getUserRating: (userId: string | number, storyId: string | number) => `/api/rating/user/${userId}/story/${storyId}`,
	submitRating: () => '/api/rating',

	// Search & Recommendation
	recommend: () => '/recommend',

	// Payment Service
	paymentDeposit: () => '/api/payment/deposit',
	paymentPurchaseStory: () => '/api/payment/purchase-story',
	paymentHistory: () => '/api/payment/user/history',
	paymentTransaction: (transactionId: string) => `/api/payment/transaction/${transactionId}`,

	// Notification Service
	getNotifications: (userId: string | number) => `/api/notification/user/${userId}`,
	markNotificationAsRead: (notificationId: string | number) => `/api/notification/${notificationId}/read`,
};


