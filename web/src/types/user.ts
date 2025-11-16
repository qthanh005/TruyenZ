// TypeScript types for User Service

export type UserInfo = {
	id: number;
	username: string;
	email: string;
	avatarUrl?: string | null;
	bio?: string | null;
	role?: string;
};

