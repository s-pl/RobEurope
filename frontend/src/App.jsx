import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import Competitions from './pages/Competitions';
import CompetitionDetail from './pages/CompetitionDetail';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Teams from './pages/Teams';
import AcceptInvite from './pages/AcceptInvite';
import MyTeam from './pages/MyTeam';
import Posts from './pages/Posts';
import Sponsors from './pages/Sponsors';
import Streams from './pages/Streaming';
import Gallery from './pages/Gallery';
import Archive from './pages/Archive';
import EducationalCenters from './pages/EducationalCenters';
import Feedback from './pages/Feedback';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toast';
import { EditModeProvider } from './context/EditModeContext';
import { SocketProvider } from './context/SocketContext';
import AdminEditButton from './components/admin/AdminEditButton';
import AdminCenters from './pages/admin/AdminCenters';
import AdminArchives from './pages/admin/AdminArchives';
import AdminRequests from './pages/admin/AdminRequests';
import AdminPosts from './pages/admin/AdminPosts';
import { TeamProvider } from './context/TeamContext';

// Admin route wrapper - requires center_admin or super_admin role
const AdminRoute = ({ children, superAdminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (superAdminOnly && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  if (!superAdminOnly && user?.role !== 'center_admin' && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};



const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
  <SocketProvider>
  <EditModeProvider>
  <TeamProvider>
      <Routes>
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

          {/* Admin Routes */}
          <Route path="admin/centers" element={<AdminRoute><AdminCenters /></AdminRoute>} />
          <Route path="admin/archives" element={<AdminRoute><AdminArchives /></AdminRoute>} />
          <Route path="admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
          <Route path="admin/requests" element={<AdminRoute superAdminOnly><AdminRequests /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />

          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />

      </Routes>
  <AdminEditButton />
  <Toaster />
  </TeamProvider>
  </EditModeProvider>
  </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
