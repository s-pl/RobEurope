import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/theme-toggle';
import {
  LayoutDashboard, Users, Building2, Archive,
  FileText, ClipboardList, LogOut, ChevronLeft,
  Shield, Trophy, Users2, ScrollText,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NAV_GROUPS = [
  {
    items: [
      { to: '/admin', key: 'admin.layout.nav.dashboard', Icon: LayoutDashboard, end: true },
    ],
  },
  {
    items: [
      { to: '/admin/users',         key: 'admin.layout.nav.users',         Icon: Users },
      { to: '/admin/teams',         key: 'admin.layout.nav.teams',         Icon: Users2 },
      { to: '/admin/competitions',  key: 'admin.layout.nav.competitions',  Icon: Trophy },
      { to: '/admin/registrations', key: 'admin.layout.nav.registrations', Icon: ClipboardList },
    ],
  },
  {
    items: [
      { to: '/admin/posts',    key: 'admin.layout.nav.posts',    Icon: FileText },
      { to: '/admin/centers',  key: 'admin.layout.nav.centers',  Icon: Building2 },
      { to: '/admin/archives', key: 'admin.layout.nav.archives', Icon: Archive },
      { to: '/admin/requests', key: 'admin.layout.nav.requests', Icon: ScrollText },
      { to: '/admin/logs',     key: 'admin.layout.nav.logs',     Icon: ScrollText },
    ],
  },
];

const AdminNavLink = ({ to, label, Icon, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-100 border-l-2 ${
        collapsed ? 'justify-center px-0 mx-3' : ''
      } ${
        isActive
          ? 'border-stone-900 dark:border-stone-50 text-stone-900 dark:text-stone-50 bg-stone-100 dark:bg-stone-800/60'
          : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/30 hover:border-stone-300 dark:hover:border-stone-600'
      }`
    }
  >
    <Icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

function UserAvatar({ name }) {
  const initials = (name ?? '?').slice(0, 2).toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-50 text-xs font-bold select-none">
      {initials}
    </div>
  );
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-stone-950 font-sans">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 52 : 220 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="flex flex-col shrink-0 border-r-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b-2 border-stone-200 dark:border-stone-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-stone-900 dark:bg-stone-50">
            <Shield className="h-4 w-4 text-white dark:text-stone-900" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display font-black text-sm tracking-tight text-stone-900 dark:text-stone-50 whitespace-nowrap overflow-hidden"
              >
                {t('admin.layout.title')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.items.map(({ to, key, Icon, end }) => (
                <AdminNavLink key={to} to={to} label={t(key)} Icon={Icon} end={end} collapsed={collapsed} />
              ))}
              {gi < NAV_GROUPS.length - 1 && (
                <div className="mx-3 mt-2 border-t border-stone-100 dark:border-stone-800" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t-2 border-stone-200 dark:border-stone-800 p-3 space-y-2">
          {/* User row */}
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <UserAvatar name={user?.username} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-xs text-stone-500 dark:text-stone-400 truncate overflow-hidden whitespace-nowrap"
                >
                  {user?.username}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Actions row */}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <ThemeToggle />
            <div className={`flex ${collapsed ? 'flex-col gap-2 items-center' : 'items-center gap-2'}`}>
              <button
                onClick={handleLogout}
                title={t('admin.layout.logout')}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && <span>{t('admin.layout.logout')}</span>}
              </button>
              <button
                onClick={() => setCollapsed(c => !c)}
                title={collapsed ? t('admin.layout.expand') : t('admin.layout.collapse')}
                className="flex items-center text-xs text-stone-300 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
              >
                <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
