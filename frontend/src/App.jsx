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
import Teams from './pages/Teams';
import AcceptInvite from './pages/AcceptInvite';
import MyTeam from './pages/MyTeam';
import Posts from './pages/Posts';
import Sponsors from './pages/Sponsors';
import Streams from './pages/Streaming';
import { Toaster } from './components/ui/toast';



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
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="streams" element={<Streams />} />

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
        <Route path="*" element={<Navigate to="/" replace />} />
        

      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
