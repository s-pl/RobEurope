import { Link, NavLink } from 'react-router-dom';
import { 
  Bot, User, LogOut, Globe, ChevronLeft, ChevronRight,
  Home, Newspaper, Trophy, Users, Heart, Tv, Mail, Shield, Image, MessageSquare
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

const navLinks = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/posts', key: 'nav.posts', icon: Newspaper },
  { to: '/gallery', key: 'nav.gallery', icon: Image },
  { to: '/feedback', key: 'nav.feedback', icon: MessageSquare },
  { to: '/competitions', key: 'nav.competitions', icon: Trophy },
  { to: '/teams', key: 'nav.teams', icon: Users },
  { to: '/sponsors', key: 'nav.sponsors', icon: Heart },
  { to: '/streams', key: 'nav.streams', icon: Tv },
  { to: '/contact', key: 'nav.contact', icon: Mail }
];

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' }
];

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
      } catch (error) {
        // ignore
      }
    };
    load();
    return () => { alive = false; };
  }, [api, isAuthenticated]);

  return (
    <aside 
      className={`hidden lg:flex h-screen flex-col border-r border-blue-200 bg-white dark:bg-slate-950 dark:border-slate-800 sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-9 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-900 shadow-sm hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-100 z-50"
        aria-label={collapsed ? t('common.expand') || 'Expand sidebar' : t('common.collapse') || 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className={`p-6 ${collapsed ? 'px-4 flex justify-center' : ''}`}>
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors dark:text-blue-100 dark:hover:text-blue-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400 shrink-0">
            <Bot className="h-6 w-6" />
          </span>
          {!collapsed && <span>RobEurope</span>}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? t(item.key) : ''}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t(item.key)}</span>}
          </NavLink>
        ))}

        {isAuthenticated && (
          <>
            <div className="my-4 border-t border-slate-100 dark:border-slate-800" />
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? t('nav.profile') : ''}
            >
              <User className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t('nav.profile')}</span>}
            </NavLink>
            {hasTeam && (
              <NavLink
                to="/my-team"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? t('nav.myTeam') : ''}
              >
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t('nav.myTeam')}</span>}
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className={`p-4 border-t border-blue-200 dark:border-slate-800 space-y-4 ${collapsed ? 'items-center flex flex-col' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between'}`}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-blue-900 dark:text-blue-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"}>
              {languages.map((lang) => (
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
            <div className="h-10 w-10 overflow-hidden rounded-full border border-blue-200 bg-blue-50 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('profile.avatarAlt') || 'Profile photo'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 m-auto mt-2 text-blue-400" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.first_name}
                </p>
                <button onClick={logout} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                  <LogOut className="h-3 w-3" /> {t('nav.logout')}
                </button>
              </div>
            )}
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
    </aside>
  );
};

export default Sidebar;
