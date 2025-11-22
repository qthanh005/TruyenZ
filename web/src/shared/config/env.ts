// Centralized environment-like config for frontend-only setup
export const apiConfig = {
	gatewayBaseUrl: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8081',
};

export const crawlerConfig = {
	apiBaseUrl: import.meta.env.VITE_CRAWLER_API_URL || 'http://localhost:4000',
};

const defaultIssuer = 'https://auth.example.com/realms/truyenz';
const oauthIssuer = import.meta.env.VITE_OAUTH_ISSUER || defaultIssuer;

export const oauthConfig = {
	issuer: oauthIssuer,
	clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || 'truyenz-web',
	redirectUri: (import.meta.env.VITE_OAUTH_REDIRECT_URI as string) || `${window.location.origin}/oauth/callback`,
	postLogoutRedirectUri: (import.meta.env.VITE_OAUTH_POST_LOGOUT_REDIRECT_URI as string) || window.location.origin,
	scope: import.meta.env.VITE_OAUTH_SCOPE || 'openid profile email',
	// Check if OAuth is properly configured (not using the placeholder)
	isConfigured: oauthIssuer !== defaultIssuer && !oauthIssuer.includes('example.com'),
};


