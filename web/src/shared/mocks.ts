export type MockStory = { id: string; title: string; author?: string; cover?: string; genres?: string[]; description?: string };
export type MockChapter = { id: string; name: string; index: number };
export type MockContentBlock = { type: 'text' | 'image'; value: string };
export type MockComment = { id: string; user: string; content: string; createdAt: string };

export const mockStories: MockStory[] = [
    { id: '1', title: 'Đại Chúa Tể', author: 'Thiên Tàm Thổ Đậu', cover: 'https://picsum.photos/300/400?random=1', genres: ['Huyền Huyễn', 'Hành Động'], description: 'Thiên tài tuyệt thế bước lên con đường xưng bá.' },
    { id: '2', title: 'Thám Tử Lừng Danh Conan', author: 'Aoyama Gosho', cover: 'https://picsum.photos/300/400?random=2', genres: ['Trinh Thám'], description: 'Câu chuyện về thám tử học sinh Conan.' },
    { id: '3', title: 'One Piece', author: 'Eiichiro Oda', cover: 'https://picsum.photos/300/400?random=3', genres: ['Phiêu Lưu'], description: 'Luffy tìm kho báu One Piece.' },
    { id: '4', title: 'Naruto', author: 'Masashi Kishimoto', cover: 'https://picsum.photos/300/400?random=4', genres: ['Hành Động'], description: 'Hành trình ninja Naruto.' },
    { id: '5', title: 'Attack on Titan', author: 'Hajime Isayama', cover: 'https://picsum.photos/300/400?random=5', genres: ['Kịch Tính'], description: 'Con người chống lại Titan.' },
    { id: '6', title: 'Solo Leveling', author: 'Chu-Gong', cover: 'https://picsum.photos/300/400?random=6', genres: ['Hành Động'], description: 'Thợ săn yếu nhất trở nên mạnh nhất.' },
    { id: '7', title: 'Doraemon', author: 'Fujiko F. Fujio', cover: 'https://picsum.photos/300/400?random=7', genres: ['Hài Hước'], description: 'Chú mèo máy đến từ tương lai.' },
    { id: '8', title: 'Kimetsu no Yaiba', author: 'Koyoharu Gotouge', cover: 'https://picsum.photos/300/400?random=8', genres: ['Hành Động'], description: 'Diệt quỷ cứu em gái.' },
    { id: '9', title: 'Jujutsu Kaisen', author: 'Gege Akutami', cover: 'https://picsum.photos/300/400?random=9', genres: ['Siêu Nhiên'], description: 'Chú thuật sư trừ tà.' },
    { id: '10', title: 'Spy x Family', author: 'Tatsuya Endo', cover: 'https://picsum.photos/300/400?random=10', genres: ['Gia Đình'], description: 'Gia đình mật vụ dễ thương.' },
];

export function getStoryById(id: string): MockStory | undefined {
    return mockStories.find((s) => s.id === id);
}

export function getChapters(storyId: string, count = 20): MockChapter[] {
    const base = Number(storyId) * 1000;
    return Array.from({ length: count }).map((_, i) => ({
        id: String(base + i + 1),
        name: `Chương ${i + 1}`,
        index: i + 1,
    }));
}

export function getChapterContent(storyId: string, chapterId: string): { id: string; name: string; index: number; prevId: string | null; nextId: string | null; content: MockContentBlock[] } {
    const chapters = getChapters(storyId, 20);
    const allIds = chapters.map((c) => c.id);
    const idx = allIds.indexOf(chapterId);
    const chapter = chapters[idx] || { id: chapterId, name: 'Chương', index: 1 };
    const content: MockContentBlock[] = [
        { type: 'text', value: 'Tóm tắt nội dung chương...' },
        { type: 'image', value: `https://picsum.photos/900/1200?random=${chapter.index}` },
        { type: 'image', value: `https://picsum.photos/900/1200?random=${chapter.index + 100}` },
        { type: 'text', value: 'Kết thúc chương.' },
    ];
    return {
        id: chapter.id,
        name: chapter.name,
        index: chapter.index,
        prevId: idx > 0 ? allIds[idx - 1] : null,
        nextId: idx >= 0 && idx < allIds.length - 1 ? allIds[idx + 1] : null,
        content,
    };
}

export function searchStories(q: string): MockStory[] {
    const nq = q.trim().toLowerCase();
    if (!nq) return [];
    return mockStories.filter((s) => s.title.toLowerCase().includes(nq)).slice(0, 8);
}

export const mockBookmarks = [
    { id: 'b1', title: 'Đại Chúa Tể' },
    { id: 'b2', title: 'One Piece' },
];

export const mockHistory = [
    { id: 'h1', title: 'Naruto - Chương 5' },
    { id: 'h2', title: 'Solo Leveling - Chương 12' },
];

export function getComments(storyId: string, page = 1, pageSize = 5): { items: MockComment[]; total: number } {
    const total = 23;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const items: MockComment[] = Array.from({ length: end - start }).map((_, i) => {
        const idx = start + i + 1;
        return {
            id: `${storyId}-c${idx}`,
            user: `User ${((idx - 1) % 7) + 1}`,
            content: `Bình luận số ${idx} cho truyện #${storyId}. Nội dung mẫu...`,
            createdAt: new Date(Date.now() - idx * 3600_000).toISOString(),
        };
    });
    return { items, total };
}

// Mock users for development/testing
export type MockUser = {
    id: string;
    email: string;
    name: string;
    password: string;
    role?: string;
};

export const mockUsers: MockUser[] = [
    {
        id: '1',
        email: 'admin@truyenz.com',
        name: 'Admin User',
        password: 'admin123',
        role: 'Admin',
    },
    {
        id: '2',
        email: 'user@truyenz.com',
        name: 'Test User',
        password: 'user123',
    },
];

export function findMockUser(email: string, password: string): MockUser | null {
    return mockUsers.find((u) => u.email === email && u.password === password) || null;
}

export function createMockUserResponse(user: MockUser) {
    return {
        token: `mock_token_${user.id}_${Date.now()}`,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.email.split('@')[0],
            role: user.role, // Role at top level
            profile: {
                name: user.name,
                preferred_username: user.email.split('@')[0],
                email: user.email,
                role: user.role, // Role also in profile for compatibility
            },
        },
    };
}


