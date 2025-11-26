import { Link, NavLink } from 'react-router-dom';
import { Bot, User, LogOut, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import NotificationsBell from '../notifications/NotificationsBell';
import { ThemeToggle } from '../ui/theme-toggle';
import { resolveMediaUrl } from '../../lib/apiClient';
import React from 'react';

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/posts', key: 'nav.posts' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/sponsors', key: 'nav.sponsors' },
  { to: '/streams', key: 'nav.streams' },
  { to: '/contact', key: 'nav.contact' },
  { to: '/gallery', key: 'nav.gallery' },
  { to: '/feedback', key: 'nav.feedback' },
  { to: '/terms', key: 'nav.terms' }
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

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!isAuthenticated) { setHasTeam(false); return; }
      try {
        const st = await api('/teams/status');
        if (!alive) return;
        setHasTeam(Boolean(st?.ownedTeamId || st?.memberOfTeamId));
      } catch {t}
    };
    load();
    return () => { alive = false; };
  }, [api, isAuthenticated]);

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-blue-200 bg-white dark:bg-slate-950 dark:border-slate-800 sticky top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors dark:text-blue-100 dark:hover:text-blue-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
            <Bot className="h-6 w-6" />
          </span>
          <span>RobEurope</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
              }`
            }
          >
            {t(item.key)}
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
                }`
              }
            >
              {t('nav.profile')}
            </NavLink>
            {hasTeam && (
              <NavLink
                to="/my-team"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
                  }`
                }
              >
                Mi equipo
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-blue-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-blue-900 dark:text-blue-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-blue-200 bg-blue-50">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 m-auto mt-2 text-blue-400" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.first_name}
              </p>
              <button onClick={logout} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                <LogOut className="h-3 w-3" /> {t('nav.logout')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Link to="/login">
              <Button variant="ghost" className="w-full justify-start">
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
                {t('nav.register')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
