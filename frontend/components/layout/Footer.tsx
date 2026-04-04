import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Bot } from 'lucide-react'

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations('footer')

  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 font-display font-semibold text-stone-900 dark:text-stone-50 mb-3">
              <Bot className="h-6 w-6 text-blue-600" />
              RobEurope
            </Link>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Projects */}
          <div>
            <p className="label-caps text-stone-400 dark:text-stone-500 mb-3">{t('projects')}</p>
            <ul className="space-y-2">
              {[
                { href: '/competitions', label: t('competitions') },
                { href: '/teams', label: t('teams') },
                { href: '/streams', label: t('streaming') },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={`/${locale}${item.href}`} className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="label-caps text-stone-400 dark:text-stone-500 mb-3">{t('resources')}</p>
            <ul className="space-y-2">
              {[
                { href: '/gallery', label: t('gallery') },
                { href: '/sponsors', label: t('sponsors') },
                { href: '/feedback', label: t('feedback') },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={`/${locale}${item.href}`} className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="label-caps text-stone-400 dark:text-stone-500 mb-3">{t('company')}</p>
            <ul className="space-y-2">
              {[
                { href: '/contact', label: t('contact') },
                { href: '/terms', label: t('terms') },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={`/${locale}${item.href}`} className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-200 dark:border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            © {new Date().getFullYear()} RobEurope · {t('copyright')}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">{t('madeWith')}</p>
        </div>
      </div>
    </footer>
  )
}
