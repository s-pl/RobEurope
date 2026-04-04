import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'

async function getArchives() {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/archives?limit=50')
    return res?.data ?? []
  } catch { return [] }
}

export default async function ArchivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, archives] = await Promise.all([
    getTranslations({ locale, namespace: 'archives' }),
    getArchives(),
  ])

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">{t('subtitle')}</p>
      </div>

      {(archives as any[]).length === 0 ? (
        <p className="text-stone-400 dark:text-stone-500">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(archives as any[]).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 space-y-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                  {item.title}
                </h2>
                {item.year && (
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {item.year}
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-3">
                  {item.description}
                </p>
              )}
              {item.competition?.title && (
                <p className="text-xs text-stone-400 dark:text-stone-500">{item.competition.title}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
