'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Globe, LogOut, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'

const navLinks = [
  { href: '/', key: 'nav.home' },
  { href: '/competitions', key: 'nav.competitions' },
  { href: '/teams', key: 'nav.teams' },
  { href: '/posts', key: 'nav.posts' },
  { href: '/streams', key: 'nav.streams' },
  { href: '/gallery', key: 'nav.gallery' },
  { href: '/archive', key: 'nav.archives' },
  { href: '/educational-centers', key: 'nav.educationalCenters' },
  { href: '/sponsors', key: 'nav.sponsors' },
  { href: '/contact', key: 'nav.contact' },
]

const locales = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
]

export default function Navbar() {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const localeMatch = pathname.match(/^\/(es|en|de)/)
  const currentLocale = localeMatch?.[1] ?? 'es'
  const pathWithoutLocale = pathname.replace(/^\/(es|en|de)/, '') || '/'
  const isActive = (href: string) =>
    href === '/' ? pathWithoutLocale === '/' : pathWithoutLocale.startsWith(href)

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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-950">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('nav.menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-6 border-b border-stone-200 dark:border-stone-800">
            <SheetTitle className="flex items-center gap-2 font-display">
              <Bot className="h-6 w-6 text-blue-600" /> RobEurope
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={`/${currentLocale}${link.href}`} onClick={() => setOpen(false)}
                className={cn('px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(link.href)
                    ? 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-50'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50'
                )}>
                {t(link.key as any)}
              </Link>
            ))}
            {user && (
              <Link href={`/${currentLocale}/profile`} onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50">
                {t('nav.profile')}
              </Link>
            )}
          </nav>
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
            <ThemeToggle />
            {user ? (
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4" /> {t('nav.logout')}
              </button>
            ) : (
              <Button asChild variant="default" size="sm" className="w-full">
                <Link href={`/${currentLocale}/login`}>{t('nav.login')}</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Link href={`/${currentLocale}`}
        className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-50 font-display">
        <Bot className="h-6 w-6 text-blue-600" />
        <span>RobEurope</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><Globe className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((l) => (
              <DropdownMenuItem key={l.code} onClick={() => switchLocale(l.code)}>
                {l.label} {currentLocale === l.code && '✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/${currentLocale}/profile`}>
                  <Settings className="h-4 w-4 mr-2" />{t('nav.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />{t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm">
            <Link href={`/${currentLocale}/login`}>{t('nav.login')}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
