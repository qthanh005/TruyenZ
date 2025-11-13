import axios from 'axios';
import { apiConfig } from '@/shared/config/env';
import { User } from 'oidc-client-ts';

export const api = axios.create({
	baseURL: apiConfig.gatewayBaseUrl,
	withCredentials: true,
});

export function attachToken(user: User | null) {
	api.interceptors.request.clear();
	api.interceptors.request.use((config) => {
		if (user?.access_token) {
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${user.access_token}`,
			};
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
	bookmarks: () => '/api/user/bookmarks',
	history: () => '/api/user/history',

	// Story Service
	stories: (q?: string) => (q ? `/story/search?q=${encodeURIComponent(q)}` : '/story/top'),
	storyDetail: (id: string) => `/story/${id}`,
	chapters: (storyId: string) => `/story/${storyId}/chapters`,
	chapterContent: (storyId: string, chapterId: string) => `/story/${storyId}/chapters/${chapterId}`,

	// Comment & Rating Service
	comments: (storyId: string, chapterId: string) => `/comment/${storyId}/${chapterId}`,
	addComment: (storyId: string, chapterId: string) => `/comment/${storyId}/${chapterId}`,
	rating: (storyId: string) => `/rating/${storyId}`,

	// Search & Recommendation
	recommend: () => '/recommend',
};


