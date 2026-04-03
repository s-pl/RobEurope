import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toast';
import { EditModeProvider } from './context/EditModeContext';
import { SocketProvider } from './context/SocketContext';
import AdminEditButton from './components/admin/AdminEditButton';
import AdminLayout from './components/layout/AdminLayout';
import { TeamProvider } from './context/TeamContext';
import { FeaturesProvider } from './context/FeaturesContext';
import PageLoader from './components/ui/page-loader';

// ─── Pages (lazy) ────────────────────────────────────────────────────────────
const Home               = lazy(() => import('./pages/Home'));
const Competitions       = lazy(() => import('./pages/Competitions'));
const CompetitionDetail  = lazy(() => import('./pages/CompetitionDetail'));
const Contact            = lazy(() => import('./pages/Contact'));
const Teams              = lazy(() => import('./pages/Teams'));
const AcceptInvite       = lazy(() => import('./pages/AcceptInvite'));
const MyTeam             = lazy(() => import('./pages/MyTeam'));
const Posts              = lazy(() => import('./pages/Posts'));
const Gallery            = lazy(() => import('./pages/Gallery'));
const Archive            = lazy(() => import('./pages/Archive'));
const EducationalCenters = lazy(() => import('./pages/EducationalCenters'));
const Feedback           = lazy(() => import('./pages/Feedback'));
const Sponsors           = lazy(() => import('./pages/Sponsors'));
const Streams            = lazy(() => import('./pages/Streaming'));
const Terms              = lazy(() => import('./pages/Terms'));
const Notifications      = lazy(() => import('./pages/Notifications'));
const Profile            = lazy(() => import('./pages/Profile'));
const NotFound           = lazy(() => import('./pages/NotFound'));

// Auth pages
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));

// Admin pages
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers         = lazy(() => import('./pages/admin/AdminUsers'));
const AdminTeams         = lazy(() => import('./pages/admin/AdminTeams'));
const AdminCompetitions  = lazy(() => import('./pages/admin/AdminCompetitions'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations'));
const AdminLogs          = lazy(() => import('./pages/admin/AdminLogs'));
const AdminCenters       = lazy(() => import('./pages/admin/AdminCenters'));
const AdminArchives      = lazy(() => import('./pages/admin/AdminArchives'));
const AdminPosts         = lazy(() => import('./pages/admin/AdminPosts'));
const AdminRequests      = lazy(() => import('./pages/admin/AdminRequests'));

// ─── Route guards ─────────────────────────────────────────────────────────────
const AdminRoute = ({ children, superAdminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (superAdminOnly && user?.role !== 'super_admin') return <Navigate to="/" replace />;
  if (!superAdminOnly && user?.role !== 'center_admin' && user?.role !== 'super_admin') return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <FeaturesProvider>
        <SocketProvider>
          <EditModeProvider>
            <TeamProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Main app shell */}
                  <Route element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path="competitions" element={<Competitions />} />
                    <Route path="competitions/:id" element={<CompetitionDetail />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="teams" element={<Teams />} />
                    <Route path="teams/accept" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
                    <Route path="my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
                    <Route path="posts" element={<Posts />} />
                    <Route path="gallery" element={<Gallery />} />
                    <Route path="archive" element={<Archive />} />
                    <Route path="educational-centers" element={<EducationalCenters />} />
                    <Route path="feedback" element={<Feedback />} />
                    <Route path="sponsors" element={<Sponsors />} />
                    <Route path="streams" element={<Streams />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Admin — dedicated layout, no app navbar/sidebar */}
                  <Route path="/admin" element={<AdminRoute superAdminOnly><AdminLayout /></AdminRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="teams" element={<AdminTeams />} />
                    <Route path="competitions" element={<AdminCompetitions />} />
                    <Route path="registrations" element={<AdminRegistrations />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="centers" element={<AdminCenters />} />
                    <Route path="archives" element={<AdminArchives />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="requests" element={<AdminRequests />} />
                  </Route>

                  {/* Auth0 callback — Auth0Provider handles the code exchange automatically */}
                  <Route path="/callback" element={<PageLoader />} />

                  {/* Legacy auth routes — redirect to home (Auth0 Universal Login replaces these) */}
                  <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                  <Route path="/forgot-password" element={<Navigate to="/" replace />} />
                  <Route path="/reset-password" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <AdminEditButton />
              <Toaster />
            </TeamProvider>
          </EditModeProvider>
        </SocketProvider>
      </FeaturesProvider>
    </BrowserRouter>
  );
}

export default App;
