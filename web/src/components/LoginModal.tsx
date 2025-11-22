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
                    <button
                        className="w-full flex items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                        onClick={() => {
                            // Lưu URL hiện tại để redirect về sau khi đăng nhập
                            localStorage.setItem('google_auth_redirect', window.location.pathname + window.location.search);
                            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=467455556616-5kvu7e7dvr5im97hb58j4s3hnmbh5788.apps.googleusercontent.com&redirect_uri=${encodeURIComponent('http://localhost:5173/auth/google/callback')}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=abc123`;
                            window.location.href = googleAuthUrl;
                        }}
                    >
                        <span className="inline-flex h-5 w-5 items-center justify-center">
                            {/* Google/Gmail logo */}
                            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.837 32.657 29.326 36 24 36 16.82 36 11 30.18 11 23S16.82 10 24 10c3.183 0 6.087 1.205 8.296 3.172l5.657-5.657C34.676 3.042 29.566 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22c12.15 0 22-9.85 22-22 0-1.341-.138-2.651-.389-3.917z"/>
                                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.312 15.232 18.793 12 24 12c3.183 0 6.087 1.205 8.296 3.172l5.657-5.657C34.676 3.042 29.566 1 24 1 16.319 1 9.656 5.075 6.306 11.309z"/>
                                <path fill="#4CAF50" d="M24 45c5.243 0 10.024-1.98 13.64-5.22l-6.29-5.32C29.155 36.691 26.715 37.5 24 37.5 18.708 37.5 14.246 34.19 12.903 29.5l-6.536 5.036C9.647 41.924 16.276 45 24 45z"/>
                                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.313 3.657-5.151 6.5-9.303 6.5-5.292 0-9.754-3.31-11.097-8l-6.536 5.036C11.196 38.925 17.825 42 25.5 42c12.15 0 22-9.85 22-22 0-1.341-.138-2.651-.389-3.917z"/>
                            </svg>
                        </span>
                        <span>Đăng nhập với Google</span>
                    </button>
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


