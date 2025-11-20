import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { AlertCircle, Coins, Loader2, ShieldCheck, Smartphone, X } from 'lucide-react';

import { usePremiumStore, PaymentMethod } from '@/shared/stores/premiumStore';
import { useWalletStore } from '@/shared/stores/walletStore';

const PAYMENT_METHOD: PaymentMethod = 'vnpay';

export function CheckoutModal() {
	const { checkoutStory, closeCheckout, purchaseStory, isProcessing, error } = usePremiumStore((state) => ({
		checkoutStory: state.checkoutStory,
		closeCheckout: state.closeCheckout,
		purchaseStory: state.purchaseStory,
		isProcessing: state.isProcessing,
		error: state.error,
	}));

	const { balance, syncBalance, open: openTopUp } = useWalletStore();
	const [isCheckingBalance, setIsCheckingBalance] = useState(false);
	const [insufficientBalance, setInsufficientBalance] = useState(false);
	const [wasProcessing, setWasProcessing] = useState(false);

	// Sync balance khi mở modal
	useEffect(() => {
		if (checkoutStory) {
			setIsCheckingBalance(true);
			syncBalance().finally(() => setIsCheckingBalance(false));
		}
	}, [checkoutStory, syncBalance]);

	// Kiểm tra số dư sau khi sync
	useEffect(() => {
		if (checkoutStory && !isCheckingBalance) {
			setInsufficientBalance(balance < checkoutStory.price);
		}
	}, [balance, checkoutStory, isCheckingBalance]);

	// Sync balance sau khi mua thành công (khi isProcessing chuyển từ true -> false và không có error)
	useEffect(() => {
		if (wasProcessing && !isProcessing && !error && checkoutStory) {
			// Purchase thành công - sync balance ngay lập tức
			setTimeout(() => {
				syncBalance();
			}, 500); // Đợi một chút để backend cập nhật xong
		}
		setWasProcessing(isProcessing);
	}, [isProcessing, error, checkoutStory, syncBalance, wasProcessing]);

	if (!checkoutStory) return null;

	const priceFormatted = new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
	}).format(checkoutStory.price);

	const balanceFormatted = new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0,
	}).format(balance);

	const handleTopUp = () => {
		closeCheckout();
		openTopUp();
	};

	const handleClose = () => {
		if (isProcessing) return;
		closeCheckout();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		
		// Kiểm tra số dư trước khi mua
		if (insufficientBalance) {
			return;
		}

		await purchaseStory({
			method: PAYMENT_METHOD,
		});
		// Balance sẽ được sync tự động qua callback onPurchaseSuccess
	};

	const modalContent = (
		<div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 py-8">
			<div className="absolute inset-0 bg-black/40" onClick={handleClose} />
			<div className="relative z-[9999] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
					<div>
						<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Thanh toán truyện premium</h2>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">Bạn sắp mua “{checkoutStory.title}”</p>
					</div>
					<button
						className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						onClick={handleClose}
						aria-label="Đóng"
						disabled={isProcessing}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
					{isCheckingBalance ? (
						<div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
							<Loader2 className="h-4 w-4 animate-spin text-brand" />
							<span className="text-sm text-zinc-600 dark:text-zinc-400">Đang kiểm tra số dư...</span>
						</div>
					) : (
						<>
							<div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
								<div className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium text-zinc-700 dark:text-zinc-300">Số dư hiện tại</span>
										<span className={`text-lg font-semibold ${insufficientBalance ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
											{balanceFormatted}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium text-zinc-700 dark:text-zinc-300">Giá truyện</span>
										<span className="text-lg font-semibold text-brand">{priceFormatted}</span>
									</div>
									{insufficientBalance && (
										<div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
											<div className="flex items-center gap-2">
												<AlertCircle className="h-4 w-4" />
												<span>Số dư không đủ. Bạn cần nạp thêm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(checkoutStory.price - balance)}</span>
											</div>
										</div>
									)}
								</div>
							</div>

							{insufficientBalance && (
								<div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
											<Coins className="h-4 w-4" />
											<span>Số dư không đủ để mua truyện này</span>
										</div>
										<button
											type="button"
											onClick={handleTopUp}
											className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
										>
											Nạp tiền ngay
										</button>
									</div>
								</div>
							)}
						</>
					)}

					<div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
						<div className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							<span>Thanh toán an toàn • Sử dụng số dư ví để mua</span>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
						<div className="flex items-center gap-3">
							<Coins className="h-5 w-5 text-brand" />
							<div>
								<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Thanh toán bằng số dư ví</p>
								<p className="text-xs text-zinc-500 dark:text-zinc-400">
									Số tiền sẽ được trừ trực tiếp từ số dư ví của bạn.
								</p>
							</div>
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200">
							{error}
						</div>
					)}

					<button
						type="submit"
						className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={isProcessing || isCheckingBalance || insufficientBalance}
					>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Đang xử lý giao dịch...
							</>
						) : insufficientBalance ? (
							<>
								<AlertCircle className="h-4 w-4" />
								Số dư không đủ
							</>
						) : (
							<>
								<Coins className="h-4 w-4" />
								Mua truyện ({priceFormatted})
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}


