// Centralized environment-like config for frontend-only setup
export const apiConfig = {
	gatewayBaseUrl: import.meta.env.VITE_API_GATEWAY_URL || 'https://api.truyenz.example.com',
};

export const oauthConfig = {
	issuer: import.meta.env.VITE_OAUTH_ISSUER || 'https://auth.example.com/realms/truyenz',
	clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || 'truyenz-web',
	redirectUri: (import.meta.env.VITE_OAUTH_REDIRECT_URI as string) || `${window.location.origin}/oauth/callback`,
	postLogoutRedirectUri: (import.meta.env.VITE_OAUTH_POST_LOGOUT_REDIRECT_URI as string) || window.location.origin,
	scope: import.meta.env.VITE_OAUTH_SCOPE || 'openid profile email',
};


