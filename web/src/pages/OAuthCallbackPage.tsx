import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

export default function OAuthCallbackPage() {
	const { manager } = useAuth();
	const nav = useNavigate();
	const loc = useLocation();

	useEffect(() => {
		(async () => {
			try {
				const u = await manager.signinRedirectCallback(loc.search);
				const redirectTo = (u?.state as any)?.redirectTo || '/';
				nav(redirectTo, { replace: true });
			} catch (e) {
				nav('/', { replace: true });
			}
		})();
	}, [manager, nav, loc.search]);

	return <div className="p-6 text-sm text-zinc-500">Đang xác thực...</div>;
}


