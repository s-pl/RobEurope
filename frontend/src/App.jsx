import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import Competitions from './pages/Competitions';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Teams from './pages/Teams';
import AcceptInvite from './pages/AcceptInvite';
import MyTeam from './pages/MyTeam';
import Sponsors from './pages/Sponsors';
import Streams from './pages/Streaming';
import { Toaster } from './components/ui/toast';
import Gallery from './pages/Gallery';
import Feedback from './pages/Feedback';
import Terms from './pages/Terms';


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
          <Route path="contact" element={<Contact />} />
          <Route path="teams" element={<Teams />} />
          <Route path="teams/accept" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
          <Route path="my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
          <Route path="sponsors" element={<ProtectedRoute><Sponsors /></ProtectedRoute>} />
          <Route path="streams" element={<ProtectedRoute><Streams /></ProtectedRoute>} />
          <Route path="/Feedback" element={<Feedback/>} />
          <Route path="/Gallery" element={<Gallery/>} />
          <Route path="/Terms" element={<Terms/>} />

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
