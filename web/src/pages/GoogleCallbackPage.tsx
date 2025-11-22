import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, endpoints } from '@/services/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';

export default function GoogleCallbackPage() {
	const navigate = useNavigate();
	const { refreshEmailUser } = useAuth();
	const toast = useToast();
	const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
	const [message, setMessage] = useState('Đang xử lý đăng nhập...');
	const hasProcessed = useRef(false);

	useEffect(() => {
		// Chỉ chạy một lần
		if (hasProcessed.current || status !== 'processing') {
			return;
		}
		hasProcessed.current = true;

		const handleGoogleCallback = async () => {
			try {
				// Lấy hash từ URL (fragment) - Google trả về token trong fragment
				const hash = window.location.hash.substring(1); // Remove #
				const params = new URLSearchParams(hash);
				
				// Lấy id_token từ URL
				const idToken = params.get('id_token');
				const accessToken = params.get('access_token');
				const error = params.get('error');

				if (error) {
					setStatus('error');
					setMessage(`Lỗi đăng nhập: ${error}`);
					toast.error(`Lỗi đăng nhập: ${error}`);
					setTimeout(() => navigate('/'), 3000);
					return;
				}

				if (!idToken) {
					setStatus('error');
					setMessage('Không tìm thấy ID Token từ Google');
					toast.error('Không tìm thấy ID Token từ Google');
					setTimeout(() => navigate('/'), 3000);
					return;
				}

				console.log('📝 ID Token received from Google');
				
				// Gửi IDToken đến backend API
				const response = await api.post(endpoints.googleAuth(), {
					idToken: idToken,
				});

				console.log('✅ Google auth response:', response.data);

				// Lưu token và user info
				if (response.data.token) {
					localStorage.setItem('auth_token', response.data.token);
					api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
				}

				if (response.data.user) {
					localStorage.setItem('user', JSON.stringify(response.data.user));
				}

				// Refresh user info
				await refreshEmailUser();

				setStatus('success');
				setMessage('Đăng nhập thành công! Đang chuyển hướng...');
				toast.success('Đăng nhập thành công!');

				// Redirect về trang chủ hoặc trang trước đó
				const redirectTo = localStorage.getItem('google_auth_redirect') || '/';
				localStorage.removeItem('google_auth_redirect');
				setTimeout(() => navigate(redirectTo), 1500);
			} catch (error: any) {
				console.error('❌ Google auth error:', error);
				setStatus('error');
				const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi đăng nhập với Google';
				setMessage(errorMessage);
				toast.error(errorMessage);
				setTimeout(() => navigate('/'), 3000);
			}
		};

		handleGoogleCallback();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status]); // Chỉ chạy khi status là 'processing'

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
			<div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
				<div className="text-center">
					{status === 'processing' && (
						<>
							<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-brand"></div>
							<h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
								Đang xử lý đăng nhập
							</h2>
							<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
						</>
					)}
					{status === 'success' && (
						<>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
								<svg
									className="h-6 w-6 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
								Đăng nhập thành công!
							</h2>
							<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
						</>
					)}
					{status === 'error' && (
						<>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
								<svg
									className="h-6 w-6 text-red-600 dark:text-red-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
								Đăng nhập thất bại
							</h2>
							<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

