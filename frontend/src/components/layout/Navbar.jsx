import { Link, NavLink } from 'react-router-dom';
import { Bot, User, Settings, LogOut, ChevronDown, Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import NotificationsBell from '../notifications/NotificationsBell';
import { ThemeToggle } from '../ui/theme-toggle';
import { resolveMediaUrl } from '../../lib/apiClient';
import React, { useState } from 'react';

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/posts', key: 'nav.posts' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/sponsors', key: 'nav.sponsors' },
  { to: '/streams', key: 'nav.streams' },
  { to: '/contact', key: 'nav.contact' }
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
  const [isOpen, setIsOpen] = useState(false);

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

  const NavItems = ({ mobile = false }) => (
    <>
      {navLinks.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => mobile && setIsOpen(false)}
          className={({ isActive }) =>
            `transition hover:text-blue-900 dark:hover:text-blue-100 ${isActive ? 'text-blue-900 font-semibold dark:text-blue-100' : ''} ${mobile ? 'text-lg py-2 border-b border-gray-100 w-full dark:border-slate-800' : ''}`
          }
        >
          {t(item.key)}
        </NavLink>
      ))}
      {isAuthenticated && (
        <NavLink
          to="/profile"
          onClick={() => mobile && setIsOpen(false)}
          className={({ isActive }) =>
            `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              isActive
                ? 'border-blue-600 text-blue-900 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-500'
                : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:text-blue-100 dark:hover:bg-slate-800'
            } ${mobile ? 'w-fit mt-4' : ''}`
          }
        >
          {t('nav.profile')}
        </NavLink>
      )}
      {isAuthenticated && hasTeam && (
        <NavLink
          to="/my-team"
          onClick={() => mobile && setIsOpen(false)}
          className={({ isActive }) =>
            `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              isActive
                ? 'border-blue-600 text-blue-900 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-500'
                : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:text-blue-100 dark:hover:bg-slate-800'
            } ${mobile ? 'w-fit mt-2' : ''}`
          }
        >
          Mi equipo
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-blue-200 bg-white/95 backdrop-blur shadow-sm dark:bg-slate-950/95 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6 text-blue-900 dark:text-blue-400" /> : <Menu className="h-6 w-6 text-blue-900 dark:text-blue-400" />}
          </Button>

          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors dark:text-blue-100 dark:hover:text-blue-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
              <Bot className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">RobEurope</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-blue-600 lg:flex dark:text-slate-300">
          <NavItems />
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-blue-900 dark:text-blue-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-50">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-blue-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs leading-none text-blue-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-blue-700 focus:text-blue-900">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 lg:hidden flex flex-col animate-in slide-in-from-left-full duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
                <Bot className="h-6 w-6" />
              </span>
              <span className="font-bold text-xl text-slate-900 dark:text-white">RobEurope</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <NavItems mobile />
          </nav>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
             <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Language</span>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        i18n.language === lang.code
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
                <ThemeToggle />
             </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
