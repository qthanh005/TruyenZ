import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, endpoints } from '@/services/apiClient';

import type { PaymentMethod } from './premiumStore';

type DepositResponse = {
	paymentUrl: string;
	transactionId?: string;
	message?: string;
};

type BalanceResponse = {
	balance: number | string;
};

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

type PaymentRecord = {
	transactionId: string;
	amount: number;
	status: PaymentStatus;
	paymentType: 'DEPOSIT' | 'PURCHASE';
	description?: string;
};

type WalletState = {
	balance: number;
	isOpen: boolean;
	isProcessing: boolean;
	isSyncing: boolean;
	error?: string;
	lastTopUp?: {
		amount: number;
		method: PaymentMethod;
		at: string;
		transactionId?: string;
		status?: PaymentStatus;
	};
	open: () => void;
	close: () => void;
	topUp: (payload: { amount: number; method: PaymentMethod }) => Promise<void>;
	syncBalance: () => Promise<void>;
	confirmLastTopUp: () => Promise<PaymentStatus | undefined>;
	resetError: () => void;
};

export const useWalletStore = create<WalletState>()(
	persist(
		(set, get) => ({
			balance: 0,
			isOpen: false,
			isProcessing: false,
			isSyncing: false,
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

				try {
					const { data } = await api.post<DepositResponse>(endpoints.paymentDeposit(), {
						amount,
						description: `Nạp ví TruyenZ qua ${method.toUpperCase()}`,
					});

					if (!data?.paymentUrl) {
						throw new Error('Không nhận được liên kết thanh toán từ máy chủ.');
					}

					set({
						lastTopUp: {
							amount,
							method,
							at: new Date().toISOString(),
							transactionId: data.transactionId,
							status: 'PENDING',
						},
						isProcessing: false,
						isOpen: false,
					});

					if (typeof window !== 'undefined') {
						window.location.href = data.paymentUrl;
					}
				} catch (error) {
					const message = axios.isAxiosError(error)
						? error.response?.data?.message || error.response?.data?.error || 'Không thể tạo yêu cầu nạp tiền.'
						: error instanceof Error
							? error.message
							: 'Không thể tạo yêu cầu nạp tiền.';

					set({ error: message, isProcessing: false });
				}
			},
			async syncBalance() {
				set({ isSyncing: true });
				try {
					const { data } = await api.get<BalanceResponse>(endpoints.balance());
					const normalized = data?.balance !== undefined ? Number(data.balance) : NaN;
					set({
						balance: Number.isFinite(normalized) ? normalized : 0,
						isSyncing: false,
					});
				} catch (error) {
					const message = axios.isAxiosError(error)
						? error.response?.data?.message || error.response?.data?.error || 'Không thể đồng bộ số dư.'
						: 'Không thể đồng bộ số dư.';
					set({ isSyncing: false, error: message });
				}
			},
			async confirmLastTopUp() {
				const { lastTopUp } = get();
				if (!lastTopUp?.transactionId) return undefined;

				try {
					const { data } = await api.get<PaymentRecord>(
						endpoints.paymentTransaction(lastTopUp.transactionId)
					);

					if (data.paymentType !== 'DEPOSIT') {
						return data.status;
					}

					set((state) => ({
						lastTopUp: state.lastTopUp
							? {
									...state.lastTopUp,
									status: data.status,
							  }
							: state.lastTopUp,
					}));

					if (data.status === 'SUCCESS') {
						await get().syncBalance();
					}

					if (data.status === 'FAILED') {
						set({ error: 'Giao dịch VNPay thất bại, vui lòng thử lại.' });
					}

					return data.status;
				} catch (error) {
					const message = axios.isAxiosError(error)
						? error.response?.data?.message || error.response?.data?.error || 'Không thể kiểm tra trạng thái thanh toán.'
						: 'Không thể kiểm tra trạng thái thanh toán.';
					set({ error: message });
					return undefined;
				}
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


