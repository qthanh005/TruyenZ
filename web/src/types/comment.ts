// TypeScript types for Comment Service

export type CommentRequest = {
	storyId: number;
	chapterId?: number | null;
	userId: number;
	parentId?: number | null;
	storyAuthorId?: number | null;
	content: string;
};

export type CommentResponse = {
	id: number;
	storyId: number;
	chapterId?: number | null;
	userId: number;
	parentId?: number | null;
	content: string;
	storyAuthorId?: number | null;
	createdAt: string;
	updatedAt: string;
};

export type Comment = CommentResponse;

// Comment with user info for display
export type CommentWithUser = CommentResponse & {
	user?: {
		username: string;
		avatarUrl?: string | null;
	};
};

