import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, endpoints } from '@/services/apiClient';
import { useWalletStore } from './walletStore';

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
	hasAccess: (storyId: string | number) => boolean;
	checkPurchase: (storyId: string | number) => Promise<boolean>;
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

					// Mua thành công - lưu vào purchases với key là string
					const storyIdStr = String(checkoutStory.id);
					set((state) => ({
						purchases: {
							...state.purchases,
							[storyIdStr]: {
								storyId: storyIdStr,
								price: checkoutStory.price,
								method,
								purchasedAt: new Date().toISOString(),
							},
						},
						checkoutStory: undefined,
						isProcessing: false,
					}));

					// Sync balance sau khi mua thành công
					const walletStore = useWalletStore.getState();
					walletStore.syncBalance().catch((err) => {
						console.error('Failed to sync balance after purchase:', err);
					});
				} catch (error) {
					const message = axios.isAxiosError(error)
						? error.response?.data?.message || error.response?.data?.error || 'Thanh toán thất bại, vui lòng thử lại.'
						: 'Thanh toán thất bại, vui lòng thử lại.';
					set({ error: message, isProcessing: false });
				}
			},
			hasAccess(storyId) {
				// Check trong localStorage trước (fast check)
				const storyIdStr = String(storyId);
				return Boolean(get().purchases[storyIdStr]);
			},
			async checkPurchase(storyId) {
				// Check từ backend để đảm bảo chính xác
				const storyIdStr = String(storyId);
				try {
					console.log(`[PremiumStore] Checking purchase for storyId: ${storyIdStr}`);
					const response = await api.get<{ purchased: boolean }>(endpoints.checkStoryPurchase(storyId));
					const hasPurchased = response.data?.purchased || false;
					console.log(`[PremiumStore] Purchase check result for storyId ${storyIdStr}: ${hasPurchased}`);
					
					// Update localStorage nếu có purchase
					if (hasPurchased) {
						const existingPurchase = get().purchases[storyIdStr];
						if (!existingPurchase) {
							// Thêm vào purchases nếu chưa có
							set((state) => ({
								purchases: {
									...state.purchases,
									[storyIdStr]: {
										storyId: storyIdStr,
										price: 0, // Không biết price từ API này
										method: 'vnpay',
										purchasedAt: new Date().toISOString(),
									},
								},
							}));
							console.log(`[PremiumStore] Added purchase record for storyId: ${storyIdStr}`);
						}
					} else {
						// Nếu không có purchase, xóa khỏi localStorage để đảm bảo sync
						const existingPurchase = get().purchases[storyIdStr];
						if (existingPurchase) {
							set((state) => {
								const newPurchases = { ...state.purchases };
								delete newPurchases[storyIdStr];
								return { purchases: newPurchases };
							});
							console.log(`[PremiumStore] Removed purchase record for storyId: ${storyIdStr} (not purchased)`);
						}
					}
					
					return hasPurchased;
				} catch (error) {
					// Nếu API fail, fallback về localStorage check
					console.error(`[PremiumStore] Failed to check purchase from backend for storyId ${storyIdStr}:`, error);
					const localAccess = get().hasAccess(storyId);
					console.log(`[PremiumStore] Fallback to localStorage check for storyId ${storyIdStr}: ${localAccess}`);
					return localAccess;
				}
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


