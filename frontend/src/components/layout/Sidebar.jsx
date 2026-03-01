import { Link, NavLink } from 'react-router-dom';
import {
  Bot, User, LogOut, Globe, ChevronRight,
  Home, Newspaper, Trophy, Users, Heart, Tv, Mail, Shield, Image, MessageSquare,
  Archive, Building2, Settings, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import NotificationsBell from '../notifications/NotificationsBell';
import { ThemeToggle } from '../ui/theme-toggle';
import { resolveMediaUrl } from '../../lib/apiClient';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/competitions', key: 'nav.competitions', icon: Trophy },
  { to: '/teams', key: 'nav.teams', icon: Users },
  { to: '/posts', key: 'nav.posts', icon: Newspaper },
  { to: '/streams', key: 'nav.streams', icon: Tv },
  { to: '/gallery', key: 'nav.gallery', icon: Image },
  { to: '/archive', key: 'nav.archives', icon: Archive },
  { to: '/educational-centers', key: 'nav.educationalCenters', icon: Building2 },
  { to: '/sponsors', key: 'nav.sponsors', icon: Heart },
  { to: '/contact', key: 'nav.contact', icon: Mail },
  { to: '/feedback', key: 'nav.feedback', icon: MessageSquare },
];

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

// Nav link with a shared layoutId sliding pill behind the active item
const MotionNavLink = ({ to, icon: Icon, label, collapsed, pillId = 'nav-pill' }) => (
  <NavLink
    to={to}
    end={to === '/'}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        collapsed ? 'justify-center px-2' : ''
      } ${
        isActive
          ? 'text-blue-900 dark:text-blue-100'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Sliding pill background */}
        {isActive && (
          <motion.div
            layoutId={pillId}
            className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/20"
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
          />
        )}

        {/* Icon with spring bounce on hover */}
        <motion.span
          className="relative z-10 shrink-0"
          whileHover={{ scale: 1.22, rotate: isActive ? 0 : -10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <Icon className="h-5 w-5" />
        </motion.span>

        {/* Label fades/slides when sidebar collapses */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className="relative z-10 truncate"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    )}
  </NavLink>
);

// Admin variant of nav link (amber accent)
const AdminNavLink = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
        collapsed ? 'justify-center px-2' : ''
      } ${
        isActive
          ? 'text-amber-900 dark:text-amber-100'
          : 'text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="nav-pill-admin"
            className="absolute inset-0 rounded-lg bg-amber-50 dark:bg-amber-900/20"
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
          />
        )}
        <motion.span
          className="relative z-10 shrink-0"
          whileHover={{ scale: 1.22, rotate: isActive ? 0 : -10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <Icon className="h-5 w-5" />
        </motion.span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className="relative z-10 truncate"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const api = useApi();
  const avatarUrl = resolveMediaUrl(user?.profile_photo_url);
  const [hasTeam, setHasTeam] = React.useState(false);
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!isAuthenticated) { setHasTeam(false); return; }
      try {
        const st = await api('/teams/status');
        if (!alive) return;
        setHasTeam(Boolean(st?.ownedTeamId || st?.memberOfTeamId));
      } catch { /* ignore */ }
    };
    load();
    return () => { alive = false; };
  }, [api, isAuthenticated]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="hidden lg:flex h-screen flex-col border-r border-blue-200 bg-white dark:bg-slate-950 dark:border-slate-800 sticky top-0 overflow-hidden shrink-0"
    >
      {/* Collapse toggle */}
      <motion.button
        onClick={() => setCollapsed(c => !c)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        className="absolute -right-3 top-9 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-900 shadow-sm hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-100 z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        aria-label={collapsed ? t('common.expand') || 'Expand' : t('common.collapse') || 'Collapse'}
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <ChevronRight className="h-3 w-3" />
        </motion.div>
      </motion.button>

      {/* Logo */}
      <div className={`p-6 ${collapsed ? 'px-4 flex justify-center' : ''}`}>
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors dark:text-blue-100 dark:hover:text-blue-300"
        >
          <motion.span
            whileHover={{ rotate: [0, -12, 12, -6, 0], scale: 1.06 }}
            transition={{ duration: 0.5 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400 shrink-0"
          >
            <Bot className="h-6 w-6" />
          </motion.span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.17 }}
              >
                RobEurope
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label={t('nav.primaryNavigation') || 'Primary navigation'}
        className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden"
      >
        {navLinks.map(item => (
          <MotionNavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={t(item.key)}
            collapsed={collapsed}
          />
        ))}

        {isAuthenticated && (
          <>
            <div className="my-3 border-t border-slate-100 dark:border-slate-800" />
            <MotionNavLink to="/profile" icon={User} label={t('nav.profile')} collapsed={collapsed} />
            {hasTeam && (
              <MotionNavLink to="/my-team" icon={Shield} label={t('nav.myTeam')} collapsed={collapsed} />
            )}

            {(user?.role === 'center_admin' || user?.role === 'super_admin') && (
              <>
                <div className="my-3 border-t border-amber-200 dark:border-amber-800" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="px-3 py-1 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400"
                    >
                      {t('nav.adminSection') || 'Administración'}
                    </motion.p>
                  )}
                </AnimatePresence>
                <AdminNavLink to="/admin/centers" icon={Building2} label={t('nav.manageCenters') || 'Gestionar Centros'} collapsed={collapsed} />
                {user?.role === 'super_admin' && (
                  <>
                    <AdminNavLink to="/admin/archives" icon={Archive} label={t('nav.manageArchives') || 'Gestionar Archivos'} collapsed={collapsed} />
                    <AdminNavLink to="/admin/posts" icon={FileText} label={t('nav.managePosts') || 'Gestionar Posts'} collapsed={collapsed} />
                    <AdminNavLink to="/admin/requests" icon={Settings} label={t('nav.adminRequests') || 'Solicitudes Admin'} collapsed={collapsed} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </nav>

      {/* Bottom bar */}
      <div className={`p-4 border-t border-blue-200 dark:border-slate-800 space-y-4 ${collapsed ? 'items-center flex flex-col' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-blue-900 dark:text-blue-400" aria-hidden="true" />
                <span className="sr-only">{t('nav.language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side={collapsed ? 'right' : 'bottom'}>
              {languages.map(lang => (
                <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          {isAuthenticated && <NotificationsBell />}
        </div>

        {isAuthenticated ? (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="h-10 w-10 overflow-hidden rounded-full border border-blue-200 bg-blue-50 shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('profile.avatarAlt') || 'Profile photo'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 m-auto mt-2 text-blue-400" />
              )}
            </motion.div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  className="flex-1 overflow-hidden"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user?.first_name}
                  </p>
                  <button onClick={logout} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                    <LogOut className="h-3 w-3" /> {t('nav.logout')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`grid gap-2 ${collapsed ? 'w-full' : ''}`}>
            <Link to="/login" title={collapsed ? t('nav.login') : ''}>
              <Button variant="ghost" className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}>
                {collapsed ? <LogOut className="h-5 w-5 rotate-180" /> : t('nav.login')}
              </Button>
            </Link>
            <Link to="/register" title={collapsed ? t('nav.register') : ''}>
              <Button className={`w-full bg-blue-600 text-white hover:bg-blue-700 ${collapsed ? 'justify-center px-0' : 'justify-start'}`}>
                {collapsed ? <User className="h-5 w-5" /> : t('nav.register')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
