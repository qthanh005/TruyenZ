import { createPortal } from 'react-dom';
import { Loader2, ShieldCheck, Smartphone, X } from 'lucide-react';

import { usePremiumStore, PaymentMethod } from '@/shared/stores/premiumStore';

const PAYMENT_METHOD: PaymentMethod = 'vnpay';

export function CheckoutModal() {
	const { checkoutStory, closeCheckout, purchaseStory, isProcessing, error } = usePremiumStore((state) => ({
		checkoutStory: state.checkoutStory,
		closeCheckout: state.closeCheckout,
		purchaseStory: state.purchaseStory,
		isProcessing: state.isProcessing,
		error: state.error,
	}));

	if (!checkoutStory) return null;

	const priceFormatted = new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
	}).format(checkoutStory.price);

	const handleClose = () => {
		if (isProcessing) return;
		closeCheckout();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		await purchaseStory({
			method: PAYMENT_METHOD,
		});
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
					<div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
						<div className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							<span>Thanh toán an toàn • Sử dụng thử nghiệm (demo)</span>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium text-zinc-700 dark:text-zinc-300">Giá truyện</span>
							<span className="text-lg font-semibold text-brand">{priceFormatted}</span>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
						<div className="flex items-center gap-3">
							<Smartphone className="h-5 w-5 text-brand" />
							<div>
								<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">VNPay (mặc định)</p>
								<p className="text-xs text-zinc-500 dark:text-zinc-400">
									Bạn sẽ được chuyển tới cổng VNPay (demo) sau khi xác nhận thanh toán.
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
						disabled={isProcessing}
					>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Đang xử lý giao dịch...
							</>
						) : (
							<>
								<Smartphone className="h-4 w-4" />
								Thanh toán qua VNPay ({priceFormatted})
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}


