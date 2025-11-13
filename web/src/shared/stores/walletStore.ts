import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PaymentMethod } from './premiumStore';

type WalletState = {
	balance: number;
	isOpen: boolean;
	isProcessing: boolean;
	error?: string;
	lastTopUp?: {
		amount: number;
		method: PaymentMethod;
		at: string;
	};
	open: () => void;
	close: () => void;
	topUp: (payload: { amount: number; method: PaymentMethod }) => Promise<void>;
	resetError: () => void;
};

export const useWalletStore = create<WalletState>()(
	persist(
		(set) => ({
			balance: 0,
			isOpen: false,
			isProcessing: false,
			error: undefined,
			lastTopUp: undefined,
			open() {
				set({ isOpen: true, error: undefined });
			},
			close() {
				set({ isOpen: false, isProcessing: false, error: undefined });
			},
			async topUp({ amount, method }) {
				if (amount <= 0) {
					set({ error: 'Số tiền nạp phải lớn hơn 0.' });
					return;
				}

				set({ isProcessing: true, error: undefined });

				// Giả lập thời gian xử lý thanh toán
				await new Promise((resolve) => setTimeout(resolve, 1200));

				set((state) => ({
					balance: state.balance + amount,
					lastTopUp: {
						amount,
						method,
						at: new Date().toISOString(),
					},
					isProcessing: false,
					isOpen: false,
				}));
			},
			resetError() {
				set({ error: undefined });
			},
		}),
		{
			name: 'truyenz-wallet-storage',
			partialize: (state) => ({
				balance: state.balance,
				lastTopUp: state.lastTopUp,
			}),
		}
	)
);


