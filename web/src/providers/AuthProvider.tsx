import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { oauthConfig } from '@/shared/config/env';
import { api, attachToken } from '@/services/apiClient';

type EmailUser = {
	id: string;
	email: string;
	name: string;
	role?: string;
	profile?: {
		name: string;
		preferred_username: string;
		email: string;
		role?: string;
	};
};

type AuthUser = User | EmailUser | null;

type AuthContextValue = {
	manager: UserManager;
	user: AuthUser;
	isAuthenticated: boolean;
	isLoading: boolean;
    login: (redirectTo?: string, provider?: 'oauth2' | 'facebook') => Promise<void>;
	logout: () => Promise<void>;
	refreshEmailUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createManager() {
	return new UserManager({
		authority: oauthConfig.issuer,
		client_id: oauthConfig.clientId,
		redirect_uri: oauthConfig.redirectUri,
		post_logout_redirect_uri: oauthConfig.postLogoutRedirectUri,
		response_type: 'code',
		scope: oauthConfig.scope,
		userStore: new WebStorageStateStore({ store: window.localStorage }),
		loadUserInfo: true,
		automaticSilentRenew: false,
	});
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [manager] = useState(createManager);
	const [user, setUser] = useState<AuthUser>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load user from localStorage (email/password) or OAuth
	useEffect(() => {
		const loadUser = async () => {
			// Check for email/password user first
			const token = localStorage.getItem('auth_token');
			const storedUser = localStorage.getItem('user');
			
			if (token && storedUser) {
				try {
					const emailUser: EmailUser = JSON.parse(storedUser);
					// Set token in API client
					api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
					setUser(emailUser);
					setIsLoading(false);
					return;
				} catch (e) {
					// Invalid stored user, clear it
					localStorage.removeItem('auth_token');
					localStorage.removeItem('user');
				}
			}

			// Try to load OAuth user
			try {
				const oauthUser = await manager.getUser();
				if (oauthUser && !oauthUser.expired) {
					setUser(oauthUser);
					attachToken(oauthUser);
				} else {
					setUser(null);
				}
			} catch (e) {
				setUser(null);
			}
			setIsLoading(false);
		};

		loadUser();

		const onUserLoaded = (u: User) => {
			// Clear email/password auth when OAuth user loads
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user');
			setUser(u);
			attachToken(u);
		};
		const onUserUnloaded = () => {
			setUser(null);
		};
		manager.events.addUserLoaded(onUserLoaded);
		manager.events.addUserUnloaded(onUserUnloaded);
		return () => {
			manager.events.removeUserLoaded(onUserLoaded);
			manager.events.removeUserUnloaded(onUserUnloaded);
		};
	}, [manager]);

	const refreshEmailUser = async () => {
		const token = localStorage.getItem('auth_token');
		if (!token) return;

		try {
			const response = await api.get('/user/me');
			if (response.data) {
				const emailUser: EmailUser = {
					id: response.data.id || response.data.userId,
					email: response.data.email,
					name: response.data.name || response.data.username,
					profile: {
						name: response.data.name || response.data.username,
						preferred_username: response.data.username || response.data.email,
						email: response.data.email,
					},
				};
				localStorage.setItem('user', JSON.stringify(emailUser));
				setUser(emailUser);
			}
		} catch (e) {
			console.error('Failed to refresh user:', e);
		}
	};

	const value = useMemo<AuthContextValue>(() => ({
		manager,
		user,
		isAuthenticated: Boolean(
			user && 
			((user instanceof User && !user.expired) || !(user instanceof User))
		),
		isLoading,
        login: async (redirectTo?: string, provider?: 'oauth2' | 'facebook') => {
            await manager.clearStaleState();
            if (provider === 'facebook') {
                await manager.signinRedirect({
                    state: { redirectTo },
                    // If using Keycloak or a brokered IdP, this hint selects Facebook IdP
                    extraQueryParams: { kc_idp_hint: 'facebook' },
                });
            } else {
                await manager.signinRedirect({ state: { redirectTo } });
            }
        },
		logout: async () => {
			// Clear email/password auth
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user');
			delete api.defaults.headers.common['Authorization'];
			
			// If OAuth user, use OAuth logout
			if (user instanceof User) {
				await manager.signoutRedirect();
			} else {
				// For email/password, just clear state
				setUser(null);
			}
		},
		refreshEmailUser,
	}), [manager, user, isLoading, refreshEmailUser]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}


