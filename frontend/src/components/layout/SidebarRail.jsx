import { NavLink, Link } from 'react-router-dom';
import {
  Bot, Home, Trophy, Users, Newspaper, Tv, Image, Archive,
  Building2, Heart, Mail, MessageSquare, User, Shield,
  Building, FileText, Settings, LogOut, LogIn,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTeamContext } from '../../context/TeamContext';
import { resolveMediaUrl } from '../../lib/apiClient';
import { ThemeToggle } from '../ui/theme-toggle';
import NotificationsBell from '../notifications/NotificationsBell';
import { cn } from '../../lib/utils';

const languages = ['es', 'en', 'de'];

/** Single rail tile — icon + hover info panel */
const RailTile = ({ to, icon: Icon, label, desc, end = false, variant = 'default' }) => (
  <div className="group relative flex">
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex h-10 w-16 shrink-0 items-center justify-center transition-colors duration-100',
          variant === 'admin'
            ? isActive
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-amber-600 hover:text-amber-500 dark:hover:text-amber-400'
            : isActive
            ? 'text-stone-900 dark:text-white'
            : 'text-stone-400 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 inset-y-1 w-[3px] bg-stone-900 dark:bg-white" />
          )}
          <Icon className="h-5 w-5" aria-hidden="true" />
        </>
      )}
    </NavLink>

    {/* Hover info panel */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-16 top-0 z-50 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
    >
      <div className="flex min-w-[200px] flex-col justify-center bg-stone-900 px-4 py-3 shadow-2xl border-t border-b border-stone-800">
        <p className="label-caps text-stone-300 leading-none">{label}</p>
        {desc && <p className="mt-1 text-[11px] text-stone-500 leading-snug">{desc}</p>}
      </div>
    </div>
  </div>
);

/** Non-link button tile (for language, logout, etc.) */
const RailButton = ({ icon: Icon, label, desc, onClick, className = '' }) => (
  <div className="group relative flex">
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex h-10 w-16 shrink-0 items-center justify-center text-stone-400 transition-colors duration-100 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200',
        className
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>

    {label && (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-16 top-0 z-50 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        <div className="flex min-w-[180px] flex-col justify-center bg-stone-900 px-4 py-3 shadow-2xl border-t border-b border-stone-800">
          <p className="label-caps text-stone-300 leading-none">{label}</p>
          {desc && <p className="mt-1 text-[11px] text-stone-500">{desc}</p>}
        </div>
      </div>
    )}
  </div>
);

const SidebarRail = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { hasTeam } = useTeamContext();

  const mainNav = [
    { to: '/', icon: Home, label: t('nav.home'), desc: t('nav.homeDesc'), end: true },
    { to: '/competitions', icon: Trophy, label: t('nav.competitions'), desc: t('nav.competitionsDesc') },
    { to: '/teams', icon: Users, label: t('nav.teams'), desc: t('nav.teamsDesc') },
    { to: '/posts', icon: Newspaper, label: t('nav.posts'), desc: t('nav.postsDesc') },
    { to: '/streams', icon: Tv, label: t('nav.streams'), desc: t('nav.streamsDesc') },
    { to: '/gallery', icon: Image, label: t('nav.gallery'), desc: t('nav.galleryDesc') },
    { to: '/archive', icon: Archive, label: t('nav.archives'), desc: t('nav.archivesDesc') },
    { to: '/educational-centers', icon: Building2, label: t('nav.educationalCenters'), desc: t('nav.educationalCentersDesc') },
    { to: '/sponsors', icon: Heart, label: t('nav.sponsors'), desc: t('nav.sponsorsDesc') },
    { to: '/contact', icon: Mail, label: t('nav.contact'), desc: t('nav.contactDesc') },
    { to: '/feedback', icon: MessageSquare, label: t('nav.feedback'), desc: t('nav.feedbackDesc') },
  ];

  const adminNav = [
    { to: '/admin/centers', icon: Building, label: t('nav.manageCenters'), roles: ['center_admin', 'super_admin'] },
    { to: '/admin/archives', icon: Archive, label: t('nav.manageArchives'), roles: ['super_admin'] },
    { to: '/admin/posts', icon: FileText, label: t('nav.managePosts'), roles: ['super_admin'] },
    { to: '/admin/requests', icon: Settings, label: t('nav.adminRequests'), roles: ['super_admin'] },
  ];
  const avatarUrl = resolveMediaUrl(user?.profile_photo_url);

  const userRole = user?.role;
  const isAdmin = userRole === 'center_admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const visibleAdminNav = isAdmin
    ? adminNav.filter(item => item.roles.includes(userRole))
    : [];

  const currentLangIndex = languages.indexOf(i18n.language.split('-')[0]) ?? 0;
  const cycleLang = () => {
    const next = languages[(currentLangIndex + 1) % languages.length];
    i18n.changeLanguage(next);
  };
  const currentLang = languages[Math.max(0, currentLangIndex)].toUpperCase();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-16 flex-col bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 z-40 shrink-0">

      {/* Logo */}
      <Link
        to="/"
        aria-label={t('nav.robeuropeHome')}
        className="flex h-14 w-full shrink-0 items-center justify-center border-b border-stone-200 dark:border-stone-800 text-stone-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-100"
      >
        <Bot className="h-6 w-6" />
      </Link>

      {/* Main nav */}
      <nav
        aria-label={t('nav.primaryNavigation')}
        className="flex flex-1 flex-col py-1"
      >
        {mainNav.map((item) => (
          <RailTile key={item.to} {...item} />
        ))}

        {/* Authenticated nav items */}
        {isAuthenticated && (
          <>
            <div className="my-2 mx-3 h-px bg-stone-200 dark:bg-stone-800" />
            <RailTile to="/profile" icon={User} label={t('nav.profile')} desc={t('nav.profileDesc')} />
            {hasTeam && (
              <RailTile to="/my-team" icon={Shield} label={t('nav.myTeam')} desc={t('nav.myTeamDesc')} />
            )}
          </>
        )}

        {/* Admin nav items */}
        {isAdmin && (
          <>
            <div className="my-2 mx-3 h-px bg-amber-200 dark:bg-amber-900" />
            {visibleAdminNav.map(item => (
              <div key={item.to} className="group relative flex">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-10 w-16 shrink-0 items-center justify-center transition-colors duration-100',
                      isActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-amber-500 dark:text-amber-700 hover:text-amber-600 dark:hover:text-amber-400'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 inset-y-1 w-[3px] bg-amber-400" />}
                      <span className="absolute right-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </NavLink>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-16 top-0 z-50 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
                >
                  <div className="flex min-w-[200px] flex-col justify-center bg-stone-900 px-4 py-3 shadow-2xl border-t border-b border-amber-900/50">
                    <p className="label-caps text-amber-500 leading-none">{item.label}</p>
                    <p className="mt-1 text-[11px] text-stone-500">{t('nav.adminLabel')}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Bottom controls */}
      <div className="flex flex-col items-center border-t border-stone-200 dark:border-stone-800 py-2 gap-0.5">

        {/* Language cycle */}
        <div className="group relative flex">
          <button
            onClick={cycleLang}
            type="button"
            className="flex h-10 w-16 items-center justify-center text-[11px] font-bold tracking-widest text-stone-400 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200 transition-colors duration-100 font-mono"
            aria-label={`Current language: ${currentLang}. Click to change.`}
          >
            {currentLang}
          </button>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-16 bottom-0 z-50 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            <div className="flex min-w-[180px] flex-col justify-center bg-stone-900 px-4 py-3 shadow-2xl border-t border-b border-stone-800">
              <p className="label-caps text-stone-300 leading-none">{t('nav.language')}</p>
              <p className="mt-1 text-[11px] text-stone-500">{t('nav.languageCycleHint')}</p>
            </div>
          </div>
        </div>

        {/* Theme toggle — wrapped to match rail style */}
        <div className="flex h-10 w-16 items-center justify-center [&>button]:text-stone-400 [&>button]:hover:text-stone-800 dark:[&>button]:text-stone-500 dark:[&>button:hover]:text-stone-200 [&>button]:transition-colors [&>button]:duration-100">
          <ThemeToggle />
        </div>

        {/* Notifications */}
        {isAuthenticated && (
          <div className="flex h-10 w-16 items-center justify-center [&>*]:text-stone-400 dark:[&>*]:text-stone-500 [&>button]:hover:text-stone-800 dark:[&>button]:hover:text-stone-200">
            <NotificationsBell />
          </div>
        )}

        {/* User avatar / login */}
        {isAuthenticated ? (
          <div className="group relative flex">
            <Link
              to="/profile"
              className="flex h-10 w-16 items-center justify-center"
              aria-label={t('nav.profile')}
            >
              <div className="h-8 w-8 overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.first_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                  </div>
                )}
              </div>
            </Link>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-16 bottom-0 z-50 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
            >
              <div className="flex min-w-[200px] flex-col bg-stone-900 shadow-2xl border-t border-b border-stone-800">
                <div className="px-4 py-3 border-b border-stone-800">
                  <p className="text-sm font-semibold text-stone-200 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-stone-800 transition-colors duration-100 w-full"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="label-caps">{t('nav.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <RailTile to="/login" icon={LogIn} label={t('nav.login')} desc={t('nav.loginDesc')} />
        )}
      </div>
    </aside>
  );
};

export default SidebarRail;
