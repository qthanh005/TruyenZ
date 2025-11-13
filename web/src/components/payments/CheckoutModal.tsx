import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Loader2, ShieldCheck, Smartphone, X } from 'lucide-react';

import { usePremiumStore, PaymentMethod } from '@/shared/stores/premiumStore';

const paymentMethods: { method: PaymentMethod; label: string; icon: JSX.Element }[] = [
	{ method: 'card', label: 'Thẻ quốc tế (Visa/Mastercard)', icon: <CreditCard className="h-4 w-4" /> },
	{ method: 'momo', label: 'Momo', icon: <Smartphone className="h-4 w-4" /> },
	{ method: 'vnpay', label: 'VNPay', icon: <Smartphone className="h-4 w-4" /> },
];

export function CheckoutModal() {
	const { checkoutStory, closeCheckout, purchaseStory, isProcessing, error } = usePremiumStore((state) => ({
		checkoutStory: state.checkoutStory,
		closeCheckout: state.closeCheckout,
		purchaseStory: state.purchaseStory,
		isProcessing: state.isProcessing,
		error: state.error,
	}));

	const [method, setMethod] = useState<PaymentMethod>('card');
	const [cardholder, setCardholder] = useState('');
	const [cardNumber, setCardNumber] = useState('');
	const [expiry, setExpiry] = useState('');
	const [cvc, setCvc] = useState('');
	const [email, setEmail] = useState('');

	if (!checkoutStory) return null;

	const priceFormatted = new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
	}).format(checkoutStory.price);

	const resetForm = () => {
		setCardholder('');
		setCardNumber('');
		setExpiry('');
		setCvc('');
		setEmail('');
		setMethod('card');
	};

	const handleClose = () => {
		if (isProcessing) return;
		resetForm();
		closeCheckout();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		await purchaseStory({
			method,
			cardholder,
			cardNumber,
			email,
		});
		if (!usePremiumStore.getState().checkoutStory) {
			resetForm();
		}
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

					<div>
						<p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Chọn phương thức</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-3">
							{paymentMethods.map((item) => {
								const active = method === item.method;
								return (
									<button
										type="button"
										key={item.method}
										onClick={() => setMethod(item.method)}
										className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
											active
												? 'border-brand bg-brand/10 text-brand'
												: 'border-zinc-200 text-zinc-500 hover:border-brand/40 hover:text-brand dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-brand/50'
										}`}
										disabled={isProcessing}
									>
										{item.icon}
										<span>{item.label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{method === 'card' && (
						<div className="space-y-4">
							<div>
								<label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
									Tên chủ thẻ
								</label>
								<input
									className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-zinc-700 dark:bg-zinc-900"
									placeholder="VD: NGUYEN VAN A"
									value={cardholder}
									onChange={(event) => setCardholder(event.target.value.toUpperCase())}
									required
									disabled={isProcessing}
								/>
							</div>
							<div>
								<label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
									Số thẻ
								</label>
								<input
									className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-zinc-700 dark:bg-zinc-900"
									placeholder="4111 1111 1111 1111"
									value={cardNumber}
									onChange={(event) => setCardNumber(event.target.value.replace(/[^0-9 ]/g, ''))}
									required
									maxLength={19}
									disabled={isProcessing}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
										Ngày hết hạn
									</label>
									<input
										className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-zinc-700 dark:bg-zinc-900"
										placeholder="MM/YY"
										value={expiry}
										onChange={(event) => setExpiry(event.target.value.replace(/[^0-9/]/g, ''))}
										required
										disabled={isProcessing}
									/>
								</div>
								<div>
									<label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
										CVC
									</label>
									<input
										className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-zinc-700 dark:bg-zinc-900"
										placeholder="123"
										value={cvc}
										onChange={(event) => setCvc(event.target.value.replace(/[^0-9]/g, ''))}
										required
										maxLength={4}
										disabled={isProcessing}
									/>
								</div>
							</div>
						</div>
					)}

					{method !== 'card' && (
						<div>
							<label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
								Email nhận hóa đơn
							</label>
							<input
								type="email"
								className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-zinc-700 dark:bg-zinc-900"
								placeholder="your@email.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								disabled={isProcessing}
							/>
							<p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
								Sau khi bấm thanh toán, mã QR hoặc liên kết cổng thanh toán sẽ được giả lập cho mục đích demo.
							</p>
						</div>
					)}

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
								<CreditCard className="h-4 w-4" />
								Thanh toán {priceFormatted}
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}


