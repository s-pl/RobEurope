import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { requestNotificationPermission } from '../../lib/notifications';
import NotificationTestButton from '../notifications/NotificationTestButton';
import { isBackendActive } from '../../lib/apiClient';

const AppLayout = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'super_admin';

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className={`min-h-screen bg-neutral-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 ${isAdmin ? 'border-t-4 border-red-600' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow dark:focus:bg-slate-900 dark:focus:text-slate-50"
      >
        {t('common.skipToContent')}
      </a>
      {!isBackendActive && (
        <div className="bg-amber-100 text-amber-900 text-xs font-semibold text-center py-2 px-4 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
          {t('common.backendOfflineBanner')}
        </div>
      )}
      {isAdmin && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 uppercase tracking-widest">
          {t('common.adminModeActive')}
        </div>
      )}

      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden">
            <Navbar />
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
          >
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
