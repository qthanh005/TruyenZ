import { useToastState } from '@/hooks/useToast';
import { ToastContainer } from './Toast';

export function ToastProvider() {
	const { toasts, removeToast } = useToastState();

	return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

