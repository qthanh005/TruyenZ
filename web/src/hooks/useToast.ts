import { useCallback, useEffect, useState } from 'react';
import { Toast, ToastType } from '@/components/Toast';

let toastIdCounter = 0;
const toastListeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function notifyListeners() {
	toastListeners.forEach((listener) => listener([...toasts]));
}

function addToast(message: string, type: ToastType, duration?: number) {
	const id = `toast-${++toastIdCounter}`;
	const newToast: Toast = { id, message, type, duration };
	toasts = [...toasts, newToast];
	notifyListeners();
}

function removeToastById(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
	notifyListeners();
}

export function useToast() {
	const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
		addToast(message, type, duration);
	}, []);

	const success = useCallback((message: string, duration?: number) => {
		showToast(message, 'success', duration);
	}, [showToast]);

	const error = useCallback((message: string, duration?: number) => {
		showToast(message, 'error', duration);
	}, [showToast]);

	const warning = useCallback((message: string, duration?: number) => {
		showToast(message, 'warning', duration);
	}, [showToast]);

	const info = useCallback((message: string, duration?: number) => {
		showToast(message, 'info', duration);
	}, [showToast]);

	return {
		showToast,
		success,
		error,
		warning,
		info,
	};
}

export function useToastState() {
	const [state, setState] = useState<Toast[]>([]);

	useEffect(() => {
		const listener = (newToasts: Toast[]) => {
			setState(newToasts);
		};
		toastListeners.add(listener);
		setState([...toasts]);

		return () => {
			toastListeners.delete(listener);
		};
	}, []);

	const removeToast = useCallback((id: string) => {
		removeToastById(id);
	}, []);

	return { toasts: state, removeToast };
}

