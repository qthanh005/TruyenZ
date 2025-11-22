import { LogIn } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { login, isOAuthConfigured } = useAuth();
    const toast = useToast();

    if (!open) return null;

    const handleOAuth = async () => {
        try {
            await login(window.location.pathname + window.location.search, 'oauth2');
        } catch (error: any) {
            console.error('OAuth login error:', error);
            toast.error(
                error.message || 
                'Không thể kết nối đến OAuth server. Vui lòng kiểm tra cấu hình hoặc sử dụng đăng nhập bằng email.'
            );
        }
    };

    const handleFacebook = async () => {
        try {
            await login(window.location.pathname + window.location.search, 'facebook');
        } catch (error: any) {
            console.error('Facebook login error:', error);
            toast.error(
                error.message || 
                'Không thể kết nối đến OAuth server. Vui lòng kiểm tra cấu hình hoặc sử dụng đăng nhập bằng email.'
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-2">
                    <LogIn className="h-5 w-5 text-brand" />
                    <h2 className="text-lg font-semibold">Đăng nhập</h2>
                </div>
                <div className="space-y-3">
                    {isOAuthConfigured ? (
                        <>
                            <button
                                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                                onClick={handleOAuth}
                            >
                                Đăng nhập bằng OAuth2
                            </button>
                            <button
                                className="w-full rounded-md bg-[#1877F2] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                                onClick={handleFacebook}
                            >
                                Đăng nhập bằng Facebook
                            </button>
                        </>
                    ) : (
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                            OAuth chưa được cấu hình. Vui lòng sử dụng đăng nhập bằng email.
                        </div>
                    )}
                </div>
                <button
                    className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={onClose}
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}


