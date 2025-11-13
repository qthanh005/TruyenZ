import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, PiggyBank, Smartphone, Wallet, X } from 'lucide-react';

import { useWalletStore } from '@/shared/stores/walletStore';
import type { PaymentMethod } from '@/shared/stores/premiumStore';

const AMOUNTS = [50000, 100000, 200000, 500000];

const paymentMethods: { method: PaymentMethod; label: string; icon: JSX.Element }[] = [
	{ method: 'card', label: 'Thẻ quốc tế', icon: <Wallet className="h-4 w-4" /> },
	{ method: 'momo', label: 'Momo', icon: <Smartphone className="h-4 w-4" /> },
	{ method: 'vnpay', label: 'VNPay', icon: <Smartphone className="h-4 w-4" /> },
];

export function TopUpModal() {
	const { isOpen, close, topUp, isProcessing, error, balance, resetError } = useWalletStore((state) => ({
		isOpen: state.isOpen,
		close: state.close,
		topUp: state.topUp,
		isProcessing: state.isProcessing,
		error: state.error,
		balance: state.balance,
		resetError: state.resetError,
	}));
	const [amount, setAmount] = useState(AMOUNTS[1]);
	const [method, setMethod] = useState<PaymentMethod>('card');
	const [customAmount, setCustomAmount] = useState('');

	const formatCurrency = useMemo(
		() => (value: number) =>
			new Intl.NumberFormat('vi-VN', {
				style: 'currency',
				currency: 'VND',
				maximumFractionDigits: 0,
			}).format(value),
		[]
	);

	if (!isOpen) return null;

	const currentAmount = amount === -1 ? Number(customAmount.replace(/\D/g, '')) || 0 : amount;

	const handleSelectAmount = (value: number) => {
		resetError();
		setCustomAmount('');
		setAmount(value);
	};

	const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		resetError();
		setAmount(-1);
		setCustomAmount(event.target.value.replace(/\D/g, ''));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		await topUp({
			amount: currentAmount,
			method,
		});
		setCustomAmount('');
		setAmount(AMOUNTS[1]);
		setMethod('card');
	};

	const modalContent = (
		<div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 py-8">
			<div className="absolute inset-0 bg-black/40" onClick={() => close()} />
			<div className="relative z-[9999] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
				<div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
					<div>
						<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Nạp tiền vào ví TruyenZ</h2>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Số dư hiện tại: <span className="font-semibold text-brand">{formatCurrency(balance)}</span>
						</p>
					</div>
					<button
						className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						onClick={() => close()}
						aria-label="Đóng"
						disabled={isProcessing}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
					<div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
						<div className="flex items-center gap-2">
							<PiggyBank className="h-4 w-4" />
							<span>Nạp tiền nhanh, thanh toán truyện premium thuận tiện.</span>
						</div>
					</div>

					<div>
						<p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Chọn số tiền</p>
						<div className="mt-3 grid grid-cols-2 gap-2">
							{AMOUNTS.map((value) => {
								const active = amount === value;
								return (
									<button
										type="button"
										key={value}
										onClick={() => handleSelectAmount(value)}
										className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
											active
												? 'border-brand bg-brand/10 text-brand'
												: 'border-zinc-200 text-zinc-600 hover:border-brand/40 hover:text-brand dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-brand/50'
										}`}
										disabled={isProcessing}
									>
										{formatCurrency(value)}
									</button>
								);
							})}
							<input
								type="text"
								value={customAmount}
								onChange={handleCustomChange}
								placeholder="Số khác..."
								className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800 dark:bg-zinc-900 ${
									amount === -1 ? 'border-brand text-brand' : 'border-zinc-200 text-zinc-600'
								}`}
								disabled={isProcessing}
							/>
						</div>
						<p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
							Tối thiểu 50.000đ. Các giao dịch trong môi trường demo sẽ không trừ tiền thật.
						</p>
					</div>

					<div>
						<p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Phương thức thanh toán</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-3">
							{paymentMethods.map((item) => {
								const active = method === item.method;
								return (
									<button
										type="button"
										key={item.method}
										onClick={() => {
											resetError();
											setMethod(item.method);
										}}
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

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200">
							{error}
						</div>
					)}

					<button
						type="submit"
						className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={isProcessing || currentAmount < 50000}
					>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Đang xử lý...
							</>
						) : (
							<>
								<PiggyBank className="h-4 w-4" />
								Nạp {formatCurrency(currentAmount)}
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}


