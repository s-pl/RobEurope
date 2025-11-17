import { Link, NavLink } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import NotificationsBell from '../notifications/NotificationsBell';
import { resolveMediaUrl } from '../../lib/apiClient';

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
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
      } catch {}
    };
    load();
    return () => { alive = false; };
  }, [api, isAuthenticated]);

  const handleLanguageChange = (event) => {
    const value = event.target.value;
    i18n.changeLanguage(value);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
            <Bot className="h-5 w-5" />
          </span>
          RobEurope
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-500 md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition hover:text-slate-900 ${isActive ? 'text-slate-900' : ''}`
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
                    ? 'border-slate-900 text-slate-900'
                    : 'border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'
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
                    ? 'border-slate-900 text-slate-900'
                    : 'border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'
                }`
              }
            >
              Mi equipo
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <NotificationsBell />
          )}
          <select
            aria-label="Select language"
            value={i18n.language}
            onChange={handleLanguageChange}
            className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900 md:block"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          {isAuthenticated ? (
            <>
              <div className="hidden text-right text-xs leading-tight text-slate-500 sm:block">
                <p className="font-semibold text-slate-900">{user?.first_name ?? user?.username}</p>
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{t('status.connected')}</p>
              </div>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.first_name} className="h-10 w-10 rounded-2xl border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase">
                  {(user?.first_name?.[0] || user?.username?.[0] || 'R').toUpperCase()}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                {t('buttons.logout')}
              </Button>
            </>
          ) : (
            <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t('buttons.login')}</Link>
              </Button>
              <Button size="sm">
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
