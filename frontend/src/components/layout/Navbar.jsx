import { Link, NavLink } from 'react-router-dom';
import { Bot, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import NotificationsBell from '../notifications/NotificationsBell';
import { resolveMediaUrl } from '../../lib/apiClient';
import React from 'react';
const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/sponsors', key: 'nav.sponsors' },
  { to: '/stream', key: 'nav.streams' },
  { to: '/contact', key: 'nav.contact' },
  { to: '/terms', key: 'nav.terms' }
];

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' }
];

const Navbar = () => {
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

  const handleLanguageChange = (event) => {
    const value = event.target.value;
    i18n.changeLanguage(value);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-blue-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm">
            <Bot className="h-5 w-5" />
          </span>
          RobEurope
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-blue-600 md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition hover:text-blue-900 ${isActive ? 'text-blue-900 font-semibold' : ''}`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  isActive
                    ? 'border-blue-600 text-blue-900 bg-blue-50'
                    : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:text-blue-900 hover:bg-blue-50'
                }`
              }
            >
              {t('nav.profile')}
            </NavLink>
          )}
          {isAuthenticated && hasTeam && (
            <NavLink
              to="/my-team"
              className={({ isActive }) =>
                `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  isActive
                    ? 'border-blue-600 text-blue-900 bg-blue-50'
                    : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:text-blue-900 hover:bg-blue-50'
                }`
              }
            >
              Mi equipo
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && hasTeam && (
            <Button asChild variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
              <Link to="/my-team">
                <Bot className="mr-2 h-4 w-4" />
                Mi equipo
              </Link>
            </Button>
          )}
          {isAuthenticated && (
            <NotificationsBell />
          )}
          <select
            aria-label="Select language"
            value={i18n.language}
            onChange={handleLanguageChange}
            className="hidden rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 transition hover:border-blue-600 hover:text-blue-900 md:block"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.first_name} className="h-8 w-8 rounded-xl border border-blue-200 object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
                      {(user?.first_name?.[0] || user?.username?.[0] || 'R').toUpperCase()}
                    </div>
                  )}
                  <div className="hidden text-left text-xs leading-tight sm:block">
                    <p className="font-semibold text-blue-900">{user?.first_name ?? user?.username}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-blue-500">{t('status.connected')}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-blue-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-blue-900">
                  {user?.first_name} {user?.last_name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-blue-700 hover:bg-blue-50">
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                {hasTeam && (
                  <DropdownMenuItem asChild className="text-blue-700 hover:bg-blue-50">
                    <Link to="/my-team" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Mi equipo
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('buttons.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
              <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 hover:text-blue-900">
                <Link to="/login">{t('buttons.login')}</Link>
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/register">{t('buttons.register')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
