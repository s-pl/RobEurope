'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Newspaper, Trophy, Users, Tv, Image as ImageIcon,
  Archive, Building2, Heart, Mail, MessageSquare,
  ChevronRight, Bot, LogOut, Globe, Settings, Shield,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'

const navLinks = [
  { href: '/', key: 'nav.home', icon: Home },
  { href: '/competitions', key: 'nav.competitions', icon: Trophy },
  { href: '/teams', key: 'nav.teams', icon: Users },
  { href: '/posts', key: 'nav.posts', icon: Newspaper },
  { href: '/streams', key: 'nav.streams', icon: Tv },
  { href: '/gallery', key: 'nav.gallery', icon: ImageIcon },
  { href: '/archive', key: 'nav.archives', icon: Archive },
  { href: '/educational-centers', key: 'nav.educationalCenters', icon: Building2 },
  { href: '/sponsors', key: 'nav.sponsors', icon: Heart },
  { href: '/contact', key: 'nav.contact', icon: Mail },
  { href: '/feedback', key: 'nav.feedback', icon: MessageSquare },
]

const locales = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
]

interface NavLinkItemProps {
  href: string
  icon: React.ElementType
  label: string
  collapsed: boolean
  isActive: boolean
  isAdmin?: boolean
}

function NavLinkItem({ href, icon: Icon, label, collapsed, isActive, isAdmin }: NavLinkItemProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors duration-150 border-l-2 rounded-r-md',
        collapsed && 'justify-center px-2',
        isAdmin
          ? isActive
            ? 'text-amber-700 dark:text-amber-300 border-amber-500 bg-amber-50 dark:bg-amber-950/30'
            : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 border-transparent hover:bg-amber-50 dark:hover:bg-amber-950/20'
          : isActive
            ? 'text-stone-900 dark:text-stone-50 border-blue-600 bg-stone-100 dark:bg-stone-800'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn('truncate transition-all duration-200', collapsed && 'w-0 opacity-0 overflow-hidden')}>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const localeMatch = pathname.match(/^\/(es|en|de)/)
  const currentLocale = localeMatch?.[1] ?? 'es'
  const pathWithoutLocale = pathname.replace(/^\/(es|en|de)/, '') || '/'

  const isActive = (href: string) =>
    href === '/' ? pathWithoutLocale === '/' : pathWithoutLocale.startsWith(href)

  const role = user?.user_metadata?.role ?? user?.app_metadata?.role
  const isAdmin = role === 'super_admin'

  const switchLocale = (locale: string) => router.push(`/${locale}${pathWithoutLocale}`)

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${currentLocale}`)
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name
    ?? `${user?.user_metadata?.first_name ?? ''} ${user?.user_metadata?.last_name ?? ''}`.trim()
    ?? user?.email ?? ''

  const userInitials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture

  return (
    <div
      className="relative hidden lg:block shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: collapsed ? 80 : 256 }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-50 transition-colors shadow-sm"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform duration-200', !collapsed && 'rotate-180')} />
      </button>

      <aside className="h-screen flex flex-col border-r border-stone-200 bg-white dark:bg-stone-950 dark:border-stone-800 sticky top-0 overflow-hidden w-full">
        {/* Logo */}
        <div className={cn('p-5 flex items-center', collapsed ? 'justify-center' : 'gap-2')}>
          <Link
            href={`/${currentLocale}`}
            className="flex items-center gap-2 text-lg font-semibold text-stone-900 hover:text-blue-600 transition-colors dark:text-stone-50 dark:hover:text-blue-400 font-display"
          >
            <Bot className="h-7 w-7 text-blue-600 shrink-0" />
            <span className={cn('transition-all duration-200 whitespace-nowrap', collapsed && 'w-0 opacity-0 overflow-hidden')}>
              RobEurope
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLinkItem
              key={link.href}
              href={`/${currentLocale}${link.href}`}
              icon={link.icon}
              label={t(link.key as any)}
              collapsed={collapsed}
              isActive={isActive(link.href)}
            />
          ))}

          {user && (
            <>
              <NavLinkItem
                href={`/${currentLocale}/profile`}
                icon={Settings}
                label={t('nav.profile')}
                collapsed={collapsed}
                isActive={isActive('/profile')}
              />
              {isAdmin && (
                <NavLinkItem
                  href={`/${currentLocale}/admin`}
                  icon={Shield}
                  label="Admin"
                  collapsed={collapsed}
                  isActive={isActive('/admin')}
                  isAdmin
                />
              )}
            </>
          )}
        </nav>

        {/* Bottom: locale + theme + user */}
        <div className={cn('border-t border-stone-200 dark:border-stone-800 p-3 space-y-2', collapsed && 'px-2')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} className="w-full justify-start gap-2">
                <Globe className="h-4 w-4 shrink-0" />
                <span className={cn('text-xs font-semibold label-caps transition-all duration-200', collapsed && 'w-0 opacity-0 overflow-hidden')}>
                  {currentLocale.toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end">
              {locales.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => switchLocale(l.code)}>
                  {l.label} {currentLocale === l.code && '✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle collapsed={collapsed} />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn('flex w-full items-center gap-3 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors', collapsed && 'justify-center')}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className={cn('min-w-0 text-left transition-all duration-200', collapsed && 'w-0 opacity-0 overflow-hidden')}>
                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">{displayName}</p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">{user.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/${currentLocale}/profile`}>{t('nav.profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size={collapsed ? 'icon' : 'sm'} className="w-full">
              <Link href={`/${currentLocale}/login`}>
                <span className={cn('transition-all duration-200', collapsed && 'w-0 opacity-0 overflow-hidden')}>
                  {t('nav.login')}
                </span>
              </Link>
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}
