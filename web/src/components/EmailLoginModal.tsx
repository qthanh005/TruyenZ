import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { api, endpoints } from '@/services/apiClient';
import { findMockUser, createMockUserResponse, mockUsers } from '@/shared/mocks';

type EmailLoginModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function EmailLoginModal({ open, onClose, onSuccess }: EmailLoginModalProps) {
    const navigate = useNavigate();
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
        if (!password) {
            setError('Vui lòng nhập mật khẩu');
            return false;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (isSignUp) {
            // Đăng ký: cần name (username) và password
            if (!name) {
                setError('Vui lòng nhập tên của bạn');
                return false;
            }
            if (password !== confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                return false;
            }
            // Email là tùy chọn, nhưng nếu có thì phải hợp lệ
            if (email && !email.includes('@')) {
                setError('Email không hợp lệ');
                return false;
            }
            // Chặn đăng ký với email admin
            if (email && email.toLowerCase() === 'thanhvanguyen90@gmail.com') {
                setError('Email này không thể được sử dụng để đăng ký');
                return false;
            }
        } else {
            // Đăng nhập: cần username/name hoặc email, và password
            if (!name && !email) {
                setError('Vui lòng nhập tên đăng nhập hoặc email');
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
            // Check mock users first (for development/testing) - chỉ khi có email
            let mockUser = null;
            if (email) {
                mockUser = findMockUser(email, password);
            }
            
            if (mockUser) {
                // Use mock data
                const mockResponse = createMockUserResponse(mockUser);
                localStorage.setItem('auth_token', mockResponse.token);
                localStorage.setItem('user', JSON.stringify(mockResponse.user));
                onSuccess();
                handleClose();
                setLoading(false);
                // Auto redirect to admin if admin user
                if (mockUser.role === 'Admin' || (mockUser.email && mockUser.email.includes('admin'))) {
                    setTimeout(() => navigate('/admin'), 100);
                }
                return;
            }

            // If not mock user, try API
            if (isSignUp) {
                // Đăng ký - email là tùy chọn
                const response = await api.post(endpoints.register(), {
                    name, // name sẽ được dùng làm username
                    email: email || undefined, // Email tùy chọn
                    password,
                });
                
                if (response.data?.token || response.data?.accessToken) {
                    const token = response.data.token || response.data.accessToken;
                    const userData = response.data.user;
                    
                    localStorage.setItem('auth_token', token);
                    if (response.data.refreshToken) {
                        localStorage.setItem('refresh_token', response.data.refreshToken);
                    }
                    
                    // Format user data để tương thích với frontend
                    const user = userData ? {
                        id: String(userData.id || ''),
                        email: userData.email || '',
                        username: userData.username || userData.email || name,
                        name: userData.username || userData.email || name,
                        role: userData.role,
                        profile: {
                            name: userData.username || userData.email || name,
                            preferred_username: userData.username || userData.email || name,
                            email: userData.email || '',
                            role: userData.role,
                        },
                    } : null;
                    
                    if (user) {
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                    
                    // Set token trong API client
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    onSuccess();
                    handleClose();
                    
                    // Auto redirect to admin if admin user
                    const isAdmin = userData?.role === 'ADMIN' || 
                                   userData?.role === 'Admin' ||
                                   (userData?.email && userData.email.toLowerCase() === 'thanhvanguyen90@gmail.com');
                    if (isAdmin) {
                        setTimeout(() => navigate('/admin'), 100);
                    }
                } else {
                    setError('Đăng ký thành công nhưng không nhận được token. Vui lòng thử đăng nhập.');
                }
            } else {
                // Đăng nhập - có thể dùng username (name) hoặc email
                const identifier = name || email;
                const response = await api.post(endpoints.login(), {
                    usernameOrEmail: identifier, // Username hoặc email
                    password,
                });
                
                if (response.data?.token || response.data?.accessToken) {
                    const token = response.data.token || response.data.accessToken;
                    const userData = response.data.user;
                    
                    localStorage.setItem('auth_token', token);
                    if (response.data.refreshToken) {
                        localStorage.setItem('refresh_token', response.data.refreshToken);
                    }
                    
                    // Format user data để tương thích với frontend
                    const user = userData ? {
                        id: String(userData.id || ''),
                        email: userData.email || '',
                        username: userData.username || userData.email || name,
                        name: userData.username || userData.email || name,
                        role: userData.role,
                        profile: {
                            name: userData.username || userData.email || name,
                            preferred_username: userData.username || userData.email || name,
                            email: userData.email || '',
                            role: userData.role,
                        },
                    } : null;
                    
                    if (user) {
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                    
                    // Set token trong API client
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    onSuccess();
                    handleClose();
                    
                    // Auto redirect to admin if admin user
                    const isAdmin = userData?.role === 'ADMIN' || 
                                   userData?.role === 'Admin' ||
                                   (userData?.email && userData.email.toLowerCase() === 'thanhvanguyen90@gmail.com');
                    if (isAdmin) {
                        setTimeout(() => navigate('/admin'), 100);
                    }
                } else {
                    setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            }
        } catch (err: any) {
            // If API fails, check if it's a network error
            if (!err.response) {
                const errorMsg = err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')
                    ? 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. API Gateway đang chạy trên http://localhost:8081\n2. User Service đang chạy trên http://localhost:8882\n3. Hoặc sử dụng tài khoản mock: admin@truyenz.com / admin123'
                    : 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.';
                setError(errorMsg);
            } else {
                // Server trả về lỗi
                const errorMessage = err.response?.data?.message || 
                                    err.response?.data?.error ||
                                    err.message || 
                                    'Có lỗi xảy ra. Vui lòng thử lại.';
                setError(errorMessage);
            }
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
                                Tên đăng nhập <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                placeholder="Nhập tên đăng nhập"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {isSignUp && (
                        <div>
                            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Email <span className="text-zinc-400 text-xs">(tùy chọn)</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 pl-10 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                    placeholder="your@email.com (tùy chọn)"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {!isSignUp && (
                        <div>
                            <label htmlFor="loginIdentifier" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Tên đăng nhập hoặc Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    id="loginIdentifier"
                                    type="text"
                                    value={name || email}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.includes('@')) {
                                            setEmail(value);
                                            setName('');
                                        } else {
                                            setName(value);
                                            setEmail('');
                                        }
                                    }}
                                    className="w-full rounded-md border border-zinc-300 pl-10 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                    placeholder="Tên đăng nhập hoặc email"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

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

