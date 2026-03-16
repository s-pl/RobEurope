import { Link, NavLink } from 'react-router-dom';
import {
  Bot, User, LogOut, Globe, ChevronRight,
  Home, Newspaper, Trophy, Users, Heart, Tv, Mail, Shield, Image, MessageSquare,
  Archive, Building2, Settings, FileText, MessageCircle,
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
import { motion } from 'framer-motion';

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

const SidebarNavLink = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    end={to === '/'}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        collapsed ? 'justify-center px-2' : ''
      } ${
        isActive
          ? 'text-stone-900 dark:text-stone-50 border-l-2 border-blue-600'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 border-l-2 border-transparent'
      }`
    }
  >
    <Icon className="h-5 w-5 shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

const AdminNavLink = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        collapsed ? 'justify-center px-2' : ''
      } ${
        isActive
          ? 'text-amber-700 dark:text-amber-300 border-l-2 border-amber-500'
          : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 border-l-2 border-transparent'
      }`
    }
  >
    <Icon className="h-5 w-5 shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
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
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex h-screen flex-col border-r border-stone-200 bg-white dark:bg-stone-950 dark:border-stone-800 sticky top-0 overflow-hidden shrink-0"
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-9 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-50 z-50 transition-colors duration-150"
        aria-label={collapsed ? t('common.expand') || 'Expand' : t('common.collapse') || 'Collapse'}
      >
        <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Logo */}
      <div className={`p-6 ${collapsed ? 'px-4 flex justify-center' : ''}`}>
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-stone-900 hover:text-blue-600 transition-colors duration-150 dark:text-stone-50 dark:hover:text-blue-400"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[#f8f7f4] text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 shrink-0">
            <Bot className="h-6 w-6" />
          </span>
          {!collapsed && <span>RobEurope</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label={t('nav.primaryNavigation') || 'Primary navigation'}
        className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden"
      >
        {navLinks.map(item => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={t(item.key)}
            collapsed={collapsed}
          />
        ))}

        {isAuthenticated && (
          <>
            <div className="my-3 border-t border-stone-200 dark:border-stone-800" />
            <SidebarNavLink to="/profile" icon={User} label={t('nav.profile')} collapsed={collapsed} />
            <SidebarNavLink to="/messages" icon={MessageCircle} label={t('nav.messages', 'Messages')} collapsed={collapsed} />
            {hasTeam && (
              <SidebarNavLink to="/my-team" icon={Shield} label={t('nav.myTeam')} collapsed={collapsed} />
            )}

            {(user?.role === 'center_admin' || user?.role === 'super_admin') && (
              <>
                <div className="my-3 border-t border-amber-200 dark:border-amber-800" />
                {!collapsed && (
                  <p className="px-3 py-1 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                    {t('nav.adminSection') || 'Administracion'}
                  </p>
                )}
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
      <div className={`p-4 border-t border-stone-200 dark:border-stone-800 space-y-4 ${collapsed ? 'items-center flex flex-col' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-stone-600 dark:text-stone-400" aria-hidden="true" />
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
            <div className="h-10 w-10 overflow-hidden rounded-lg border border-stone-200 bg-[#f8f7f4] dark:border-stone-700 dark:bg-stone-900 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('profile.avatarAlt') || 'Profile photo'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 m-auto mt-2 text-stone-400" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                  {user?.first_name}
                </p>
                <button onClick={logout} className="text-xs text-blue-600 hover:underline flex items-center gap-1 transition-colors duration-150">
                  <LogOut className="h-3 w-3" /> {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid gap-2 ${collapsed ? 'w-full' : ''}`}>
            <Link to="/login" title={collapsed ? t('nav.login') : ''}>
              <Button variant="ghost" className={`w-full rounded-lg ${collapsed ? 'justify-center px-0' : 'justify-start'}`}>
                {collapsed ? <LogOut className="h-5 w-5 rotate-180" /> : t('nav.login')}
              </Button>
            </Link>
            <Link to="/register" title={collapsed ? t('nav.register') : ''}>
              <Button className={`w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${collapsed ? 'justify-center px-0' : 'justify-start'}`}>
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
