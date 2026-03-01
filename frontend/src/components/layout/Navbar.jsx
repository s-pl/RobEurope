import { Link, NavLink } from 'react-router-dom';
import { Bot, User, Settings, LogOut, ChevronDown, Menu, X, Globe, Building2, Archive, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTeamContext } from '../../context/TeamContext';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import NotificationsBell from '../notifications/NotificationsBell';
import { ThemeToggle } from '../ui/theme-toggle';
import { resolveMediaUrl } from '../../lib/apiClient';
import { useState } from 'react';

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
  { to: '/contact', key: 'nav.contact' }
];

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' }
];

const NavItems = ({
  t,
  isAuthenticated,
  hasTeam,
  user,
  onNavigate,
  mobile = false
}) => (
  <>
    {navLinks.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={() => mobile && onNavigate?.()}
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
        onClick={() => mobile && onNavigate?.()}
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
        onClick={() => mobile && onNavigate?.()}
        className={({ isActive }) =>
          `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            isActive
              ? 'border-blue-600 text-blue-900 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-500'
              : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:text-blue-100 dark:hover:bg-slate-800'
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
            {t('nav.adminSection') || 'Administración'}
          </p>
        </div>
        <NavLink
          to="/admin/centers"
          onClick={() => onNavigate?.()}
          className={({ isActive }) =>
            `flex items-center gap-2 py-2 text-lg transition ${
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
                `flex items-center gap-2 py-2 text-lg transition ${
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
                `flex items-center gap-2 py-2 text-lg transition ${
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
              `flex items-center gap-2 py-2 text-lg transition ${
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

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasTeam } = useTeamContext();
  const avatarUrl = resolveMediaUrl(user?.profile_photo_url);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-blue-200 bg-white/95 backdrop-blur shadow-sm dark:bg-slate-950/95 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6 text-blue-900 dark:text-blue-400" aria-hidden="true" />
                <span className="sr-only">{t('nav.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
                    <Bot className="h-5 w-5" />
                  </span>
                  <span>RobEurope</span>
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
                  <div className="flex flex-col gap-2 mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-blue-700 dark:text-blue-400">
                        {t('nav.login')}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {t('nav.register')}
                      </Button>
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2"
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

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-auto">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.language')}</span>
                    <div className="flex gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => i18n.changeLanguage(lang.code)}
                          aria-pressed={i18n.language === lang.code}
                          type="button"
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
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.theme')}</span>
                    <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-blue-900 hover:text-blue-700 transition-colors dark:text-blue-100 dark:hover:text-blue-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
              <Bot className="h-5 w-5" />
            </span>
            <span>RobEurope</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav aria-label={t('nav.primaryNavigation') || 'Primary navigation'} className="hidden items-center gap-6 text-sm font-medium text-blue-600 lg:flex dark:text-slate-300">
          <NavItems t={t} isAuthenticated={isAuthenticated} hasTeam={hasTeam} user={user} />
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-blue-900 dark:text-blue-400" aria-hidden="true" />
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
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-50">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={t('nav.profile')} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      )}
                    </div>
                    <span className="sr-only">{t('nav.userMenu')}</span>
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
                <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900 dark:text-blue-400">
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

      {/* Mobile Menu Overlay - Removed as we use Sheet now */}
    </header>
  );
};

export default Navbar;
