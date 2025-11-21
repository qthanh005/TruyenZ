import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastProps {
	toast: Toast;
	onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Trigger animation
		setTimeout(() => setIsVisible(true), 10);

		// Auto remove
		const duration = toast.duration || 3000;
		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(() => onRemove(toast.id), 300); // Wait for fade out animation
		}, duration);

		return () => clearTimeout(timer);
	}, [toast.id, toast.duration, onRemove]);

	const getIcon = () => {
		switch (toast.type) {
			case 'success':
				return <CheckCircle2 className="h-5 w-5" />;
			case 'error':
				return <XCircle className="h-5 w-5" />;
			case 'warning':
				return <AlertCircle className="h-5 w-5" />;
			case 'info':
				return <Info className="h-5 w-5" />;
		}
	};

	const getStyles = () => {
		switch (toast.type) {
			case 'success':
				return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400';
			case 'error':
				return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400';
			case 'warning':
				return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
			case 'info':
				return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
		}
	};

	return (
		<div
			className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${
				isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
			} ${getStyles()}`}
		>
			{getIcon()}
			<p className="flex-1 text-sm font-medium">{toast.message}</p>
			<button
				onClick={() => {
					setIsVisible(false);
					setTimeout(() => onRemove(toast.id), 300);
				}}
				className="rounded p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
	return (
		<div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
			))}
		</div>
	);
}

