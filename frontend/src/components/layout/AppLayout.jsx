import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import { requestNotificationPermission } from '../../lib/notifications';
import NotificationTestButton from '../notifications/NotificationTestButton';

const AppLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    // Ask permission once the layout mounts
    requestNotificationPermission();
  }, []);

  return (
    <div className={`min-h-screen bg-neutral-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 ${isAdmin ? 'border-t-4 border-red-600' : ''}`}>
      {isAdmin && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 uppercase tracking-widest">
          Admin Mode Active
        </div>
      )}
      
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden">
            <Navbar />
          </div>
          <main className="mx-auto w-full max-w-5xl space-y-10 px-4 pb-16 pt-10 lg:px-8 flex-1">
            <Outlet />
          </main>
          <NotificationTestButton />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
