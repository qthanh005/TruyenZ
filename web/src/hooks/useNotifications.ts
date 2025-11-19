import { useState, useEffect, useCallback } from 'react';
import { api, endpoints } from '@/services/apiClient';
import { Notification } from '@/types/notification';
import { useAuth } from '@/providers/AuthProvider';
import { User } from 'oidc-client-ts';

export function useNotifications() {
	const { user, isAuthenticated } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<number | null>(null);

	// Fetch user ID from API
	useEffect(() => {
		if (!isAuthenticated) {
			setUserId(null);
			return;
		}

		const fetchUserId = async () => {
			try {
				const response = await api.get(endpoints.me());
				if (response.data?.id) {
					setUserId(response.data.id);
				} else if (response.data?.userId) {
					setUserId(response.data.userId);
				}
			} catch (err) {
				console.error('Failed to fetch user ID:', err);
				// Fallback: try to extract from user object
				if (user) {
					if (user instanceof User) {
						// OAuth user - try to get from profile
						const profile = user.profile as any;
						if (profile?.sub) {
							// Try to parse as number if possible
							const parsed = parseInt(profile.sub, 10);
							if (!isNaN(parsed)) {
								setUserId(parsed);
							}
						}
					} else {
						// Email user
						const emailUser = user as any;
						if (emailUser.id) {
							const parsed = parseInt(emailUser.id, 10);
							if (!isNaN(parsed)) {
								setUserId(parsed);
							}
						}
					}
				}
			}
		};

		fetchUserId();
	}, [isAuthenticated, user]);

	const fetchNotifications = useCallback(async () => {
		if (!isAuthenticated || !userId) {
			setNotifications([]);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const response = await api.get<Notification[]>(endpoints.getNotifications(userId));
			setNotifications(response.data || []);
		} catch (err: any) {
			console.error('Failed to fetch notifications:', err);
			setError(err.response?.data?.message || 'Không thể tải thông báo');
			setNotifications([]);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, userId]);

	useEffect(() => {
		fetchNotifications();
		// Poll for new notifications every 5 seconds
		const interval = setInterval(fetchNotifications, 5000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	const unreadCount = notifications.filter((n) => !n.isDeleted && !n.isRead).length;

	return {
		notifications,
		loading,
		error,
		unreadCount,
		refresh: fetchNotifications,
	};
}

