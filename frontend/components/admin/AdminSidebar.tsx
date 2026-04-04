'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Shield, Trophy, ClipboardList,
  Newspaper, Building2, Archive, FileQuestion, ScrollText, LogOut,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  { href: '/admin', key: 'admin.layout.nav.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', key: 'admin.layout.nav.users', icon: Users },
  { href: '/admin/teams', key: 'admin.layout.nav.teams', icon: Shield },
  { href: '/admin/competitions', key: 'admin.layout.nav.competitions', icon: Trophy },
  { href: '/admin/registrations', key: 'admin.layout.nav.registrations', icon: ClipboardList },
  { href: '/admin/posts', key: 'admin.layout.nav.posts', icon: Newspaper },
  { href: '/admin/centers', key: 'admin.layout.nav.centers', icon: Building2 },
  { href: '/admin/archives', key: 'admin.layout.nav.archives', icon: Archive },
  { href: '/admin/requests', key: 'admin.layout.nav.requests', icon: FileQuestion },
  { href: '/admin/logs', key: 'admin.layout.nav.logs', icon: ScrollText },
]

export default function AdminSidebar({ locale }: { locale: string }) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const pathWithoutLocale = pathname.replace(/^\/(es|en|de)/, '') || '/'

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathWithoutLocale === href : pathWithoutLocale.startsWith(href)

  return (
    <aside className="hidden lg:flex fixed left-0 top-1 bottom-0 w-56 flex-col border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 z-40">
      <div className="p-4 border-b border-stone-200 dark:border-stone-800">
        <p className="label-caps text-red-600 dark:text-red-400">{t('admin.layout.title')}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border-l-2',
                active
                  ? 'text-red-700 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.key as any)}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-stone-200 dark:border-stone-800">
        <button
          onClick={async () => { await signOut(); router.push(`/${locale}/login`) }}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('admin.layout.logout')}
        </button>
      </div>
    </aside>
  )
}
