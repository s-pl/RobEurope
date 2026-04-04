import { Link, NavLink } from 'react-router-dom';
import { Bot, User, Settings, LogOut, Menu, Globe, Building2, Archive, FileText, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTeamContext } from '../../context/TeamContext';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import NotificationsBell from '../notifications/NotificationsBell';
import { ThemeToggle } from '../ui/theme-toggle';
import { resolveMediaUrl } from '../../lib/apiClient';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/posts', key: 'nav.posts' },
  { to: '/gallery', key: 'nav.gallery' },
  { to: '/archive', key: 'nav.archives' },
  { to: '/educational-centers', key: 'nav.educationalCenters' },
  { to: '/feedback', key: 'nav.feedback' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/sponsors', key: 'nav.sponsors' },
  { to: '/streams', key: 'nav.streams' },
  { to: '/contact', key: 'nav.contact' },
];

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const NavItems = ({
  t,
  isAuthenticated,
  hasTeam,
  user,
  onNavigate,
  mobile = false,
}) => (
  <>
    {navLinks.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={() => mobile && onNavigate?.()}
        className={({ isActive }) =>
          `transition-colors duration-150 hover:text-stone-900 dark:hover:text-stone-50 ${
            isActive
              ? 'text-stone-900 font-semibold dark:text-stone-50'
              : 'text-stone-500 dark:text-stone-400'
          } ${
            mobile
              ? 'text-base py-2 border-b border-stone-200 w-full dark:border-stone-800'
              : ''
          }`
        }
      >
        {t(item.key)}
      </NavLink>
    ))}
    {isAuthenticated && (
      <NavLink
        to="/profile"
        onClick={() => mobile && onNavigate?.()}
        className={({ isActive }) =>
          `rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-150 ${
            isActive
              ? 'border-blue-600 text-stone-900 bg-blue-50 dark:bg-blue-900/20 dark:text-stone-50 dark:border-blue-500'
              : 'border-stone-200 text-stone-600 hover:border-blue-600 hover:text-stone-900 hover:bg-blue-50 dark:border-stone-700 dark:text-stone-400 dark:hover:border-blue-500 dark:hover:text-stone-50 dark:hover:bg-stone-800'
          } ${mobile ? 'w-fit mt-4' : ''}`
        }
      >
        {t('nav.profile')}
      </NavLink>
    )}
    {isAuthenticated && hasTeam && (
      <NavLink
        to="/my-team"
        onClick={() => mobile && onNavigate?.()}
        className={({ isActive }) =>
          `rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-150 ${
            isActive
              ? 'border-blue-600 text-stone-900 bg-blue-50 dark:bg-blue-900/20 dark:text-stone-50 dark:border-blue-500'
              : 'border-stone-200 text-stone-600 hover:border-blue-600 hover:text-stone-900 hover:bg-blue-50 dark:border-stone-700 dark:text-stone-400 dark:hover:border-blue-500 dark:hover:text-stone-50 dark:hover:bg-stone-800'
          } ${mobile ? 'w-fit mt-2' : ''}`
        }
      >
        {t('nav.myTeam')}
      </NavLink>
    )}

    {/* Admin Section for mobile */}
    {isAuthenticated && (user?.role === 'center_admin' || user?.role === 'super_admin') && mobile && (
      <>
        <div className="my-4 border-t-2 border-amber-300 dark:border-amber-700 pt-4">
          <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 mb-2">
            {t('nav.adminSection') || 'Administracion'}
          </p>
        </div>
        <NavLink
          to="/admin/centers"
          onClick={() => onNavigate?.()}
          className={({ isActive }) =>
            `flex items-center gap-2 py-2 text-base transition-colors duration-150 ${
              isActive
                ? 'text-amber-700 font-semibold dark:text-amber-300'
                : 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
            }`
          }
        >
          <Building2 className="h-5 w-5" />
          {t('nav.manageCenters') || 'Gestionar Centros'}
        </NavLink>
        {user?.role === 'super_admin' && (
          <>
            <NavLink
              to="/admin/archives"
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 text-base transition-colors duration-150 ${
                  isActive
                    ? 'text-amber-700 font-semibold dark:text-amber-300'
                    : 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
                }`
              }
            >
              <Archive className="h-5 w-5" />
              {t('nav.manageArchives') || 'Gestionar Archivos'}
            </NavLink>
            <NavLink
              to="/admin/posts"
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 text-base transition-colors duration-150 ${
                  isActive
                    ? 'text-amber-700 font-semibold dark:text-amber-300'
                    : 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
                }`
              }
            >
              <FileText className="h-5 w-5" />
              {t('nav.managePosts') || 'Gestionar Posts'}
            </NavLink>
            <NavLink
              to="/admin/requests"
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 text-base transition-colors duration-150 ${
                  isActive
                    ? 'text-amber-700 font-semibold dark:text-amber-300'
                    : 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
                }`
              }
            >
              <Settings className="h-5 w-5" />
              {t('nav.adminRequests') || 'Solicitudes Admin'}
            </NavLink>
          </>
        )}
      </>
    )}
  </>
);

const MessagesBadge = () => {
  const api = useApi();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      try {
        const data = await api('/conversations');
        const list = Array.isArray(data) ? data : data?.items || [];
        const total = list.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        if (alive) setUnread(total);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [api, user?.id]);

  return (
    <Link to="/messages">
      <Button variant="ghost" size="icon" className="relative overflow-visible">
        <MessageCircle className="h-5 w-5 text-stone-600 dark:text-stone-300" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-blue-500 ring-2 ring-white dark:ring-stone-950 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="sr-only">Messages</span>
      </Button>
    </Link>
  );
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasTeam } = useTeamContext();
  const avatarUrl = resolveMediaUrl(user?.profile_photo_url);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white dark:bg-stone-950 dark:border-stone-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6 text-stone-700 dark:text-stone-300" aria-hidden="true" />
                <span className="sr-only">{t('nav.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col bg-white dark:bg-stone-950">
              <SheetHeader className="p-4 border-b border-stone-200 dark:border-stone-800">
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-[#f8f7f4] text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                    <Bot className="h-5 w-5" />
                  </span>
                  <span
                    className="text-stone-900 dark:text-stone-50"
                    style={{ fontFamily: 'var(--font-display, inherit)' }}
                  >
                    RobEurope
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav aria-label={t('nav.primaryNavigation') || 'Primary navigation'} className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                <NavItems
                  t={t}
                  isAuthenticated={isAuthenticated}
                  hasTeam={hasTeam}
                  user={user}
                  mobile
                  onNavigate={() => setIsOpen(false)}
                />
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start rounded-lg text-stone-700 dark:text-stone-300">
                        {t('nav.login')}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                        {t('nav.register')}
                      </Button>
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 mt-2"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </Button>
                )}
              </nav>

              <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-[#f8f7f4] dark:bg-stone-900 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('nav.language')}</span>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        aria-pressed={i18n.language === lang.code}
                        type="button"
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
                          i18n.language === lang.code
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('nav.theme')}</span>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-stone-900 hover:text-blue-600 transition-colors duration-150 dark:text-stone-50 dark:hover:text-blue-400"
            style={{ fontFamily: 'var(--font-display, inherit)' }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[#f8f7f4] text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              <Bot className="h-5 w-5" />
            </span>
            <span>RobEurope</span>
          </Link>
        </div>

        {/* Desktop Nav - hidden, sidebar handles it */}
        <nav aria-label={t('nav.primaryNavigation') || 'Primary navigation'} className="hidden items-center gap-6 text-sm font-medium text-stone-500 lg:flex dark:text-stone-400">
          <NavItems t={t} isAuthenticated={isAuthenticated} hasTeam={hasTeam} user={user} />
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-stone-600 dark:text-stone-400" aria-hidden="true" />
                <span className="sr-only">{t('nav.language')}</span>
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
              <MessagesBadge />
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-lg">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-[#f8f7f4] dark:border-stone-700 dark:bg-stone-900">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={t('nav.profile')} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-stone-400" aria-hidden="true" />
                      )}
                    </div>
                    <span className="sr-only">{t('nav.userMenu')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-stone-900 dark:text-stone-50">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs leading-none text-stone-500 dark:text-stone-400">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-stone-700 dark:text-stone-300">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-lg text-stone-700 hover:text-stone-900 dark:text-stone-300">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
