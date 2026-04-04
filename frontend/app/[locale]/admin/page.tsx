import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { Users, Trophy, Newspaper, ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin Dashboard' }

async function getStats(accessToken: string) {
  try {
    return await apiRequest<Record<string, number>>('/stats', { accessToken })
  } catch { return null }
}

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const stats = await getStats(session!.access_token)
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' })

  const cards = [
    { key: 'users', icon: Users, value: stats?.usersCount ?? '—' },
    { key: 'competitions', icon: Trophy, value: stats?.competitionsCount ?? '—' },
    { key: 'posts', icon: Newspaper, value: stats?.postsCount ?? '—' },
    { key: 'registrations', icon: ClipboardList, value: stats?.registrationsCount ?? '—' },
  ] as const

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-red-600 dark:text-red-400 mb-1">{t('subtitle')}</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ key, icon: Icon, value }) => (
          <div key={key} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5">
            <Icon className="h-5 w-5 text-red-500 mb-3" />
            <p className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t(`stats.${key}`)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
