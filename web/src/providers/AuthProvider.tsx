import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { oauthConfig } from '@/shared/config/env';

type AuthContextValue = {
	manager: UserManager;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (redirectTo?: string) => Promise<void>;
	logout: () => Promise<void>;
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
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		manager.getUser().then((u) => {
			setUser(u);
			setIsLoading(false);
		});
		const onUserLoaded = (u: User) => setUser(u);
		const onUserUnloaded = () => setUser(null);
		manager.events.addUserLoaded(onUserLoaded);
		manager.events.addUserUnloaded(onUserUnloaded);
		return () => {
			manager.events.removeUserLoaded(onUserLoaded);
			manager.events.removeUserUnloaded(onUserUnloaded);
		};
	}, [manager]);

	const value = useMemo<AuthContextValue>(() => ({
		manager,
		user,
		isAuthenticated: Boolean(user && !user.expired),
		isLoading,
		login: async (redirectTo?: string) => {
			await manager.clearStaleState();
			await manager.signinRedirect({ state: { redirectTo } });
		},
		logout: async () => {
			await manager.signoutRedirect();
		}
	}), [manager, user, isLoading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}


