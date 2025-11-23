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

// Reaction types
export type ReactionType = 'LIKE' | 'TYM' | 'HAHA' | 'SAD' | 'ANGRY' | 'WOW';

export type ReactionRequest = {
	userId: number;
	commentId: number;
	type: ReactionType;
	authorId?: number | null;
	storyId?: number | null;
};

export type ReactionResponse = {
	commentId: number;
	type: ReactionType | null;
	userId: number;
	likeCount: number;
	tymCount: number;
	hahaCount: number;
	sadCount: number;
	angryCount: number;
	wowCount: number;
};

