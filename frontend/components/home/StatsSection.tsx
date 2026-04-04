import { getTranslations } from 'next-intl/server'
import { Users, Trophy, Eye, Globe } from 'lucide-react'

interface Stats {
  teamsCount?: number
  competitionsCount?: number
  countries?: number
}

const icons = [Users, Trophy, Eye, Globe]

export default async function StatsSection({
  stats,
  locale,
}: {
  stats: Stats | null
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'home.stats' })

  const items = [
    { key: 'teams', value: stats?.teamsCount ?? '—', label: t('teams') },
    { key: 'competitions', value: stats?.competitionsCount ?? '—', label: t('competitions') },
    { key: 'viewers', value: '10K+', label: t('viewers') },
    { key: 'countries', value: stats?.countries ?? '—', label: t('countries') },
  ]

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map(({ key, value, label }, i) => {
        const Icon = icons[i]
        return (
          <div
            key={key}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6 text-center"
          >
            <Icon className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <p className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              {value}
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{label}</p>
          </div>
        )
      })}
    </section>
  )
}
