import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';

type EmailLoginModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function EmailLoginModal({ open, onClose, onSuccess }: EmailLoginModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => {
        resetForm();
        setIsSignUp(false);
        onClose();
    };

    const validateForm = () => {
        if (!email || !password) {
            setError('Vui lòng điền đầy đủ thông tin');
            return false;
        }
        if (!email.includes('@')) {
            setError('Email không hợp lệ');
            return false;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (isSignUp) {
            if (!name) {
                setError('Vui lòng nhập tên của bạn');
                return false;
            }
            if (password !== confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                // Đăng ký
                const response = await api.post(endpoints.register(), {
                    email,
                    password,
                    name,
                });
                
                if (response.data) {
                    // Sau khi đăng ký thành công, tự động đăng nhập
                    const loginResponse = await api.post(endpoints.login(), {
                        email,
                        password,
                    });
                    
                    if (loginResponse.data?.token) {
                        localStorage.setItem('auth_token', loginResponse.data.token);
                        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
                        onSuccess();
                        handleClose();
                    }
                }
            } else {
                // Đăng nhập
                const response = await api.post(endpoints.login(), {
                    email,
                    password,
                });
                
                if (response.data?.token) {
                    localStorage.setItem('auth_token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    onSuccess();
                    handleClose();
                } else {
                    setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative w-full max-w-md my-auto flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-[10000]">
                {/* Header sticky */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        {isSignUp ? (
                            <UserPlus className="h-5 w-5 text-brand" />
                        ) : (
                            <LogIn className="h-5 w-5 text-brand" />
                        )}
                        <h2 className="text-xl font-semibold">
                            {isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập'}
                        </h2>
                    </div>
                    <button
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={handleClose}
                        aria-label="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-6">

                    <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Tên của bạn
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                placeholder="Nhập tên của bạn"
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 pl-10 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                placeholder="your@email.com"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 pl-10 pr-10 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                placeholder="Nhập mật khẩu"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {isSignUp && (
                        <div>
                            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 pl-10 pr-10 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                    placeholder="Nhập lại mật khẩu"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
                    </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                            className="text-sm text-brand hover:underline"
                        >
                            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

