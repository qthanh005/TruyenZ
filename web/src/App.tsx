import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { Layout } from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import StoryDetailPage from '@/pages/StoryDetailPage';
import ChapterReaderPage from '@/pages/ChapterReaderPage';
import ProfilePage from '@/pages/ProfilePage';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage';
import HotStoriesPage from '@/pages/HotStoriesPage';
import CategoriesPage from '@/pages/CategoriesPage';
import HistoryPage from '@/pages/HistoryPage';
import RankingPage from '@/pages/RankingPage';
import AdminPage from '@/pages/AdminPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
	const { isAuthenticated, isLoading } = useAuth();
	if (isLoading) return <div className="p-6">Đang tải...</div>;
	return isAuthenticated ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
	const { isAuthenticated, isLoading, user } = useAuth();
	if (isLoading) return <div className="p-6">Đang tải...</div>;
	
	// Check if user is admin (mock check - replace with actual role check from backend)
	const isAdmin = isAuthenticated && (
		user?.profile?.email?.includes('admin') || 
		(user as any)?.role === 'Admin' ||
		user?.profile?.preferred_username?.includes('admin') ||
		// Check if user object has role property directly
		((user as any)?.profile as any)?.role === 'Admin'
	);
	
	return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
	return (
		<AuthProvider>
			<ThemeProvider>
				<Routes>
					{/* Admin routes - no navbar/footer */}
					<Route
						path="/admin/*"
						element={
							<AdminRoute>
								<AdminPage />
							</AdminRoute>
						}
					/>
					
					{/* Public routes - with navbar/footer */}
					<Route
						path="/"
						element={
							<Layout>
								<HomePage />
							</Layout>
						}
					/>
					<Route
						path="/hot"
						element={
							<Layout>
								<HotStoriesPage />
							</Layout>
						}
					/>
					<Route
						path="/categories"
						element={
							<Layout>
								<CategoriesPage />
							</Layout>
						}
					/>
					<Route
						path="/history"
						element={
							<Layout>
								<HistoryPage />
							</Layout>
						}
					/>
					<Route
						path="/ranking"
						element={
							<Layout>
								<RankingPage />
							</Layout>
						}
					/>
					<Route
						path="/story/:storyId"
						element={
							<Layout>
								<StoryDetailPage />
							</Layout>
						}
					/>
					<Route
						path="/story/:storyId/chapter/:chapterId"
						element={
							<Layout>
								<ChapterReaderPage />
							</Layout>
						}
					/>
					<Route
						path="/oauth/callback"
						element={
							<Layout>
								<OAuthCallbackPage />
							</Layout>
						}
					/>
					<Route
						path="/me"
						element={
							<PrivateRoute>
								<Layout>
									<ProfilePage />
								</Layout>
							</PrivateRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			</ThemeProvider>
		</AuthProvider>
	);
}


