import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, endpoints } from '@/services/apiClient';

export type PaymentMethod = 'vnpay';

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
	purchaseStory: (payload: { method: PaymentMethod }) => Promise<void>;
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

				const storyId = Number(checkoutStory.id);
				if (!Number.isFinite(storyId) || storyId <= 0) {
					set({ error: 'ID truyện không hợp lệ.', isProcessing: false });
					return;
				}

				set({ isProcessing: true, error: undefined });

				try {
					await api.post(endpoints.paymentPurchaseStory(), {
						storyId,
						price: checkoutStory.price,
					});

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
				} catch (error) {
					const message = axios.isAxiosError(error)
						? error.response?.data?.message || error.response?.data?.error || 'Thanh toán thất bại, vui lòng thử lại.'
						: 'Thanh toán thất bại, vui lòng thử lại.';
					set({ error: message, isProcessing: false });
				}
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


