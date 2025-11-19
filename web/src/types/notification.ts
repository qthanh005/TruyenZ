export interface Notification {
	id: number;
	recipientId: number;
	senderId: number;
	content: string;
	link: string;
	typeId?: number;
	isDeleted: boolean;
	isRead: boolean;
	createdAt: string;
}

