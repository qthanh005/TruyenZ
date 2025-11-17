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
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${user.access_token}`,
			};
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
	refresh: () => '/api/auth/refresh',
	logout: () => '/api/auth/logout',
	// User Service
	me: () => '/api/user/me',
	profile: (userId: string) => `/api/user/${userId}`,
	getUserById: (userId: string | number) => `/api/user/${userId}`,
	bookmarks: () => '/api/user/bookmarks',
	history: () => '/api/user/history',
	balance: () => '/api/user/balance',

	// Story Service
	stories: () => '/api/story',
	storyDetail: (id: string) => `/api/story/${id}`,
	chapters: (storyId: string) => `/api/story/${storyId}/chapters`,
	chapterById: (chapterId: string) => `/api/story/chapters/${chapterId}`,
	chapterContent: (storyId: string, chapterId: string) => `/api/story/${storyId}/chapters/${chapterId}`,
	searchStories: (q: string) => `/api/story/search?title=${encodeURIComponent(q)}`,

	// Comment Service
	createComment: () => '/api/comments',
	getCommentsByChapterAndStory: (chapterId: string, storyId: string) => `/api/comments/chapter/${chapterId}/story/${storyId}`,
	getRootCommentsByStory: (storyId: string) => `/api/comments/story/${storyId}/root`,
	updateComment: (commentId: string) => `/api/comments/${commentId}`,
	deleteComment: (commentId: string) => `/api/comments/${commentId}/delete`,
	blockComment: (commentId: string) => `/api/comments/${commentId}/block`,
	
	// Rating Service
	rating: (storyId: string) => `/api/rating/${storyId}`,

	// Search & Recommendation
	recommend: () => '/recommend',

	// Payment Service
	paymentDeposit: () => '/api/payment/deposit',
	paymentPurchaseStory: () => '/api/payment/purchase-story',
	paymentHistory: () => '/api/payment/user/history',
	paymentTransaction: (transactionId: string) => `/api/payment/transaction/${transactionId}`,
};


