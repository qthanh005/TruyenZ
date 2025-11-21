import { useConfirm } from '@/hooks/useConfirm';
import ConfirmationModal from './ConfirmationModal';

export function ConfirmationProvider() {
	const { options, close } = useConfirm();

	return <ConfirmationModal isOpen={!!options} options={options} onClose={close} />;
}

