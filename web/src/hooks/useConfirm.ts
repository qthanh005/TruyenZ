import { useState, useCallback, useEffect } from 'react';
import { ConfirmationOptions, ConfirmationType } from '@/components/ConfirmationModal';

let confirmationListeners = new Set<(options: ConfirmationOptions | null) => void>();
let currentOptions: ConfirmationOptions | null = null;

function notifyListeners() {
	confirmationListeners.forEach((listener) => listener(currentOptions));
}

export function useConfirm() {
	const [options, setOptions] = useState<ConfirmationOptions | null>(null);

	// Subscribe to confirmation changes
	useEffect(() => {
		const listener = (newOptions: ConfirmationOptions | null) => {
			setOptions(newOptions);
		};
		confirmationListeners.add(listener);
		setOptions(currentOptions);

		return () => {
			confirmationListeners.delete(listener);
		};
	}, []);

	const confirm = useCallback(
		(
			message: string,
			type: ConfirmationType = 'warning',
			title?: string,
			confirmText?: string,
			cancelText?: string
		): Promise<boolean> => {
			return new Promise((resolve) => {
				const confirmationOptions: ConfirmationOptions = {
					message,
					type,
					title,
					confirmText,
					cancelText,
					onConfirm: () => {
						resolve(true);
					},
					onCancel: () => {
						resolve(false);
					},
				};

				currentOptions = confirmationOptions;
				notifyListeners();
			});
		},
		[]
	);

	const close = useCallback(() => {
		currentOptions = null;
		notifyListeners();
	}, []);

	return {
		options,
		confirm,
		close,
	};
}

