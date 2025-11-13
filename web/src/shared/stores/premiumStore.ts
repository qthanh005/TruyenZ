import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PaymentMethod = 'card' | 'momo' | 'vnpay';

export type CheckoutStory = {
	id: string;
	title: string;
	price: number;
};

type PurchaseRecord = {
	storyId: string;
	price: number;
	method: PaymentMethod;
	purchasedAt: string;
};

type PremiumState = {
	purchases: Record<string, PurchaseRecord>;
	checkoutStory?: CheckoutStory;
	isProcessing: boolean;
	error?: string;
	openCheckout: (story: CheckoutStory) => void;
	closeCheckout: () => void;
	purchaseStory: (payload: { method: PaymentMethod; cardholder?: string; cardNumber?: string; email?: string }) => Promise<void>;
	hasAccess: (storyId: string) => boolean;
};

export const usePremiumStore = create<PremiumState>()(
	persist(
		(set, get) => ({
			purchases: {},
			checkoutStory: undefined,
			isProcessing: false,
			error: undefined,
			openCheckout(story) {
				set({ checkoutStory: story, error: undefined });
			},
			closeCheckout() {
				set({ checkoutStory: undefined, isProcessing: false, error: undefined });
			},
			async purchaseStory({ method }) {
				const { checkoutStory } = get();
				if (!checkoutStory) {
					set({ error: 'Không tìm thấy thông tin truyện.', isProcessing: false });
					return;
				}

				set({ isProcessing: true, error: undefined });

				// Giả lập gọi API tới cổng thanh toán
				await new Promise((resolve) => setTimeout(resolve, 1600));

				set((state) => ({
					purchases: {
						...state.purchases,
						[checkoutStory.id]: {
							storyId: checkoutStory.id,
							price: checkoutStory.price,
							method,
							purchasedAt: new Date().toISOString(),
						},
					},
					checkoutStory: undefined,
					isProcessing: false,
				}));
			},
			hasAccess(storyId) {
				return Boolean(get().purchases[storyId]);
			},
		}),
		{
			name: 'truyenz-premium-storage',
			partialize: (state) => ({
				purchases: state.purchases,
			}),
		}
	)
);


