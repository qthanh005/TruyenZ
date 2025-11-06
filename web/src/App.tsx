import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import StoryDetailPage from '@/pages/StoryDetailPage';
import ChapterReaderPage from '@/pages/ChapterReaderPage';
import ProfilePage from '@/pages/ProfilePage';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
	const { isAuthenticated, isLoading } = useAuth();
	if (isLoading) return <div className="p-6">Đang tải...</div>;
	return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
	return (
		<AuthProvider>
			<ThemeProvider>
				<div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
					<Navbar />
					<main className="mx-auto max-w-7xl px-4 pb-12 pt-6">
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/story/:storyId" element={<StoryDetailPage />} />
							<Route path="/story/:storyId/chapter/:chapterId" element={<ChapterReaderPage />} />
							<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
							<Route
								path="/me"
								element={
									<PrivateRoute>
										<ProfilePage />
									</PrivateRoute>
								}
							/>
							<Route path="*" element={<Navigate to="/" />} />
						</Routes>
					</main>
				</div>
			</ThemeProvider>
		</AuthProvider>
	);
}


