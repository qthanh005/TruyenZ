import { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info';

export interface ConfirmationOptions {
	title?: string;
	message: string;
	type?: ConfirmationType;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel?: () => void;
}

interface ConfirmationModalProps {
	isOpen: boolean;
	options: ConfirmationOptions | null;
	onClose: () => void;
}

function ConfirmationModal({ isOpen, options, onClose }: ConfirmationModalProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isOpen) {
			// Trigger animation
			setTimeout(() => setIsVisible(true), 10);
		} else {
			setIsVisible(false);
		}
	}, [isOpen]);

	if (!isOpen || !options) return null;

	const handleConfirm = () => {
		options.onConfirm();
		onClose();
	};

	const handleCancel = () => {
		if (options.onCancel) {
			options.onCancel();
		}
		onClose();
	};

	const getIcon = () => {
		const iconClass = 'h-6 w-6';
		switch (options.type || 'warning') {
			case 'danger':
				return <XCircle className={`${iconClass} text-red-500`} />;
			case 'warning':
				return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
			case 'info':
				return <Info className={`${iconClass} text-blue-500`} />;
		}
	};

	const getButtonStyles = () => {
		switch (options.type || 'warning') {
			case 'danger':
				return {
					confirm: 'bg-red-500 hover:bg-red-600 text-white',
					border: 'border-red-200 dark:border-red-800',
				};
			case 'warning':
				return {
					confirm: 'bg-yellow-500 hover:bg-yellow-600 text-white',
					border: 'border-yellow-200 dark:border-yellow-800',
				};
			case 'info':
				return {
					confirm: 'bg-blue-500 hover:bg-blue-600 text-white',
					border: 'border-blue-200 dark:border-blue-800',
				};
		}
	};

	const buttonStyles = getButtonStyles();

	return (
		<div
			className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-300 ${
				isVisible ? 'opacity-100' : 'opacity-0'
			}`}
			onClick={handleCancel}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

			{/* Modal */}
			<div
				className={`relative w-full max-w-md rounded-2xl border bg-white shadow-2xl transition-all duration-300 dark:bg-zinc-900 ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				} ${buttonStyles.border}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center gap-4 border-b border-zinc-200 p-6 dark:border-zinc-800">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
						{getIcon()}
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
							{options.title || (options.type === 'danger' ? 'Xác nhận xóa' : 'Xác nhận')}
						</h3>
					</div>
					<button
						onClick={handleCancel}
						className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
						{options.message}
					</p>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-t border-zinc-200 p-6 dark:border-zinc-800">
					<button
						onClick={handleCancel}
						className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
					>
						{options.cancelText || 'Hủy'}
					</button>
					<button
						onClick={handleConfirm}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonStyles.confirm}`}
					>
						{options.confirmText || (options.type === 'danger' ? 'Xóa' : 'Xác nhận')}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ConfirmationModal;

